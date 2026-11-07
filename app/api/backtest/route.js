import { NextResponse } from "next/server";
import { fetchHistory } from "../../../lib/yahoo";
import { maBacktest } from "../../../lib/backtest";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const fast = Math.max(2, Math.min(200, Number(searchParams.get("fast") || 20)));
  const slow = Math.max(3, Math.min(300, Number(searchParams.get("slow") || 50)));

  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  try {
    const history = await fetchHistory(ticker, "2y", "1d");
    const closes = history.map((r) => r.close);
    if (closes.length < slow + 2) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
    }
    const result = maBacktest(closes, fast, slow);
    if (!result) return NextResponse.json({ error: "Need more data" }, { status: 400 });
    return NextResponse.json({
      ticker,
      fast,
      slow,
      strategyReturn: result.strategyReturn,
      buyHoldReturn: result.buyHoldReturn,
      maxDrawdown: result.maxDrawdown,
      sharpe: result.sharpe,
      equity: result.equity.map((e) => ({
        date: history[e.date]?.date ?? String(e.date),
        strategy: e.strategy,
        buyHold: e.buyHold,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Backtest failed" }, { status: 502 });
  }
}
