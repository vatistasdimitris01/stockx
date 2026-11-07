import { getYahoo, fetchQuote, cacheProviderCall, networkOptions } from "../../../lib/yahoo";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  if (!ticker) return marketJson({ error: "Missing ticker" }, { status: 400 });
  if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)) return marketJson({ error: "Invalid ticker" }, { status: 400 });

  const [quoteResult, profileResult] = await Promise.allSettled([
    fetchQuote(ticker),
    cacheProviderCall(`company-profile:${ticker}`, 60 * 60_000, () => getYahoo().quoteSummary(ticker, {
      modules: ["assetProfile", "price", "summaryDetail", "defaultKeyStatistics"],
    }, networkOptions(7_000))),
  ]);
  const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const data = profileResult.status === "fulfilled" ? profileResult.value : null;

  if (!quote && !data) return marketJson({ error: "Company data is unavailable from the provider." }, { status: 502 });

  const profile = data?.assetProfile || {};
  const summary = data?.summaryDetail || {};
  const statistics = data?.defaultKeyStatistics || {};
  const result = {
    symbol: ticker,
    name: quote?.longName || quote?.shortName || data?.price?.shortName || ticker,
    exchange: quote?.fullExchangeName || quote?.exchange || null,
    currency: quote?.currency || data?.price?.currency || null,
    marketCap: summary.marketCap ?? statistics.marketCap ?? quote?.marketCap ?? null,
    sector: profile.sector || null,
    industry: profile.industry || null,
    longBusinessSummary: profile.longBusinessSummary || null,
    website: profile.website || null,
    city: profile.city || null,
    country: profile.country || null,
    fullTimeEmployees: profile.fullTimeEmployees || null,
    fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: summary.fiftyTwoWeekLow ?? null,
    averageVolume: summary.averageVolume ?? null,
    trailingPE: statistics.trailingPE ?? summary.trailingPE ?? null,
    forwardPE: statistics.forwardPE ?? summary.forwardPE ?? null,
    dividendYield: summary.dividendYield ?? null,
  };

  return marketJson(result, { sMaxAge: 3600, staleWhileRevalidate: 21_600 });
}
