"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";

const PAGES = [
  { label: "Overview", value: "overview" },
  { label: "Markets", value: "markets" },
  { label: "Chart Analysis", value: "chart" },
  { label: "Predictions", value: "predictions" },
  { label: "Market Scanner", value: "scanner" },
  { label: "Backtesting", value: "backtest" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Settings", value: "settings" },
];

const INDICATORS = ["RSI", "MACD", "Bollinger", "SMA20", "SMA50", "Volatility"];

const QUICK = ["AAPL", "MSFT", "NVDA", "TSLA"];

export default function Sidebar({
  state,
  setState,
  onSetTicker,
  onRefresh,
  onToggle,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [watch, setWatch] = useState([]);

  const periodOptions = ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => {});
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    fetch(`/api/watch?tickers=${QUICK.join(",")}`)
      .then((r) => r.json())
      .then((d) => setWatch(d.quotes || []))
      .catch(() => {});
  }, []);

  const pageMatches = useMemo(
    () => PAGES.filter((p) => query && p.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const indMatches = useMemo(
    () => INDICATORS.filter((i) => query && i.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        background: "var(--surface)",
        borderRight: "none",
        padding: "24px 18px",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#fff",
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="monitor" size={18} stroke={2.2} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>StocksX</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Market intelligence</div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="search" size={14} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Universal search</span>
      </div>
      <input
        className="input"
        placeholder="Symbols, pages, indicators..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      {query.length > 0 && (
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {results.map((r) => (
            <button
              key={`${r.symbol}-${r.name}`}
              onClick={() => {
                onSetTicker(r.symbol);
                setQuery("");
                setResults([]);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                width: "100%",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <span style={{ fontSize: 13 }}>{r.symbol}</span>
              <span className="muted" style={{ fontSize: 11 }}>{r.name}</span>
            </button>
          ))}
          {pageMatches.map((p) => (
            <button
              key={`page-${p.value}`}
              onClick={() => {
                setState({ ...state, tab: p.value });
                setQuery("");
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <span style={{ fontSize: 13 }}>{p.label}</span>
              <span className="muted" style={{ fontSize: 11 }}>Page</span>
            </button>
          ))}
          {indMatches.map((i) => (
            <button
              key={`ind-${i}`}
              onClick={() => {
                setState({ ...state, tab: "chart" });
                setQuery("");
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <span style={{ fontSize: 13 }}>{i}</span>
              <span className="muted" style={{ fontSize: 11 }}>Indicator</span>
            </button>
          ))}
          {results.length === 0 && pageMatches.length === 0 && indMatches.length === 0 && (
            <div style={{ padding: "10px" }} className="muted">
              No matches found.
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="star" size={14} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Watchlist</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {watch.map((w) => (
          <button
            key={w.symbol}
            onClick={() => onSetTicker(w.symbol)}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: "var(--surface-2)",
              color: "var(--text)",
              cursor: "pointer",
              minWidth: 70,
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600 }}>{w.symbol}</span>
            <span
              className="muted"
              style={{
                fontSize: 11,
                color: (w.changePercent ?? 0) >= 0 ? "var(--up)" : "var(--down)",
              }}
            >
              {w.price?.toFixed(2)} · {(w.changePercent ?? 0) >= 0 ? "+" : ""}
              {(w.changePercent ?? 0)?.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="quote" size={14} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Market</span>
      </div>
      <input
        className="input"
        value={state.ticker}
        onChange={(e) => setState({ ...state, ticker: e.target.value.toUpperCase() })}
        placeholder="Ticker"
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <label style={{ flex: 1 }}>
          <div className="muted" style={{ marginBottom: 4 }}>Period</div>
          <select
            className="select"
            value={state.period}
            onChange={(e) => setState({ ...state, period: e.target.value })}
          >
            {periodOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <div className="muted" style={{ marginBottom: 4 }}>Interval</div>
          <select
            className="select"
            value={state.interval}
            onChange={(e) => setState({ ...state, interval: e.target.value })}
          >
            <option value="1d">1d</option>
            <option value="1wk">1wk</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="chart" size={14} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Chart</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {["Candlestick", "Line"].map((s) => (
          <button
            key={s}
            onClick={() => setState({ ...state, chartStyle: s })}
            style={{
              flex: 1,
              padding: "7px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--border-strong)",
              background: state.chartStyle === s ? "#fff" : "var(--surface-2)",
              color: state.chartStyle === s ? "#000" : "var(--text)",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={state.showMA}
          onChange={(e) => setState({ ...state, showMA: e.target.checked })}
        />
        <span className="fs-13">Show moving averages</span>
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Icon name="insights" size={14} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Forecast</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <label style={{ flex: 1 }}>
          <div className="muted" style={{ marginBottom: 4 }}>Horizon</div>
          <select
            className="select"
            value={state.horizon}
            onChange={(e) => setState({ ...state, horizon: Number(e.target.value) })}
          >
            {[1, 5, 10, 20, 60].map((h) => (
              <option key={h} value={h}>{h}d</option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <div className="muted" style={{ marginBottom: 4 }}>Simulation</div>
          <select
            className="select"
            value={state.simulation}
            onChange={(e) => setState({ ...state, simulation: e.target.value })}
          >
            <option value="deterministic">Deterministic</option>
            <option value="monte-carlo">Monte Carlo</option>
          </select>
        </label>
      </div>

      <button
        onClick={onRefresh}
        style={{
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "9px 12px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "#fff",
          color: "#000",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <Icon name="refresh" size={14} /> Refresh data
      </button>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

      <details>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          Engine details
        </summary>
        <div className="muted" style={{ padding: "4px 0" }}>
          Deterministic statistical forecasting (regression + EMA). No LLM, no simulation.
        </div>
        <div className="muted" style={{ padding: "4px 0" }}>Technical analysis: RSI, MACD, BB</div>
        <div className="muted" style={{ padding: "4px 0" }}>Data: Yahoo Finance</div>
      </details>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          How to use
        </summary>
        <ol className="muted" style={{ paddingLeft: 18, margin: 0 }}>
          <li>Search or enter a ticker symbol.</li>
          <li>Pick period and timeframe.</li>
          <li>Explore tabs for charts, predictions, scanner and backtests.</li>
          <li>Adjust forecast horizon as needed.</li>
        </ol>
      </details>
    </aside>
  );
}
