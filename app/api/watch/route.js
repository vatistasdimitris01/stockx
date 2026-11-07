import { NextResponse } from "next/server";
import { getYahoo } from "../../../lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const list =
    searchParams
      .get("tickers")
      ?.split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 30) || [];

  if (list.length === 0) return NextResponse.json({ quotes: [] });

  try {
    const results = await Promise.allSettled(list.map((t) => getYahoo().quote(t)));
    const quotes = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => {
        const q = r.value;
        return {
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          changePercent: q.regularMarketChangePercent,
        };
      });
    return NextResponse.json({ quotes });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 502 });
  }
}
