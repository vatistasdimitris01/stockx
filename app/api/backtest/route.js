import { fetchHistory } from "../../../lib/yahoo";
import { maBacktest } from "../../../lib/backtest";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const fast = Number(searchParams.get("fast") || 20);
  const slow = Number(searchParams.get("slow") || 50);

  if (!ticker) return marketJson({ error: "Missing ticker" }, { status: 400 });
  if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)) return marketJson({ error: "Invalid ticker" }, { status: 400 });
  if (!Number.isInteger(fast) || !Number.isInteger(slow) || fast < 2 || slow < 3 || fast >= slow || slow > 300) {
    return marketJson({ error: "Fast and slow periods are invalid; fast must be smaller than slow." }, { status: 400 });
  }

  try {
    const history = await fetchHistory(ticker, "2y", "1d");
    const closes = history.map((row) => row.close);
    if (closes.length < slow + 2) return marketJson({ error: "Insufficient provider history for this backtest." }, { status: 400 });
    const result = maBacktest(closes, fast, slow);
    if (!result) return marketJson({ error: "Insufficient provider history for this backtest." }, { status: 400 });
    return marketJson({
      ticker,
      source: "Yahoo Finance historical closes",
      fast,
      slow,
      strategyReturn: result.strategyReturn,
      buyHoldReturn: result.buyHoldReturn,
      maxDrawdown: result.maxDrawdown,
      sharpe: result.sharpe,
      equity: result.equity.map((item) => ({
        date: history[item.date]?.date ?? String(item.date),
        strategy: item.strategy,
        buyHold: item.buyHold,
      })),
    }, { sMaxAge: 300, staleWhileRevalidate: 900 });
  } catch (error) {
    return marketJson({ error: error?.message || "Backtest history is unavailable from the provider." }, { status: 502 });
  }
}
