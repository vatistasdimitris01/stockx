import { fetchHistory, fetchQuote } from "../../../lib/yahoo";
import { sma, rsi, macd, bollinger, annualVolatility, logReturns } from "../../../lib/indicators";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const period = searchParams.get("period") || "2y";
  const interval = searchParams.get("interval") || "1d";

  if (!ticker) return marketJson({ error: "Missing ticker" }, { status: 400 });
  if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)) return marketJson({ error: "Invalid ticker" }, { status: 400 });
  if (!["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"].includes(period)) return marketJson({ error: "Invalid historical period" }, { status: 400 });
  if (!["1d", "1wk"].includes(interval)) return marketJson({ error: "Invalid historical interval" }, { status: 400 });

  try {
    const [history, quoteResult] = await Promise.all([
      fetchHistory(ticker, period, interval),
      fetchQuote(ticker).catch(() => null),
    ]);
    const closes = history.map((row) => row.close);
    if (closes.length < 40) return marketJson({ error: "Insufficient provider history" }, { status: 400 });

    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const { macdLine, signalLine } = macd(closes);
    const { upper: bbUpper, lower: bbLower } = bollinger(closes, 20, 2);
    const volatility = annualVolatility(logReturns(closes.slice(-260)));
    const quote = quoteResult ? {
      symbol: quoteResult.symbol || ticker,
      currency: quoteResult.currency || null,
      exchange: quoteResult.fullExchangeName || quoteResult.exchange || null,
      price: Number.isFinite(quoteResult.regularMarketPrice) ? quoteResult.regularMarketPrice : null,
      change: Number.isFinite(quoteResult.regularMarketChange) ? quoteResult.regularMarketChange : null,
      changePercent: Number.isFinite(quoteResult.regularMarketChangePercent) ? quoteResult.regularMarketChangePercent : null,
      dayHigh: Number.isFinite(quoteResult.regularMarketDayHigh) ? quoteResult.regularMarketDayHigh : null,
      dayLow: Number.isFinite(quoteResult.regularMarketDayLow) ? quoteResult.regularMarketDayLow : null,
      name: quoteResult.longName || quoteResult.shortName || quoteResult.symbol || ticker,
    } : null;

    return marketJson({
      ticker,
      quote,
      annualVolatility: volatility,
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
    }, { sMaxAge: 60, staleWhileRevalidate: 300 });
  } catch (error) {
    return marketJson({ error: error?.message || "Failed to load provider price history" }, { status: 502 });
  }
}
