"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { fetchCachedJson, useCachedJson } from "../lib/useCachedJson";

const ChartLoading = ({ height = 260 }) => <div className="chart-loading" style={{ minHeight: height }}>Loading chart modules…</div>;
const CandleChart = dynamic(() => import("./CandleChart"), { ssr: false, loading: () => <ChartLoading height={380} /> });
const PriceArea = dynamic(() => import("./Charts").then((module) => module.PriceArea), { ssr: false, loading: () => <ChartLoading /> });
const MultiLine = dynamic(() => import("./Charts").then((module) => module.MultiLine), { ssr: false, loading: () => <ChartLoading /> });
const RsiChart = dynamic(() => import("./Charts").then((module) => module.RsiChart), { ssr: false, loading: () => <ChartLoading /> });
const MacdChart = dynamic(() => import("./Charts").then((module) => module.MacdChart), { ssr: false, loading: () => <ChartLoading /> });
const VolumeChart = dynamic(() => import("./Charts").then((module) => module.VolumeChart), { ssr: false, loading: () => <ChartLoading height={180} /> });
const EquityChart = dynamic(() => import("./Charts").then((module) => module.EquityChart), { ssr: false, loading: () => <ChartLoading /> });

const fmt = (v, digits = 2) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";

const pct = (v) =>
  typeof v === "number" && Number.isFinite(v) ? `${(v > 0 ? "+" : "")}${v.toFixed(2)}%` : "—";

function Metric({ label, value, sub, tone }) {
  return (
    <div className="card metric" style={{ flex: 1 }}>
      <label>{label}</label>
      <b className={tone || ""}>{value}</b>
      {sub ? <span className="muted">{sub}</span> : null}
    </div>
  );
}

function Freshness({ resource }) {
  if (!resource?.fetchedAt) return null;
  const date = new Date(resource.fetchedAt);
  if (Number.isNaN(date.getTime())) return null;
  const label = resource.stale ? "Cached data · stale" : resource.fromCache ? "Cached data" : "Provider response";
  return (
    <div className={`data-freshness${resource.stale ? " is-stale" : ""}`}>
      <span>{label}</span>
      <span>·</span>
      <time dateTime={date.toISOString()}>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
      {resource.refreshing && <span>· Refreshing</span>}
    </div>
  );
}

export function Header({ ticker, quote, annualVolatility }) {
  const up = (quote?.changePercent ?? 0) >= 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="muted" style={{ marginBottom: 6 }}>
        MARKET OVERVIEW / QUANTITATIVE RESEARCH
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
        {ticker} · {quote?.name}
      </h1>
      <div className="muted" style={{ fontSize: 13 }}>
        Your quantitative market intelligence workspace.
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <Metric
          label="Latest close"
          value={fmt(quote?.price)}
          sub={`${up ? "+" : ""}${fmt(quote?.changePercent)}%`}
          tone={up ? "up" : "down"}
        />
        <Metric label="Day high" value={fmt(quote?.dayHigh)} />
        <Metric label="Day low" value={fmt(quote?.dayLow)} />
        <Metric label="Annual volatility" value={`${fmt(annualVolatility * 100, 1)}%`} />
      </div>
    </div>
  );
}

