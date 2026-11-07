import YahooFinance from "yahoo-finance2";

let client;
export function getYahoo() {
  if (!client) client = new YahooFinance();
  return client;
}

export function periodToStart(period = "2y") {
  const n = parseInt(period, 10);
  const days = period?.endsWith("mo") ? n * 30 : n * 365;
  const cutoff = new Date(Date.now() - days * 86400 * 1000);
  return cutoff.toISOString().slice(0, 10);
}

export async function fetchHistory(ticker, period = "2y", interval = "1d") {
  const yahoo = getYahoo();
  const result = await yahoo.chart(ticker, {
    period1: periodToStart(period),
    interval,
  });
  const rows = (result && result.quotes) || [];
  return rows
    .filter((r) => r && Number.isFinite(r.close))
    .map((r) => ({
      date: (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10),
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.adjclose ?? r.close,
      volume: r.volume ?? 0,
    }));
}
