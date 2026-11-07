import { fetchQuotes } from "../../../lib/yahoo";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const list = searchParams.get("tickers")
    ?.split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => /^[A-Z0-9.^=_/-]{1,18}$/.test(ticker))
    .slice(0, 30) || [];

  if (list.length === 0) return marketJson({ quotes: [], unavailableSymbols: [] }, { sMaxAge: 10, staleWhileRevalidate: 30 });

  let providerQuotes = [];
  try {
    providerQuotes = await fetchQuotes(list);
  } catch {
    return marketJson({ error: "Provider quotes are temporarily unavailable.", quotes: [], unavailableSymbols: list }, { status: 502 });
  }
  const quoteMap = new Map(providerQuotes.map((quote) => [quote?.symbol, quote]));
  const quotes = list.flatMap((symbol) => {
    const quote = quoteMap.get(symbol);
    if (!quote || !Number.isFinite(quote.regularMarketPrice)) return [];
    return [{
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || symbol,
      price: quote.regularMarketPrice,
      changePercent: Number.isFinite(quote.regularMarketChangePercent) ? quote.regularMarketChangePercent : null,
      currency: quote.currency || null,
      exchange: quote.fullExchangeName || quote.exchange || null,
    }];
  });
  const availableSymbols = new Set(quotes.map((quote) => quote.symbol));
  const unavailableSymbols = list.filter((symbol) => !availableSymbols.has(symbol));

  if (quotes.length === 0) {
    return marketJson({ error: "No provider quotes are currently available.", quotes: [], unavailableSymbols }, { status: 502 });
  }
  return marketJson({ quotes, unavailableSymbols }, { sMaxAge: 15, staleWhileRevalidate: 45 });
}