export function OverviewTab({ data, loading, error, chartStyle = "Candlestick", showMA = true }) {
  if (loading) return <div className="muted">Loading...</div>;
  if (error) return <div className="down fs-13">{error}</div>;
  if (!data) return null;
  const rows = data.history.map((h, i) => ({
    ...h,
    sma20: data.indicators.sma20[i],
    sma50: data.indicators.sma50[i],
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="overview-price-stat-grid">
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Price performance</div>
          {chartStyle === "Candlestick" ? (
            <CandleChart
              data={rows}
              showMA={showMA}
              sma20={rows.map((r) => r.sma20)}
              sma50={rows.map((r) => r.sma50)}
            />
          ) : (
            <PriceArea data={rows} />
          )}
        </div>
        <div className="card overview-statistics-card">
          <div className="overview-statistics-heading">Statistics</div>
          <Metric label="52-week high" value={fmt(Math.max(...rows.slice(-252).map((r) => r.high)))} />
          <Metric label="52-week low" value={fmt(Math.min(...rows.slice(-252).map((r) => r.low)))} />
          <Metric label="Avg volume" value={fmt(rows.slice(-20).reduce((a, r) => a + (r.volume || 0), 0) / 20, 0)} />
          <Metric label="Observations" value={fmt(rows.length, 0)} />
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Trading volume</div>
        <VolumeChart data={rows} />
      </div>
    </div>
  );
}

export function MarketsTab() {
  const resource = useCachedJson("/api/market", { maxAgeMs: 20_000, timeoutMs: 8_000 });
  const snap = resource.data?.snapshot || [];
  if (!resource.data && resource.loading) return <div className="state-panel">Loading provider market data…</div>;
  if (!resource.data) return <div className="state-panel state-error">{resource.error || "Market data is unavailable from the provider."}</div>;
  return (
    <div>
      {resource.error && <div className="data-warning">{resource.error} — showing the last actual provider response.</div>}
      {resource.data.unavailableSymbols?.length > 0 && <div className="data-warning">No current quote for {resource.data.unavailableSymbols.join(", ")}.</div>}
      <Freshness resource={resource} />
      <div className="card responsive-table-scroll" style={{ padding: 0 }}>
      <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "12px 16px" }}>Instrument</th>
            <th style={{ textAlign: "left", padding: "12px 16px" }}>Symbol</th>
            <th style={{ textAlign: "right", padding: "12px 16px" }}>Price</th>
            <th style={{ textAlign: "right", padding: "12px 16px" }}>Change %</th>
          </tr>
        </thead>
        <tbody>
          {snap.map((s) => (
            <tr key={s.symbol} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "12px 16px" }}>{s.name}</td>
              <td className="muted" style={{ padding: "12px 16px" }}>{s.symbol}</td>
              <td style={{ textAlign: "right", padding: "12px 16px", fontVariantNumeric: "tabular-nums" }}>{fmt(s.price)}</td>
              <td
                style={{
                  textAlign: "right",
                  padding: "12px 16px",
                  color: (s.changePercent ?? 0) >= 0 ? "var(--up)" : "var(--down)",
                }}
              >
                {pct(s.changePercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function ChartTab({ data, loading, error, section = "" }) {
  React.useEffect(() => {
    if (!section) return;
    const target = document.getElementById(`chart-section-${section}`);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [section, data]);
  if (loading) return <div className="muted">Loading...</div>;
  if (error) return <div className="down fs-13">{error}</div>;
  if (!data) return null;
  const rows = data.history.map((h, i) => ({
    date: h.date,
    close: h.close,
    sma20: data.indicators.sma20[i],
    sma50: data.indicators.sma50[i],
    bbUpper: data.indicators.bbUpper[i],
    bbLower: data.indicators.bbLower[i],
    rsi: data.indicators.rsi[i],
    macd: data.indicators.macd[i],
    macdSignal: data.indicators.macdSignal[i],
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card chart-section-anchor" id="chart-section-bands">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Signal layers (close / SMA / BB)</div>
        <MultiLine
          data={rows}
          keys={[
            { key: "close", name: "Close" },
            { key: "sma20", name: "SMA 20" },
            { key: "sma50", name: "SMA 50" },
            { key: "bbUpper", name: "BB upper" },
            { key: "bbLower", name: "BB lower" },
          ]}
        />
      </div>
      <div className="chart-indicator-grid">
        <div className="card chart-section-anchor" id="chart-section-rsi">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>RSI (14)</div>
          <RsiChart data={rows} />
        </div>
        <div className="card chart-section-anchor" id="chart-section-macd">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>MACD (12, 26, 9)</div>
          <MacdChart data={rows} />
        </div>
      </div>
      <div className="card chart-section-anchor" id="chart-section-volume">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Trading volume</div>
        <VolumeChart data={rows} />
      </div>
    </div>
  );
}

export function PredictionsTab({ data, loading, error, horizon }) {
  if (loading) return <div className="muted">Loading...</div>;
  if (error) return <div className="down fs-13">{error}</div>;
  if (!data) return null;
  const tone = data.action === "BUY" ? "signal-buy" : data.action === "SELL" ? "signal-sell" : "signal-hold";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span className={`signal ${tone}`}>Statistical signal: {data.action}</span>
        <span style={{ marginLeft: "auto" }}>
          <Metric label="Confidence" value={`${Math.round(data.confidence)}%`} />
        </span>
        <span>
          <Metric label="Horizon" value={`${data.horizon}d`} />
        </span>
      </div>
      <div className="fs-13" style={{ color: "var(--text)" }}>{data.reason}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Metric label="Ensemble expected return" value={pct(data.ensembleReturn * 100)} />
        <Metric label="Trend forecast" value={fmt(data.trendPrice)} />
        <Metric label="EMA forecast" value={fmt(data.emaPrice)} />
        <Metric label="Last close" value={fmt(data.last)} />
      </div>
      <div className="muted fs-12">
        Estimate from historical provider prices (linear regression + EMA). Confidence is a heuristic, not a probability or trade instruction.
      </div>
    </div>
  );
}

export function ScannerTab() {
  const [symbols, setSymbols] = React.useState("");
  const [rows, setRows] = React.useState(null);
  const [freshness, setFreshness] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const requestRef = React.useRef(null);

  React.useEffect(() => () => requestRef.current?.abort(), []);

  const run = async () => {
    const normalized = [...new Set(symbols.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean))];
    if (!normalized.length) {
      setError("Enter one or more stock symbols to scan.");
      setRows(null);
      setFreshness(null);
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setRows(null);
    setFreshness(null);
    setError("");
    try {
      const response = await fetchCachedJson(`/api/scan?symbols=${encodeURIComponent(normalized.join(","))}`, { maxAgeMs: 60_000, timeoutMs: 10_000, signal: controller.signal });
      setRows(response.data.results || []);
      setFreshness(response);
      if (response.error) setError(response.error);
      else if (response.data.unavailableSymbols?.length) setError(`No provider history for ${response.data.unavailableSymbols.join(", ")}.`);
    } catch (cause) {
      if (cause.name !== "AbortError") setError(cause.message || "Provider history could not be loaded.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="muted fs-13">
        Scan symbols you enter using real historical prices. No default symbols or sample results are loaded.
      </div>
      <div className="scanner-controls">
        <input className="input" aria-label="Symbols to scan" value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="Enter symbols separated by commas" />
        <button
          onClick={run}
          disabled={loading || !symbols.trim()}
          style={{
            whiteSpace: "nowrap",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-strong)",
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Run scan
        </button>
      </div>
      {loading && <div className="muted">Loading provider history…</div>}
      {error && <div className="data-warning is-error" role="alert">{error}</div>}
      <Freshness resource={freshness} />
      {rows && (
        <div className="card responsive-table-scroll" style={{ padding: 0 }}>
          <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>Symbol</th>
                <th style={{ textAlign: "right", padding: "12px 16px" }}>Last close</th>
                <th style={{ textAlign: "right", padding: "12px 16px" }}>RSI</th>
                <th style={{ textAlign: "right", padding: "12px 16px" }}>Vol %</th>
                <th style={{ textAlign: "center", padding: "12px 16px" }}>Above SMA20</th>
                <th style={{ textAlign: "center", padding: "12px 16px" }}>Above SMA50</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>{r.symbol}</td>
                  <td style={{ textAlign: "right", padding: "12px 16px" }}>{fmt(r.lastClose)}</td>
                  <td style={{ textAlign: "right", padding: "12px 16px" }}>{fmt(r.rsi, 1)}</td>
                  <td style={{ textAlign: "right", padding: "12px 16px" }}>{fmt(r.volatility * 100, 1)}</td>
                  <td style={{ textAlign: "center", padding: "12px 16px", color: r.aboveSma20 ? "var(--up)" : "var(--down)" }}>
                    {r.aboveSma20 ? "Yes" : "No"}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px 16px", color: r.aboveSma50 ? "var(--up)" : "var(--down)" }}>
                    {r.aboveSma50 ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows && !rows.length && !loading && !error && <div className="state-panel">No symbols returned usable provider history.</div>}
    </div>
  );
}

export function BacktestTab({ ticker }) {
  const [fast, setFast] = React.useState(20);
  const [slow, setSlow] = React.useState(50);
  const validPeriods = fast >= 2 && slow >= 3 && fast < slow && slow <= 300;
  const url = ticker && validPeriods ? `/api/backtest?ticker=${encodeURIComponent(ticker)}&fast=${fast}&slow=${slow}` : null;
  const resource = useCachedJson(url, { enabled: Boolean(url), maxAgeMs: 5 * 60_000, timeoutMs: 10_000 });
  const result = resource.data;
  const error = validPeriods ? resource.error : "Fast period must be smaller than slow period.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="muted fs-13">Historical moving-average backtest for {ticker}. Results are hypothetical, use provider history, exclude trading costs, and do not place orders.</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          <div className="muted" style={{ marginBottom: 4 }}>Fast MA</div>
          <input
            type="number"
            className="input"
            style={{ width: 110 }}
            value={fast}
            onChange={(e) => setFast(Number(e.target.value))}
          />
        </label>
        <label>
          <div className="muted" style={{ marginBottom: 4 }}>Slow MA</div>
          <input
            type="number"
            className="input"
            style={{ width: 110 }}
            value={slow}
            onChange={(e) => setSlow(Number(e.target.value))}
          />
        </label>
      </div>
      {resource.loading && !result && <div className="muted">Loading historical prices and calculating…</div>}
      {error && <div className="fs-13 warn" style={{ color: "var(--warn)" }}>{error}</div>}
      {result && resource.error && <div className="data-warning">{resource.error} — showing the last calculation from real historical prices.</div>}
      <Freshness resource={resource} />
      {result && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Metric label="Strategy return" value={pct(result.strategyReturn * 100)} />
            <Metric label="Buy & hold" value={pct(result.buyHoldReturn * 100)} />
            <Metric label="Max drawdown" value={pct(result.maxDrawdown * 100)} />
            <Metric label="Sharpe" value={fmt(result.sharpe)} />
          </div>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Equity curve</div>
            <EquityChart data={result.equity} />
          </div>
        </>
      )}
    </div>
  );
}

export function PortfolioTab() {
  const [rows, setRows] = React.useState([{ symbol: "", quantity: "", avgCost: "" }]);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const updateRow = (index, field, value) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));

  const calc = async () => {
    const entered = rows.filter((row) => row.symbol.trim() || row.quantity !== "" || row.avgCost !== "");
    if (!entered.length || entered.some((row) => !row.symbol.trim() || row.quantity === "" || row.avgCost === "")) {
      setError("Enter a symbol, positive quantity, and average cost for every position.");
      setResult(null);
      return;
    }
    const validRows = entered.map((row) => ({ symbol: row.symbol.trim().toUpperCase(), quantity: Number(row.quantity), avgCost: Number(row.avgCost) }));
    if (!validRows.length || validRows.some((row) => !/^[A-Z0-9.^=_/-]{1,18}$/.test(row.symbol) || !Number.isFinite(row.quantity) || row.quantity <= 0 || !Number.isFinite(row.avgCost) || row.avgCost < 0)) {
      setError("Enter a valid symbol, positive quantity, and average cost for each row.");
      setResult(null);
      return;
    }
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const tickers = [...new Set(validRows.map((row) => row.symbol))];
      const response = await fetchCachedJson(`/api/watch?tickers=${encodeURIComponent(tickers.join(","))}`, { maxAgeMs: 15_000, timeoutMs: 10_000 });
      const quoteMap = new Map((response.data.quotes || []).map((quote) => [quote.symbol, quote]));
      const missing = tickers.filter((symbol) => !Number.isFinite(quoteMap.get(symbol)?.price));
      if (missing.length) throw new Error(`No real provider quote for ${missing.join(", ")}. No portfolio value was calculated.`);
      const currencies = [...new Set(validRows.map((row) => quoteMap.get(row.symbol)?.currency).filter(Boolean))];
      if (currencies.length !== 1) throw new Error("Provider currency is unavailable or mixed. No currency conversion is assumed, so no combined value was calculated.");
      const holdings = validRows.map((row) => {
        const quote = quoteMap.get(row.symbol);
        const value = quote.price * row.quantity;
        const pnl = (quote.price - row.avgCost) * row.quantity;
        const pnlPercent = row.avgCost > 0 ? ((quote.price - row.avgCost) / row.avgCost) * 100 : null;
        return { ...row, price: quote.price, currency: quote.currency, value, pnl, pnlPercent };
      });
      setResult({ holdings, total: holdings.reduce((sum, holding) => sum + holding.value, 0), currency: currencies[0] || "", fetchedAt: response.fetchedAt, stale: response.stale, fromCache: response.fromCache });
      if (response.error) setError(response.error);
    } catch (cause) {
      setError(cause.message || "Provider quotes could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="muted fs-13">Hypothetical calculator only. Quotes come from the provider; quantities and cost basis are your inputs. No broker, account connection, or orders.</div>
      <div className="card" style={{ padding: 12 }}>
        <div className="portfolio-input-list">
          {rows.map((row, index) => (
            <div className="portfolio-input-row" key={index} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 2fr) repeat(2, minmax(90px, 1fr)) auto", gap: 8, alignItems: "end", marginBottom: 8 }}>
              <label>
                <span className="muted" style={{ display: "block", marginBottom: 4 }}>Symbol</span>
                <input className="input" aria-label={`Stock symbol row ${index + 1}`} value={row.symbol} placeholder="Stock symbol" onChange={(event) => updateRow(index, "symbol", event.target.value.toUpperCase())} />
              </label>
              <label>
                <span className="muted" style={{ display: "block", marginBottom: 4 }}>Quantity</span>
                <input type="number" min="0" step="any" className="input" aria-label={`Quantity row ${index + 1}`} value={row.quantity} onChange={(event) => updateRow(index, "quantity", event.target.value)} />
              </label>
              <label>
                <span className="muted" style={{ display: "block", marginBottom: 4 }}>Average cost</span>
                <input type="number" min="0" step="any" className="input" aria-label={`Average cost row ${index + 1}`} value={row.avgCost} onChange={(event) => updateRow(index, "avgCost", event.target.value)} />
              </label>
              <button type="button" className="button-secondary portfolio-remove-row" aria-label={`Remove row ${index + 1}`} onClick={() => setRows((current) => current.length === 1 ? [{ symbol: "", quantity: "", avgCost: "" }] : current.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
            </div>
          ))}
        </div>
        <button onClick={() => setRows((r) => [...r, { symbol: "", quantity: "", avgCost: "" }])}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}>
          Add row
        </button>
      </div>
      <button onClick={calc} disabled={loading}
        style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "#fff", color: "#000", fontWeight: 600, cursor: "pointer" }}>
        Calculate portfolio
      </button>
      {loading && <div className="muted">Fetching real provider quotes…</div>}
      {error && <div className="data-warning is-error" role="alert">{error}</div>}
      {result && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Metric label="Hypothetical total value" value={`${result.currency || "—"} ${fmt(result.total)}`} sub={`${result.stale ? "Stale cached data" : result.fromCache ? "Cached provider response" : "Provider response"} · ${new Date(result.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`} />
          {result.holdings.map((h) => (
            <Metric key={h.symbol} label={h.symbol} value={`${h.currency || "—"} ${fmt(h.value)}`} sub={`P/L ${h.currency || "—"} ${fmt(h.pnl)}${h.pnlPercent === null ? " · cost basis not set" : ` (${pct(h.pnlPercent)})`}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsTab() {
  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>Application settings</div>
      <div className="muted" style={{ marginBottom: 6 }}>Engine: deterministic statistical forecasting (regression + EMA). No LLMs.</div>
      <div className="muted" style={{ marginBottom: 6 }}>Data provider: Yahoo Finance (serverless route)</div>
      <div className="muted" style={{ marginBottom: 6 }}>Storage: local browser name, watchlist, settings, and bounded market-data cache; no account sync</div>
      <div className="muted" style={{ marginBottom: 6 }}>Broker: disabled</div>
      <div className="muted" style={{ marginBottom: 12 }}>AI APIs: none</div>
    </div>
  );
}
