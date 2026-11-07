import { NextResponse } from "next/server";
import { getYahoo } from "../../../lib/yahoo";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const res = await getYahoo().search(q);
    const results =
      res?.quotes
        ?.filter((item) => item.symbol || item.shortname)
        .slice(0, 12)
        .map((item) => ({
          symbol: item.symbol,
          name: item.longname || item.shortname || item.symbol,
          type: item.quoteType,
          exchange: item.exchDisp || item.exchange,
        })) || [];
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Search failed" }, { status: 502 });
  }
}
