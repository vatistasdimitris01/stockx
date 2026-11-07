import { NextResponse } from "next/server";
import { getYahoo } from "../../../lib/yahoo";

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

export async function GET() {
  const yahoo = getYahoo();
  const results = await Promise.allSettled(
    INSTRUMENTS.map(async (item) => {
      const q = await yahoo.quote(item.symbol);
      return {
        ...item,
        price: q?.regularMarketPrice,
        changePercent: q?.regularMarketChangePercent,
      };
    })
  );
  const snapshot = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  return NextResponse.json({ snapshot });
}
