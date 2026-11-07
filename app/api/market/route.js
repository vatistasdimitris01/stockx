import { fetchQuotes } from "../../../lib/yahoo";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

const INSTRUMENTS = [
  { symbol: "^GSPC", name: "S&P 500", group: "Indices" },
  { symbol: "^IXIC", name: "NASDAQ", group: "Indices" },
  { symbol: "^DJI", name: "Dow Jones", group: "Indices" },
  { symbol: "^N225", name: "Nikkei 225", group: "Indices" },
  { symbol: "GC=F", name: "Gold", group: "Commodities" },
  { symbol: "CL=F", name: "Crude Oil", group: "Commodities" },
  { symbol: "EURUSD=X", name: "EUR/USD", group: "Forex" },
  { symbol: "JPY=X", name: "USD/JPY", group: "Forex" },
  { symbol: "BTC-USD", name: "Bitcoin", group: "Crypto" },
  { symbol: "ETH-USD", name: "Ethereum", group: "Crypto" },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedGroup = searchParams.get("group");
  const instruments = requestedGroup
    ? INSTRUMENTS.filter((item) => item.group.toLowerCase() === requestedGroup.toLowerCase())
    : INSTRUMENTS;

  let providerQuotes = [];
  try {
    if (instruments.length) providerQuotes = await fetchQuotes(instruments.map((item) => item.symbol));
  } catch {
    return marketJson({ error: "Benchmark data is temporarily unavailable from the provider.", snapshot: [], unavailableSymbols: instruments.map((item) => item.symbol) }, { status: 502 });
  }
  const quoteMap = new Map(providerQuotes.map((quote) => [quote?.symbol, quote]));
  const snapshot = instruments.flatMap((item) => {
    const quote = quoteMap.get(item.symbol);
    if (!quote || !Number.isFinite(quote.regularMarketPrice)) return [];
    return [{
      ...item,
      price: quote.regularMarketPrice,
      changePercent: Number.isFinite(quote.regularMarketChangePercent) ? quote.regularMarketChangePercent : null,
    }];
  });
  const availableSymbols = new Set(snapshot.map((item) => item.symbol));
  const unavailableSymbols = instruments.filter((item) => !availableSymbols.has(item.symbol)).map((item) => item.symbol);

  if (instruments.length > 0 && snapshot.length === 0) {
    return marketJson({ error: "Benchmark data is unavailable from the provider.", snapshot: [], unavailableSymbols }, { status: 502 });
  }
  return marketJson({ snapshot, unavailableSymbols }, { sMaxAge: 15, staleWhileRevalidate: 45 });
}
