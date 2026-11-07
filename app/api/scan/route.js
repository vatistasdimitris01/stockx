import { NextResponse } from "next/server";
import { fetchHistory } from "../../../lib/yahoo";
import { rsi, sma, annualVolatility, logReturns } from "../../../lib/indicators";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbols =
    searchParams
      .get("symbols")
      ?.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 12) || [];

  const results = [];
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        const history = await fetchHistory(symbol, "6mo", "1d");
        const closes = history.map((r) => r.close);
        if (closes.length < 40) return;
        const last = closes[closes.length - 1];
        const rsiVals = rsi(closes, 14);
        const s20 = sma(closes, 20);
        const s50 = sma(closes, 50);
        results.push({
          symbol,
          price: last,
          rsi: rsiVals[rsiVals.length - 1],
          sma20: s20[s20.length - 1],
          sma50: s50[s50.length - 1],
          volatility: annualVolatility(logReturns(closes)),
          aboveSma20: last > s20[s20.length - 1],
          aboveSma50: last > s50[s50.length - 1],
        });
      } catch {
        /* symbol not usable */
      }
    })
  );

  return NextResponse.json({ results });
}
