import { fetchHistory } from "../../../lib/yahoo";
import { rsi, sma, annualVolatility, logReturns } from "../../../lib/indicators";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("symbols") || "";
  const symbols = [...new Set(raw.split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.^=_/-]{1,18}$/.test(symbol)))].slice(0, 12);
  if (symbols.length === 0) return marketJson({ error: "Enter one or more valid stock symbols to scan.", results: [] }, { status: 400 });

  const settled = await Promise.allSettled(symbols.map(async (symbol) => {
    const history = await fetchHistory(symbol, "6mo", "1d");
    const closes = history.map((row) => row.close);
    if (closes.length < 40) throw new Error("Insufficient provider history.");
    const last = closes[closes.length - 1];
    const rsiValues = rsi(closes, 14);
    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    return {
      symbol,
      lastClose: last,
      rsi: rsiValues.at(-1),
      sma20: sma20.at(-1),
      sma50: sma50.at(-1),
      volatility: annualVolatility(logReturns(closes)),
      aboveSma20: last > sma20.at(-1),
      aboveSma50: last > sma50.at(-1),
    };
  }));

  const results = [];
  const unavailableSymbols = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") results.push(result.value);
    else unavailableSymbols.push(symbols[index]);
  });
  if (results.length === 0) return marketJson({ error: "No usable historical data was returned by the provider.", results: [], unavailableSymbols }, { status: 502 });
  return marketJson({ results, unavailableSymbols }, { sMaxAge: 60, staleWhileRevalidate: 180 });
}
