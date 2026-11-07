import { fetchHistory } from "../../../lib/yahoo";
import { forecastSeries } from "../../../lib/forecast";
import { marketJson } from "../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const horizon = Number(searchParams.get("horizon") || 20);

  if (!ticker) return marketJson({ error: "Missing ticker" }, { status: 400 });
  if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)) return marketJson({ error: "Invalid ticker" }, { status: 400 });
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 252) return marketJson({ error: "Invalid forecast horizon" }, { status: 400 });

  try {
    const history = await fetchHistory(ticker, "2y", "1d");
    const closes = history.map((row) => row.close);
    if (closes.length < 40) return marketJson({ error: "Insufficient provider history for a statistical estimate." }, { status: 400 });
    const result = forecastSeries(closes, horizon);
    return marketJson({
      ticker,
      source: "Yahoo Finance historical closes",
      ...result,
      models: [
        { method: "Trend regression (log)", price: result.trendPrice, change: (result.trendPrice / result.last - 1) * 100 },
        { method: "EMA trend", price: result.emaPrice, change: (result.emaPrice / result.last - 1) * 100 },
      ],
    }, { sMaxAge: 300, staleWhileRevalidate: 900 });
  } catch (error) {
    return marketJson({ error: error?.message || "Forecast history is unavailable from the provider." }, { status: 502 });
  }
}
