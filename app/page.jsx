"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Icon } from "../components/Icon";
import {
  Header,
  OverviewTab,
  MarketsTab,
  ChartTab,
  PredictionsTab,
  ScannerTab,
  BacktestTab,
  PortfolioTab,
  SettingsTab,
} from "../components/TabContent";

const TABS = [
  { label: "Overview", value: "overview", icon: "chart" },
  { label: "Markets", value: "markets", icon: "globe" },
  { label: "Chart Analysis", value: "chart", icon: "monitor" },
  { label: "Predictions", value: "predictions", icon: "insights" },
  { label: "Market Scanner", value: "scanner", icon: "radar" },
  { label: "Backtesting", value: "backtest", icon: "flask" },
  { label: "Portfolio", value: "portfolio", icon: "wallet" },
  { label: "Settings", value: "settings", icon: "settings" },
];

export default function Home() {
  const [state, setState] = useState({
    ticker: "AAPL",
    period: "2y",
    interval: "1d",
    chartStyle: "Candlestick",
    showMA: true,
    horizon: 20,
    simulation: "deterministic",
    tab: "overview",
    sidebarOpen: true,
  });

  const [prices, setPrices] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState(null);

  const loadPrices = useCallback(async (force = false) => {
    const ticker = state.ticker;
    if (!ticker) return;
    setPricesLoading(true);
    setPricesError(null);
    setPrices(null);
    try {
      const r = await fetch(
        `/api/prices?ticker=${encodeURIComponent(ticker)}&period=${state.period}&interval=${state.interval}`
      );
      const d = await r.json();
      if (d.error) setPricesError(d.error);
      else setPrices(d);
    } catch {
      setPricesError("Failed to load market data");
    } finally {
      setPricesLoading(false);
    }
  }, [state.ticker, state.period, state.interval]);

  const loadForecast = useCallback(async () => {
    const ticker = state.ticker;
    if (!ticker) return;
    setForecastLoading(true);
    setForecastError(null);
    setForecast(null);
    try {
      const r = await fetch(
        `/api/forecast?ticker=${encodeURIComponent(ticker)}&horizon=${state.horizon}`
      );
      const d = await r.json();
      if (d.error) setForecastError(d.error);
      else setForecast(d);
    } catch {
      setForecastError("Failed to load forecast");
    } finally {
      setForecastLoading(false);
    }
  }, [state.ticker, state.horizon]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {state.sidebarOpen && (
        <Sidebar
          state={state}
          setState={setState}
          onSetTicker={(t) => setState((s) => ({ ...s, ticker: t }))}
          onRefresh={() => {
            loadPrices(true);
            loadForecast();
          }}
        />
      )}

      <main style={{ flex: 1, padding: "24px 28px", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 4 }}>
          <HeaderBar />

          <div style={{ flex: 1 }}>
            <Header
              ticker={state.ticker}
              quote={prices?.quote}
              annualVolatility={prices?.annualVolatility || 0}
            />
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid var(--border)",
            overflowX: "auto",
            marginBottom: 16,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setState((s) => ({ ...s, tab: t.value }))}
              style={{
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 12px",
                borderBottom: state.tab === t.value ? "2px solid #ededed" : "2px solid transparent",
                background: "transparent",
                color: state.tab === t.value ? "var(--text)" : "var(--muted)",
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ borderRadius: 10 }}>
          {state.tab === "overview" && (
            <OverviewTab
              data={prices}
              loading={pricesLoading}
              error={pricesError}
              chartStyle={state.chartStyle}
              showMA={state.showMA}
            />
          )}
          {state.tab === "markets" && <MarketsTab />}
          {state.tab === "chart" && (
            <ChartTab data={prices} loading={pricesLoading} error={pricesError} />
          )}
          {state.tab === "predictions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <PredictionsTab
                data={forecast}
                loading={forecastLoading}
                error={forecastError}
                horizon={state.horizon}
              />
              <button
                onClick={loadForecast}
                style={{
                  alignSelf: "flex-start",
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
                Run AI prediction
              </button>
            </div>
          )}
          {state.tab === "scanner" && <ScannerTab />}
          {state.tab === "backtest" && <BacktestTab ticker={state.ticker} />}
          {state.tab === "portfolio" && <PortfolioTab defaultTicker={state.ticker} />}
          {state.tab === "settings" && <SettingsTab />}
        </div>

        <div className="muted" style={{ marginTop: 32, fontSize: 12 }}>
          © vatistasdimitris · StocksX Terminal · All rights reserved.
        </div>
      </main>

      {/* Floating sidebar toggle */}
      <button
        onClick={() => setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen }))}
        aria-label="Toggle sidebar"
        style={{
          position: "fixed",
          bottom: 20,
          left: state.sidebarOpen ? 300 : 20,
          zIndex: 999999,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid var(--border-strong)",
          background: "rgba(10,10,10,0.85)",
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          transition: "left 0.2s ease",
        }}
      >
        <Icon name="menu" size={16} />
      </button>
    </div>
  );
}

function HeaderBar() {
  return (
    <div className="muted" style={{ fontSize: 11, marginTop: 8, letterSpacing: "0.08em" }}>
      StocksX
    </div>
  );
}
