import { NextResponse } from "next/server";
import { fetchHistory } from "../../../lib/yahoo";
import { forecastSeries } from "../../../lib/forecast";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  const horizon = Number(searchParams.get("horizon") || 20);

  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  try {
    const history = await fetchHistory(ticker, "2y", "1d");
    const closes = history.map((r) => r.close);
    if (closes.length < 40) {
      return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
    }
    const result = forecastSeries(closes, horizon);
    return NextResponse.json({
      ticker,
      ...result,
      models: [
        { method: "Trend regression (log)", price: result.trendPrice, change: (result.trendPrice / result.last - 1) * 100 },
        { method: "EMA trend", price: result.emaPrice, change: (result.emaPrice / result.last - 1) * 100 },
      ],
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Forecast failed" }, { status: 502 });
  }
}
