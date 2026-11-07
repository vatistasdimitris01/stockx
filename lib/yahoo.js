import YahooFinance from "yahoo-finance2";

let client;
const responseCache = new Map();
const inFlight = new Map();
const MAX_ENTRIES = 300;

export function getYahoo() {
  if (!client) {
    client = new YahooFinance({
      queue: { concurrency: 6, interval: 0 },
      suppressNotices: ["yahooSurvey"],
    });
  }
  return client;
}

export function networkOptions(timeoutMs = 7_000) {
  return { fetchOptions: { signal: AbortSignal.timeout(timeoutMs) } };
}

export function cacheProviderCall(key, ttlMs, load) {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (cached && now - cached.savedAt < ttlMs) return Promise.resolve(cached.value);
  if (inFlight.has(key)) return inFlight.get(key);

  const request = Promise.resolve()
    .then(load)
    .then((value) => {
      responseCache.set(key, { value, savedAt: Date.now() });
      if (responseCache.size > MAX_ENTRIES) {
        const oldest = [...responseCache.entries()]
          .sort((a, b) => a[1].savedAt - b[1].savedAt)
          .slice(0, responseCache.size - MAX_ENTRIES);
        for (const [oldKey] of oldest) responseCache.delete(oldKey);
      }
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
}

export function periodToStart(period = "2y") {
  const n = parseInt(period, 10);
  const days = period?.endsWith("mo") ? n * 30 : n * 365;
  const cutoff = new Date(Date.now() - days * 86400 * 1000);
  return cutoff.toISOString().slice(0, 10);
}

export function fetchQuotes(tickers) {
  const symbols = [...new Set((Array.isArray(tickers) ? tickers : [tickers])
    .map((ticker) => String(ticker || "").trim().toUpperCase())
    .filter((ticker) => /^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)))].slice(0, 30);
  if (!symbols.length) return Promise.resolve([]);

  const cacheKey = [...symbols].sort().join(",");
  return cacheProviderCall(`quotes:${cacheKey}`, 15_000, () =>
    getYahoo().quote(symbols, {}, networkOptions(7_000))
  );
}

export async function fetchQuote(ticker) {
  const symbol = String(ticker || "").trim().toUpperCase();
  if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(symbol)) return null;
  const quotes = await fetchQuotes([symbol]);
  return quotes.find((quote) => quote?.symbol === symbol) || null;
}

export async function fetchHistory(ticker, period = "2y", interval = "1d") {
  const symbol = String(ticker || "").trim().toUpperCase();
  const key = `history:${symbol}:${period}:${interval}`;
  return cacheProviderCall(key, 300_000, async () => {
    const result = await getYahoo().chart(symbol, {
      period1: periodToStart(period),
      interval,
    }, networkOptions(8_000));
    const rows = (result && result.quotes) || [];
    return rows
      .filter((row) => row && Number.isFinite(row.close))
      .map((row) => ({
        date: (row.date instanceof Date ? row.date : new Date(row.date)).toISOString().slice(0, 10),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.adjclose ?? row.close,
        volume: row.volume ?? 0,
      }));
  });
}

export function fetchSearch(query) {
  const value = String(query || "").trim();
  if (!value) return Promise.resolve({ quotes: [] });
  return cacheProviderCall(`search:${value.toLowerCase()}`, 30_000, () =>
    getYahoo().search(value, {
      quotesCount: 12,
      newsCount: 0,
      enableCb: false,
      enableNavLinks: false,
    }, networkOptions(5_000))
  );
}
