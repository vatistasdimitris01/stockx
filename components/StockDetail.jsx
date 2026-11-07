"use client";

import { useEffect } from "react";
import { useAppShell } from "./AppShell";
import { useCachedJson } from "../lib/useCachedJson";
import { OverviewTab } from "./TabContent";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];

function normalizeTicker(value) {
  try {
    return decodeURIComponent(value || "").trim().toUpperCase();
  } catch {
    return String(value || "").trim().toUpperCase();
  }
}

function formatMoney(value, currency) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency || ""} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`.trim();
  }
}

function formatCompact(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <div className="stock-stat-card">
      <span>{label}</span>
      <strong className={tone || ""}>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function CompanyProfile({ company, loading, error }) {
  if (loading && !company) return <section className="card company-card"><div className="eyebrow">COMPANY PROFILE</div><p className="muted">Loading provider profile…</p></section>;
  if (!company && error) return <section className="card company-card"><div className="eyebrow">COMPANY PROFILE</div><p className="state-error">{error}</p><p className="muted">No substitute company data is shown.</p></section>;
  const summary = company?.longBusinessSummary;
  const website = company?.website ? (/^https?:\/\//i.test(company.website) ? company.website : `https://${company.website}`) : null;

  return (
    <div className="stock-detail-aside">
      {error && <div className="data-warning">Profile refresh failed; displaying the last provider response.</div>}
      <section className="card company-card">
        <div className="eyebrow">COMPANY PROFILE</div>
        <h2>About {company?.name || company?.symbol || "this company"}</h2>
        <p>{summary || "A business description is not available from the market-data provider for this symbol."}</p>
        {website && <a className="external-link" href={website} target="_blank" rel="noreferrer">Company website <span aria-hidden="true">↗</span></a>}
      </section>

      <section className="card company-card">
        <div className="eyebrow">RELATED INFORMATION</div>
        <div className="profile-facts">
          <div><span>Sector</span><strong>{company?.sector || "—"}</strong></div>
          <div><span>Industry</span><strong>{company?.industry || "—"}</strong></div>
          <div><span>Exchange</span><strong>{company?.exchange || "—"}</strong></div>
          <div><span>Headquarters</span><strong>{[company?.city, company?.country].filter(Boolean).join(", ") || "—"}</strong></div>
          <div><span>Employees</span><strong>{company?.fullTimeEmployees ? formatCompact(company.fullTimeEmployees) : "—"}</strong></div>
          <div><span>Market capitalization</span><strong>{company?.marketCap ? formatCompact(company.marketCap) : "—"}</strong></div>
        </div>
      </section>

      <section className="card company-card">
        <div className="eyebrow">VALUATION & RANGE</div>
        <div className="profile-facts">
          <div><span>52-week high</span><strong>{company?.fiftyTwoWeekHigh ? formatMoney(company.fiftyTwoWeekHigh, company?.currency) : "—"}</strong></div>
          <div><span>52-week low</span><strong>{company?.fiftyTwoWeekLow ? formatMoney(company.fiftyTwoWeekLow, company?.currency) : "—"}</strong></div>
          <div><span>Trailing P/E</span><strong>{typeof company?.trailingPE === "number" ? company.trailingPE.toFixed(2) : "—"}</strong></div>
          <div><span>Forward P/E</span><strong>{typeof company?.forwardPE === "number" ? company.forwardPE.toFixed(2) : "—"}</strong></div>
          <div><span>Dividend yield</span><strong>{typeof company?.dividendYield === "number" ? `${(company.dividendYield * 100).toFixed(2)}%` : "—"}</strong></div>
          <div><span>Average volume</span><strong>{company?.averageVolume ? formatCompact(company.averageVolume) : "—"}</strong></div>
        </div>
      </section>
    </div>
  );
}

