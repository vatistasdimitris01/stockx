"use client";

import { useMemo } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "Model breakdown" },
  { id: "method", label: "Method & assumptions" },
];

const formatNumber = (value, digits = 2) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";

const formatPercent = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
    : "—";

function SummaryMetric({ label, value, note, tone = "" }) {
  return (
    <div className="prediction-metric">
      <span className="prediction-metric-label">{label}</span>
      <strong className={tone}>{value}</strong>
      {note && <span className="prediction-metric-note">{note}</span>}
    </div>
  );
}

export default function PredictionsWorkspace({ data, loading, error, horizon, section, onSectionChange }) {
  const activeSection = useMemo(() => SECTIONS.some((item) => item.id === section) ? section : "overview", [section]);
  const action = data?.action || "HOLD";
  const actionClass = action === "BUY" ? "signal-buy" : action === "SELL" ? "signal-sell" : "signal-hold";
  const ensembleReturn = typeof data?.ensembleReturn === "number" ? data.ensembleReturn * 100 : null;
  const ensemblePrice = typeof data?.ensemblePrice === "number"
    ? data.ensemblePrice
    : typeof data?.last === "number" && typeof data?.ensembleReturn === "number"
      ? data.last * (1 + data.ensembleReturn)
      : null;

  return (
    <div className="predictions-workspace">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">RESEARCH / OUTLOOK</div>
          <h1>Predictions</h1>
          <p className="page-subtitle">A transparent statistical outlook for {data?.ticker || "the selected symbol"}.</p>
        </div>
        <span className="forecast-method-badge">Trend + EMA model</span>
      </div>

      <nav className="section-tabs" aria-label="Prediction sections">
        {SECTIONS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeSection === item.id ? "section-tab is-active" : "section-tab"}
            onClick={() => onSectionChange(item.id)}
          >
            {item.label}
            {activeSection === item.id && <span aria-hidden="true">→</span>}
          </button>
        ))}
      </nav>

      {loading && <div className="state-panel">Building the current outlook…</div>}
      {!loading && error && <div className="state-panel state-error">{error}</div>}
      {!loading && !error && !data && <div className="state-panel">Run a forecast to see the model outlook.</div>}

      {!loading && !error && data && activeSection === "overview" && (
        <div className="prediction-panel-stack">
          <section className="prediction-signal-card card">
            <div className="prediction-signal-copy">
              <span className="eyebrow">MODEL SIGNAL</span>
              <h2>{data.ticker} outlook</h2>
              <p>{data.reason || "The model combines historical trend and moving-average estimates."}</p>
            </div>
            <div className="prediction-signal-result">
              <span className={`signal ${actionClass}`}>Model signal: {action}</span>
              <span className="prediction-confidence">{Math.round(data.confidence || 0)}%<small>heuristic score · not probability</small></span>
            </div>
          </section>
          <div className="prediction-metric-grid">
            <SummaryMetric label="Expected ensemble return" value={formatPercent(ensembleReturn)} tone={ensembleReturn >= 0 ? "up" : "down"} note={`${data.horizon || horizon} trading days`} />
            <SummaryMetric label="Last close" value={formatNumber(data.last)} note="Most recent available close" />
            <SummaryMetric label="Ensemble estimate" value={formatNumber(ensemblePrice)} note="Combined model output" />
            <SummaryMetric label="Forecast horizon" value={`${data.horizon || horizon}d`} note="Trading-day estimate" />
          </div>
          <div className="research-note">
            This is a statistical estimate based on Yahoo Finance historical prices, not a guarantee, personalized recommendation, or trade instruction.
          </div>
        </div>
      )}

      {!loading && !error && data && activeSection === "models" && (
        <div className="prediction-panel-stack">
          <section className="card prediction-model-intro">
            <div className="eyebrow">MODEL COMPARISON</div>
            <h2>Three views, one combined estimate</h2>
            <p className="muted">Compare the separate estimates with the ensemble result and the last observed close.</p>
          </section>
          <div className="prediction-metric-grid">
            <SummaryMetric label="Ensemble" value={formatNumber(ensemblePrice)} note={`Expected return ${formatPercent(ensembleReturn)}`} />
            <SummaryMetric label="Trend regression" value={formatNumber(data.trendPrice)} note={formatPercent(typeof data.trendPrice === "number" && data.last ? (data.trendPrice / data.last - 1) * 100 : null)} />
            <SummaryMetric label="EMA trend" value={formatNumber(data.emaPrice)} note={formatPercent(typeof data.emaPrice === "number" && data.last ? (data.emaPrice / data.last - 1) * 100 : null)} />
            <SummaryMetric label="Last close" value={formatNumber(data.last)} note="Reference price" />
          </div>
          <div className="card prediction-model-table">
            <div className="prediction-table-heading"><span>Method</span><span>Estimate</span><span>Change vs. close</span></div>
            {[
              { label: "Combined ensemble", price: ensemblePrice, change: ensembleReturn },
              { label: "Trend regression (log)", price: data.trendPrice, change: typeof data.trendPrice === "number" && data.last ? (data.trendPrice / data.last - 1) * 100 : null },
              { label: "EMA trend", price: data.emaPrice, change: typeof data.emaPrice === "number" && data.last ? (data.emaPrice / data.last - 1) * 100 : null },
            ].map((row) => (
              <div className="prediction-table-row" key={row.label}>
                <span>{row.label}</span><strong>{formatNumber(row.price)}</strong><span className={row.change >= 0 ? "up" : "down"}>{formatPercent(row.change)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && data && activeSection === "method" && (
        <div className="prediction-panel-stack">
          <section className="card prediction-method-card">
            <div className="eyebrow">HOW TO READ THIS</div>
            <h2>Historical patterns, not certainty</h2>
            <p>The forecast service compares a log-price trend regression with an exponential moving-average trend, then combines those estimates into an ensemble output for the selected horizon.</p>
            <p>Source: {data.source || "Yahoo Finance historical closes"}. The score is a heuristic and does not represent a calibrated probability.</p>
            <p>{data.reason || "The signal reflects the relationship between the model estimates and recent price history."}</p>
          </section>
          <div className="prediction-metric-grid">
            <SummaryMetric label="Method" value="Trend + EMA" note="Deterministic statistical models" />
            <SummaryMetric label="Horizon" value={`${data.horizon || horizon}d`} note="Trading days" />
            <SummaryMetric label="Heuristic score" value={`${Math.round(data.confidence || 0)}%`} note="Not a calibrated probability" />
            <SummaryMetric label="Data reference" value={formatNumber(data.last)} note="Last available close" />
          </div>
          <div className="research-note">Market data may be delayed or incomplete. Forecast outputs can be wrong; they do not place trades and should not be treated as financial advice.</div>
        </div>
      )}
    </div>
  );
}
