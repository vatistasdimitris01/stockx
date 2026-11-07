import { NextResponse } from "next/server";
import { fetchHistory, getYahoo } from "../../../lib/yahoo";
import { sma, rsi, macd, bollinger, annualVolatility, logReturns } from "../../../lib/indicators";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const period = searchParams.get("period") || "2y";
  const interval = searchParams.get("interval") || "1d";

  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  try {
    const history = await fetchHistory(ticker, period, interval);
    const closes = history.map((r) => r.close);
    if (closes.length < 40) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
    }

    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const { macdLine, signalLine } = macd(closes);
    const { upper: bbUpper, lower: bbLower } = bollinger(closes, 20, 2);
    const vol = annualVolatility(logReturns(closes.slice(-260)));

    let quote = null;
    try {
      const q = await getYahoo().quote(ticker);
      quote = {
        symbol: q.symbol,
        currency: q.currency,
        exchange: q.fullExchangeName || q.exchange,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        name: q.longName || q.shortName || q.symbol,
      };
    } catch {
      quote = null;
    }

    return NextResponse.json({
      ticker,
      quote,
      annualVolatility: vol,
      history,
      indicators: {
        sma20,
        sma50,
        rsi: rsi14,
        macd: macdLine,
        macdSignal: signalLine,
        bbUpper,
        bbLower,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to load market data" },
      { status: 502 }
    );
  }
}
