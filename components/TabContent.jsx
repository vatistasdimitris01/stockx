"use client";

import * as React from "react";
import CandleChart from "./CandleChart";
import { PriceArea, MultiLine, RsiChart, MacdChart, VolumeChart, EquityChart } from "./Charts";

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
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16 }}>
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
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Statistics</div>
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
  const [snap, setSnap] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/market").then((r) => r.json()).then((d) => setSnap(d.snapshot || [])).catch(() => {});
  }, []);
  if (!snap) return <div className="muted">Loading markets...</div>;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
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
  );
}

export function ChartTab({ data, loading, error }) {
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
      <div className="card">
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>RSI (14)</div>
          <RsiChart data={rows} />
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>MACD (12, 26, 9)</div>
          <MacdChart data={rows} />
        </div>
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
        <span className={`signal ${tone}`}>AI action: {data.action}</span>
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
        Deterministic statistical forecast (linear regression + EMA). No LLMs, no simulation.
      </div>
    </div>
  );
}

export function ScannerTab() {
  const [symbols, setSymbols] = React.useState("AAPL, MSFT, NVDA, TSLA, AMZN, META, GOOGL, SPY, QQQ");
  const [rows, setRows] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const run = async () => {
    setLoading(true);
    setRows(null);
    try {
      const r = await fetch(`/api/scan?symbols=${encodeURIComponent(symbols)}`);
      const d = await r.json();
      setRows(d.results || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="muted fs-13">
        Scan a selection of liquid symbols for momentum, volatility and volume.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="input" value={symbols} onChange={(e) => setSymbols(e.target.value)} />
        <button
          onClick={run}
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
      {loading && <div className="muted">Scanning...</div>}
      {rows && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>Symbol</th>
                <th style={{ textAlign: "right", padding: "12px 16px" }}>Price</th>
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
                  <td style={{ textAlign: "right", padding: "12px 16px" }}>{fmt(r.price)}</td>
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
    </div>
  );
}

export function BacktestTab({ ticker }) {
  const [fast, setFast] = React.useState(20);
  const [slow, setSlow] = React.useState(50);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!ticker) return;
    if (fast >= slow) {
      setError("Fast period must be smaller than slow period.");
      setResult(null);
      return;
    }
    setError(null);
    setLoading(true);
    fetch(`/api/backtest?ticker=${ticker}&fast=${fast}&slow=${slow}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setResult(d);
      })
      .catch(() => setError("Backtest failed"))
      .finally(() => setLoading(false));
  }, [ticker, fast, slow]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="muted fs-13">Strategy laboratory · moving-average crossover</div>
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
      {loading && <div className="muted">Running backtest...</div>}
      {error && <div className="fs-13 warn" style={{ color: "var(--warn)" }}>{error}</div>}
      {result && !error && (
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

export function PortfolioTab({ defaultTicker }) {
  const [rows, setRows] = React.useState([
    { symbol: defaultTicker, quantity: 1, avgCost: 0 },
  ]);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const calc = async () => {
    setLoading(true);
    setResult(null);
    try {
      const quotes = await Promise.allSettled(
        rows.map((r) =>
          fetch(`/api/watch?tickers=${r.symbol}`).then((resp) => resp.json())
        )
      );
      let total = 0;
      const filled = rows.map((r, i) => {
        const q = quotes[i]?.value?.quotes?.[0];
        const price = q?.price;
        const value = (price || 0) * r.quantity;
        const pnl = ((price || 0) - r.avgCost) * r.quantity;
        total += value;
        return { ...r, price, value, pnl };
      });
      setResult({ holdings: filled, total });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="muted fs-13">Hypothetical portfolio simulator. No broker or orders.</div>
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 2 }}>
            <div className="muted" style={{ marginBottom: 4 }}>Symbol</div>
            <input className="input" value={rows[rows.length - 1]?.symbol || ""}
              onChange={(e) => setRows((r) => r.map((x, i) => (i === r.length - 1 ? { ...x, symbol: e.target.value.toUpperCase() } : x)))} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ marginBottom: 4 }}>Qty</div>
            <input type="number" className="input" value={rows[rows.length - 1]?.quantity || ""}
              onChange={(e) => setRows((r) => r.map((x, i) => (i === r.length - 1 ? { ...x, quantity: Number(e.target.value) } : x)))} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ marginBottom: 4 }}>Avg cost</div>
            <input type="number" className="input" value={rows[rows.length - 1]?.avgCost || ""}
              onChange={(e) => setRows((r) => r.map((x, i) => (i === r.length - 1 ? { ...x, avgCost: Number(e.target.value) } : x)))} />
          </div>
        </div>
        <button onClick={() => setRows((r) => [...r, { symbol: "AAPL", quantity: 1, avgCost: 0 }])}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}>
          Add row
        </button>
      </div>
      <button onClick={calc}
        style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "#fff", color: "#000", fontWeight: 600, cursor: "pointer" }}>
        Calculate portfolio
      </button>
      {loading && <div className="muted">Calculating...</div>}
      {result && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Metric label="Total value" value={fmt(result.total)} />
          {result.holdings.map((h) => (
            <Metric key={h.symbol} label={h.symbol} value={fmt(h.value)} sub={`P/L ${pct(((h.price - h.avgCost) / (h.avgCost || 1)) * 100)}`} />
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
      <div className="muted" style={{ marginBottom: 6 }}>Storage: no external storage (stateless)</div>
      <div className="muted" style={{ marginBottom: 6 }}>Broker: disabled</div>
      <div className="muted" style={{ marginBottom: 12 }}>AI APIs: none</div>
      <div className="muted fs-12">© vatistasdimitris · StocksX Terminal · All rights reserved.</div>
    </div>
  );
}
