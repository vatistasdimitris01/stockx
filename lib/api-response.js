import { NextResponse } from "next/server";

export function marketJson(payload, {
  status = 200,
  sMaxAge = 15,
  staleWhileRevalidate = 60,
} = {}) {
  const cacheControl = status >= 400
    ? "no-store"
    : `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": cacheControl },
  });
}
