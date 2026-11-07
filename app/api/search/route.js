import { fetchSearch } from "../../../lib/yahoo";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim().slice(0, 100);
  if (!query) return marketJson({ results: [] }, { sMaxAge: 30, staleWhileRevalidate: 60 });

  try {
    const response = await fetchSearch(query);
    const results = (response?.quotes || [])
      .filter((item) => item.symbol || item.shortname)
      .slice(0, 12)
      .map((item) => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || item.symbol,
        type: item.quoteType,
        exchange: item.exchDisp || item.exchange,
      }));
    return marketJson({ results }, { sMaxAge: 30, staleWhileRevalidate: 60 });
  } catch (error) {
    return marketJson({ error: error?.message || "Stock search is unavailable from the provider." }, { status: 502 });
  }
}