export default function StockDetail({ ticker }) {
  const { preferences, setPreferences, watchlist, toggleWatchlist, navigate, markInitialDataSettled } = useAppShell();
  const symbol = normalizeTicker(ticker);
  const pricesUrl = `/api/prices?ticker=${encodeURIComponent(symbol)}&period=${encodeURIComponent(preferences.period)}&interval=${encodeURIComponent(preferences.interval)}`;
  const companyUrl = `/api/company?ticker=${encodeURIComponent(symbol)}`;
  const pricesResource = useCachedJson(pricesUrl, { maxAgeMs: 5 * 60_000, timeoutMs: 10_000 });
  const companyResource = useCachedJson(companyUrl, { maxAgeMs: 60 * 60_000, timeoutMs: 10_000 });

  useEffect(() => {
    if (!pricesResource.loading) markInitialDataSettled();
  }, [pricesResource.loading, markInitialDataSettled]);

  const prices = pricesResource.data;
  const company = companyResource.data;
  const quote = prices?.quote;
  const name = quote?.name || company?.name || symbol;
  const change = quote?.changePercent;
  const changeTone = typeof change === "number" ? (change >= 0 ? "up" : "down") : "muted";
  const isSaved = watchlist.includes(symbol);
  const latestDate = prices?.history?.at(-1)?.date || "—";
  const displayTime = formatTime(pricesResource.fetchedAt);

  return (
    <div className="stock-page">
      <div className="stock-breadcrumb"><button type="button" onClick={() => navigate("home")}>Watchlist</button><span aria-hidden="true">/</span><span>{symbol}</span></div>
      <div className="stock-page-heading">
        <div>
          <div className="eyebrow">EQUITY / STOCK RESEARCH</div>
          <h1>{name}</h1>
          <div className="stock-symbol-line"><span>{symbol}</span>{(quote?.exchange || company?.exchange) && <span>{quote?.exchange || company?.exchange}</span>}{company?.sector && <span>{company.sector}</span>}</div>
        </div>
        <div className="stock-actions">
          <button type="button" className={isSaved ? "button-secondary is-saved" : "button-secondary"} onClick={() => toggleWatchlist(symbol)}>
            <span aria-hidden="true">{isSaved ? "★" : "☆"}</span>{isSaved ? "In watchlist" : "Add to watchlist"}
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate("chart", { ticker: symbol })}>Open chart analysis <span aria-hidden="true">→</span></button>
        </div>
      </div>

      {pricesResource.error && <div className={`data-warning${!prices ? " is-error" : ""}`} role={prices ? "status" : "alert"}>{pricesResource.error}{prices ? " — showing the last actual provider response." : " No substitute price history is shown."}</div>}
      <section className="stock-quote-panel">
        <div className="stock-price-block">
          <span className="eyebrow">LATEST PROVIDER QUOTE</span>
          <strong>{formatMoney(quote?.price, quote?.currency || company?.currency)}</strong>
          <span className={`stock-change ${changeTone}`}>
            {typeof quote?.change === "number" ? `${quote.change > 0 ? "+" : ""}${formatMoney(quote.change, quote?.currency)}` : "Quote unavailable"}
            {typeof change === "number" ? ` (${change > 0 ? "+" : ""}${change.toFixed(2)}%)` : ""}
          </span>
        </div>
        <div className="stock-quote-meta"><span>Historical data through</span><strong>{latestDate}</strong></div>
        <div className="stock-quote-meta"><span>Currency</span><strong>{quote?.currency || company?.currency || "—"}</strong></div>
        <div className="stock-quote-meta"><span>Response received</span><strong>{displayTime || "—"}</strong></div>
      </section>
      <div className={`data-freshness${pricesResource.stale ? " is-stale" : ""}`}>
        <span>{pricesResource.stale || pricesResource.fromCache ? "Cached provider data" : "Yahoo Finance response"}</span>
        {pricesResource.refreshing && <span>· Refreshing</span>}
        {companyResource.fetchedAt && <span>· Profile {companyResource.stale || companyResource.fromCache ? "cached" : "received"} {formatTime(companyResource.fetchedAt)}</span>}
        {companyResource.refreshing && <span>· Refreshing profile</span>}
      </div>

      <div className="stock-range-row">
        <div><h2>Price & statistics</h2><p>Historical provider prices rendered with the existing chart and indicators.</p></div>
        <div className="range-pills" aria-label="Historical period">
          {PERIODS.map((period) => <button type="button" key={period} className={preferences.period === period ? "is-selected" : ""} onClick={() => setPreferences((current) => ({ ...current, period }))}>{period}</button>)}
        </div>
      </div>

      {!prices && pricesResource.loading && <div className="chart-loading">Loading real price history…</div>}
      {!prices && !pricesResource.loading && <div className="state-panel state-error">{pricesResource.error || "Price history is unavailable from the provider."}</div>}
      {prices && <div className="stock-detail-grid">
        <div className="stock-chart-column">
          <div className="stock-day-stats">
            <MetricCard label="Day high" value={formatMoney(quote?.dayHigh, quote?.currency)} />
            <MetricCard label="Day low" value={formatMoney(quote?.dayLow, quote?.currency)} />
            <MetricCard label="Annual volatility" value={typeof prices.annualVolatility === "number" ? `${(prices.annualVolatility * 100).toFixed(1)}%` : "—"} />
          </div>
          <div className="stock-chart-wrap">
            <OverviewTab data={prices} loading={false} error={null} chartStyle={preferences.chartStyle} showMA={preferences.showMA} />
          </div>
        </div>
        <CompanyProfile company={company} loading={companyResource.loading} error={companyResource.error} />
      </div>}

      <div className="research-note stock-disclaimer">Quotes and company information come from Yahoo Finance and may be delayed, incomplete, or unavailable. Historical response time: {displayTime || "not available"}. This research page does not place trades.</div>
    </div>
  );
}
