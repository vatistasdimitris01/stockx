"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

const DESTINATIONS = [
  { id: "home", title: "Watchlist", detail: "Your saved stocks", group: "Pages", tab: "home", terms: "home stocks saved symbols" },
  { id: "explore", title: "Explore markets", detail: "Discover stocks and market benchmarks", group: "Pages", tab: "markets", terms: "markets explore indices" },
  { id: "chart", title: "Chart analysis", detail: "Price history, indicators, and volume", group: "Pages", tab: "chart", terms: "charts technical analysis" },
  { id: "indicator-rsi", title: "RSI · Relative strength index", detail: "Jump to the RSI (14) panel", group: "Chart sections", tab: "chart", chartSection: "rsi", terms: "rsi oscillator 14" },
  { id: "indicator-macd", title: "MACD", detail: "Jump to the MACD (12, 26, 9) panel", group: "Chart sections", tab: "chart", chartSection: "macd", terms: "macd convergence divergence" },
  { id: "indicator-bollinger", title: "Bollinger bands", detail: "Jump to the close and Bollinger band comparison", group: "Chart sections", tab: "chart", chartSection: "bands", terms: "bollinger bb upper lower bands" },
  { id: "indicator-moving-averages", title: "Moving averages · SMA 20 and 50", detail: "Jump to the moving-average comparison", group: "Chart sections", tab: "chart", chartSection: "bands", terms: "sma 20 50 moving average" },
  { id: "indicator-volume", title: "Trading volume", detail: "Jump to the volume panel", group: "Chart sections", tab: "chart", chartSection: "volume", terms: "volume histogram turnover" },
  { id: "predictions", title: "Predictions overview", detail: "Open the current statistical outlook", group: "Pages", tab: "predictions", predictionSection: "overview", terms: "forecast signal predictions" },
  { id: "prediction-models", title: "Prediction model breakdown", detail: "Ensemble, trend, and EMA estimates", group: "Pages", tab: "predictions", predictionSection: "models", terms: "forecast trend ema ensemble" },
  { id: "prediction-method", title: "Prediction method and assumptions", detail: "Read the model approach and limitations", group: "Pages", tab: "predictions", predictionSection: "method", terms: "methodology risk disclaimer" },
  { id: "scanner", title: "Market scanner", detail: "Scan symbols for momentum and volatility", group: "Pages", tab: "scanner", terms: "scan screener" },
  { id: "portfolio", title: "Portfolio simulator", detail: "Review hypothetical holdings", group: "Pages", tab: "portfolio", terms: "holdings positions" },
  { id: "backtest", title: "Backtesting", detail: "Test a moving-average crossover", group: "Pages", tab: "backtest", terms: "strategy lab equity curve" },
  { id: "settings", title: "Settings · General", detail: "Lookback period and update interval", group: "Settings", tab: "settings", settingsSection: "general", terms: "preferences period interval" },
  { id: "settings-chart", title: "Settings · Chart preferences", detail: "Chart style and moving averages", group: "Settings", tab: "settings", settingsSection: "charts", terms: "candlestick line sma chart" },
  { id: "settings-forecast", title: "Settings · Forecast preferences", detail: "Prediction horizon and model mode", group: "Settings", tab: "settings", settingsSection: "forecasts", terms: "horizon monte carlo deterministic" },
  { id: "settings-data", title: "Settings · Data and risk", detail: "Data provider and research limitations", group: "Settings", tab: "settings", settingsSection: "data", terms: "provider yahoo finance disclaimer risk" },
];

const isTickerLike = (text) => {
  const value = text.trim();
  return value === value.toUpperCase() && /^[A-Z0-9.^=_/-]{1,18}$/.test(value);
};

export default function CommandPalette({ open, onClose, onNavigate, onOpenStock }) {
  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState([]);
  const [highlighted, setHighlighted] = useState(0);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  const pages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DESTINATIONS.slice(0, 6);
    return DESTINATIONS.filter((item) => `${item.title} ${item.detail} ${item.terms}`.toLowerCase().includes(normalized));
  }, [query]);

  const items = useMemo(() => [
    ...stocks.map((stock) => ({
      id: `stock-${stock.symbol}`,
      title: stock.symbol,
      detail: [stock.name, stock.exchange].filter(Boolean).join(" · "),
      group: "Stocks",
      symbol: stock.symbol,
      stock: true,
    })),
    ...pages,
  ], [stocks, pages]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setStocks([]);
    setSearchError("");
    setSearching(false);
    setHighlighted(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) {
      setStocks([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || "Stock search is unavailable.");
        setStocks(data.results || []);
        setSearchError("");
        setSearching(false);
      } catch (error) {
        if (error.name !== "AbortError") {
          setStocks([]);
          setSearchError("Stock search is temporarily unavailable.");
          setSearching(false);
        }
      }
    }, 160);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => setHighlighted(0), [query]);

  if (!open) return null;

  const choose = (item) => {
    if (item?.stock) {
      onOpenStock(item.symbol);
      return;
    }
    if (item) onNavigate(item.tab, { settingsSection: item.settingsSection, predictionSection: item.predictionSection, chartSection: item.chartSection });
    onClose();
  };

  const onInputKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (items[highlighted]) choose(items[highlighted]);
      else if (isTickerLike(query)) {
        onOpenStock(query.trim().toUpperCase());
      }
    }
  };

  let lastGroup = "";
  return (
    <div className="command-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Universal search">
        <div className="command-search-row">
          <Icon name="search" size={20} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search stocks, pages, settings…"
            aria-label="Search stocks and app pages"
            autoComplete="off"
          />
          <button type="button" className="command-escape" onClick={onClose}>ESC</button>
        </div>

        <div className="command-results" role="listbox" aria-label="Search results">
          {!query.trim() && <div className="command-hint">Jump to a page or start typing a stock symbol or company name.</div>}
          {items.map((item, index) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && <div className="command-group-label">{item.group}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={highlighted === index}
                  className={`command-result${highlighted === index ? " is-highlighted" : ""}`}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(item)}
                >
                  <span className={`command-result-mark${item.stock ? " stock-mark" : ""}`}>
                    {item.stock ? <span>{item.symbol.slice(0, 1)}</span> : <Icon name={item.group === "Settings" ? "settings" : item.tab === "predictions" ? "insights" : item.tab === "chart" ? "chart" : "globe"} size={15} />}
                  </span>
                  <span className="command-result-copy">
                    <span className="command-result-title">{item.title}</span>
                    <span className="command-result-detail">{item.detail}</span>
                  </span>
                  {item.stock && <span className="command-result-type">Open stock <span aria-hidden="true">↗</span></span>}
                  {!item.stock && <span className="command-result-type">Open <span aria-hidden="true">→</span></span>}
                </button>
              </div>
            );
          })}
          {query.trim() && searching && <div className="command-empty">Searching stocks…</div>}
          {query.trim() && items.length === 0 && !searching && !searchError && !isTickerLike(query) && (
            <div className="command-empty">No matching stocks or app destinations.</div>
          )}
          {query.trim() && items.length === 0 && isTickerLike(query) && (
            <button type="button" className="command-direct-stock" onClick={() => onOpenStock(query.trim().toUpperCase())}>
              Open {query.trim().toUpperCase()} stock page <span aria-hidden="true">↗</span>
            </button>
          )}
          {searchError && <div className="command-empty">{searchError} You can still open a ticker by pressing Enter.</div>}
        </div>

        <footer className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to open</span>
          <span><kbd>ESC</kbd> to close</span>
        </footer>
      </section>
    </div>
  );
}
