"use client";

import { useEffect } from "react";
import { useAppShell } from "./AppShell";
import { Icon } from "./Icon";
import { useCachedJson } from "../lib/useCachedJson";
import {
  MarketsTab,
  ChartTab,
  ScannerTab,
  BacktestTab,
  PortfolioTab,
} from "./TabContent";
import PredictionsWorkspace from "./PredictionsWorkspace";
import SettingsWorkspace from "./SettingsWorkspace";

const EXPLORE_SYMBOLS = ["AMZN", "META", "GOOGL", "AMD", "AVGO", "ORCL"];
const PAGE_COPY = {
  markets: ["Explore markets", "Browse provider-backed market benchmarks and instruments."],
  chart: ["Chart analysis", "Review price structure and technical indicators for the selected stock."],
  scanner: ["Market scanner", "Analyze symbols you enter using provider history."],
  portfolio: ["Portfolio calculator", "Model hypothetical holdings using current provider quotes."],
  backtest: ["Backtesting", "Review a strategy against provider historical prices."],
};

const formatMoney = (value, currency = "USD") => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
};

const formatPercent = (value) => typeof value === "number" && Number.isFinite(value)
  ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  : "—";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Freshness({ resource }) {
  if (!resource?.fetchedAt) return null;
  return <div className={`data-freshness${resource.stale ? " is-stale" : ""}`}>
    <span>{resource.stale || resource.fromCache ? "Cached data" : "Provider response"}</span>
    <span>·</span>
    <time dateTime={new Date(resource.fetchedAt).toISOString()}>{formatTime(resource.fetchedAt)}</time>
    {resource.refreshing && <span>· Refreshing</span>}
  </div>;
}

function DataWarning({ children, error = false }) {
  if (!children) return null;
  return <div className={`data-warning${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>{children}</div>;
}

function Change({ value }) {
  const className = typeof value !== "number" ? "muted" : value >= 0 ? "up" : "down";
  return <span className={className}>{formatPercent(value)}</span>;
}

function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {children && <div className="page-heading-actions">{children}</div>}
    </div>
  );
}

function StockSelectionPrompt({ title, description, onChoose }) {
  return (
    <section className="stock-selection-state" aria-labelledby="stock-selection-title">
      <div className="eyebrow">NO STOCK SELECTED</div>
      <h2 id="stock-selection-title">{title}</h2>
      <p>{description}</p>
      <button type="button" className="button-primary" onClick={onChoose}>
        <Icon name="search" size={15} /> Choose a stock <kbd>⌘ K</kbd>
      </button>
    </section>
  );
}

function HomeWorkspace({
  quotes,
  quotesLoading,
  quoteError,
  quoteUnavailableSymbols,
  quoteFreshness,
  exploreQuotes,
  exploreLoading,
  exploreError,
  exploreUnavailableSymbols,
  exploreFreshness,
  market,
  marketLoading,
  marketError,
  marketUnavailableSymbols,
  marketFreshness,
  watchlist,
  onOpenStock,
  onToggleWatchlist,
  onOpenSearch,
  onRefresh,
}) {
  const explore = exploreQuotes.filter((item) => !watchlist.includes(item.symbol)).slice(0, 6);
  const indices = (market || []).filter((item) => ["^GSPC", "^IXIC", "^DJI"].includes(item.symbol));

  return (
    <div className="home-workspace">
      <PageHeading
        eyebrow="YOUR MARKET / WATCHLIST"
        title="Your watchlist"
        description="Your device-local symbols and current provider quotes."
      >
        <button type="button" className="button-secondary" onClick={onRefresh}><Icon name="refresh" size={14} /> Refresh</button>
        <button type="button" className="button-primary" onClick={onOpenSearch}><Icon name="plus" size={15} /> Add a stock</button>
      </PageHeading>

      <section className="market-pulse" aria-label="Market benchmarks">
        <div className="market-pulse-label"><span className="status-dot" /> MARKET PULSE</div>
        {marketLoading && !market?.length && <span className="market-pulse-loading">Loading provider benchmarks…</span>}
        {!marketLoading && !marketError && indices.map((item) => (
          <div className="market-pulse-item" key={item.symbol}>
            <span>{item.name}</span>
            <strong>{typeof item.price === "number" ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong>
            <Change value={item.changePercent} />
          </div>
        ))}
        {marketError && !market?.length && <span className="market-pulse-loading">Benchmark quotes are unavailable from the provider.</span>}
        {!marketLoading && !marketError && indices.length === 0 && <span className="market-pulse-loading">No benchmark quotes were returned.</span>}
      </section>
      <Freshness resource={marketFreshness} />
      <DataWarning error={Boolean(marketError)}>{marketError ? `Benchmark refresh failed: ${marketError}` : marketUnavailableSymbols.length ? `Provider did not return ${marketUnavailableSymbols.join(", ")}.` : ""}</DataWarning>

      <section className="home-section">
        <div className="section-heading-row">
          <div>
            <h2>Saved stocks</h2>
            <p>Click a symbol to open its dedicated research page.</p>
            <Freshness resource={quoteFreshness} />
          </div>
          <span className="section-count">{watchlist.length} {watchlist.length === 1 ? "symbol" : "symbols"}</span>
        </div>
        <DataWarning error={Boolean(quoteError)}>{quoteError ? `Quote refresh failed: ${quoteError}` : quoteUnavailableSymbols.length ? `No current quote was returned for ${quoteUnavailableSymbols.join(", ")}.` : ""}</DataWarning>
        <div className="watchlist-table card">
          <div className="watchlist-table-head"><span>Company</span><span>Symbol</span><span>Last price</span><span>Day change</span><span aria-label="Open stock page" /><span aria-label="Remove stock" /></div>
          {quotesLoading && !quotes.length && <div className="watchlist-empty">Loading saved-symbol quotes…</div>}
          {!quotesLoading && watchlist.length === 0 && <div className="watchlist-empty">Your watchlist is empty. Search for a stock to add it.</div>}
          {!quotesLoading && watchlist.map((symbol) => {
            const quote = quotes.find((item) => item.symbol === symbol);
            const hasPrice = typeof quote?.price === "number" && Number.isFinite(quote.price);
            return (
              <div className="watchlist-row" role="button" tabIndex={0} key={symbol} onClick={() => onOpenStock(symbol)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpenStock(symbol); } }}>
                <span className="watch-company"><span className="ticker-avatar">{symbol.slice(0, 1)}</span><span><strong>{quote?.name || symbol}</strong><small>{quote?.exchange || (hasPrice ? "Provider quote" : "Quote unavailable")}</small></span></span>
                <span className="watch-symbol">{symbol}</span>
                <strong className="watch-price">{hasPrice ? formatMoney(quote.price, quote.currency || "USD") : "—"}</strong>
                <span className="watch-change"><Change value={hasPrice ? quote.changePercent : null} /></span>
                <span className="watch-open-arrow" aria-hidden="true">↗</span>
                <span className="watch-remove-wrap"><button type="button" className="watch-remove" aria-label={`Remove ${symbol} from watchlist`} onClick={(event) => { event.stopPropagation(); onToggleWatchlist(symbol); }}>×</button></span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="home-section explore-section">
        <div className="section-heading-row">
          <div><div className="eyebrow">DISCOVER</div><h2>Explore stocks</h2><p>Selected real symbols with quotes retrieved from the provider.</p><Freshness resource={exploreFreshness} /></div>
          <span className="explore-link">Live quote lookup <span aria-hidden="true">→</span></span>
        </div>
        <DataWarning error={Boolean(exploreError)}>{exploreError ? `Explore quotes are unavailable: ${exploreError}` : exploreUnavailableSymbols.length ? `No current quote for ${exploreUnavailableSymbols.join(", ")}.` : ""}</DataWarning>
        {exploreLoading && !exploreQuotes.length && <div className="explore-grid"><div className="explore-placeholder">Loading provider quotes…</div></div>}
        {!exploreLoading && exploreError && !explore.length && <div className="explore-placeholder">No substitute prices are shown while provider data is unavailable.</div>}
        {!exploreLoading && !exploreError && explore.length === 0 && <div className="explore-placeholder">No additional provider quotes are available. Search for a symbol to explore it.</div>}
        {explore.length > 0 && <div className="explore-grid">
          {explore.map((item) => {
            const hasPrice = typeof item.price === "number" && Number.isFinite(item.price);
            return <article className="explore-card" key={item.symbol}>
              <button type="button" className="explore-card-main" onClick={() => onOpenStock(item.symbol)}>
                <span className="explore-card-top"><span className="ticker-avatar">{item.symbol.slice(0, 1)}</span><span className="explore-card-arrow" aria-hidden="true">↗</span></span>
                <strong>{item.symbol}</strong><span className="explore-company">{item.name || item.symbol}</span>
                <span className="explore-card-price">{hasPrice ? formatMoney(item.price, item.currency || "USD") : "Quote unavailable"}</span>
                {hasPrice && <Change value={item.changePercent} />}
              </button>
              <button type="button" className="explore-add" aria-label={`Add ${item.symbol} to watchlist`} onClick={() => onToggleWatchlist(item.symbol)}><Icon name="plus" size={14} /></button>
            </article>;
          })}
        </div>}
      </section>
    </div>
  );
}

export default function Workspace() {
  const {
    tab,
    selectedTicker,
    watchlist,
    toggleWatchlist,
    preferences,
    setPreferences,
    settingsSection,
    setSettingsSection,
    predictionSection,
    setPredictionSection,
    chartSection,
    openStock,
    openCommand,
    markInitialDataSettled,
  } = useAppShell();

  const watchUrl = watchlist.length ? `/api/watch?tickers=${encodeURIComponent(watchlist.join(","))}` : null;
  const exploreUrl = `/api/watch?tickers=${encodeURIComponent(EXPLORE_SYMBOLS.join(","))}`;
  const marketResource = useCachedJson("/api/market?group=indices", { enabled: tab === "home", maxAgeMs: 20_000, timeoutMs: 5_000 });
  const watchResource = useCachedJson(watchUrl, { enabled: tab === "home", maxAgeMs: 15_000, timeoutMs: 5_000 });
  const exploreResource = useCachedJson(exploreUrl, { enabled: tab === "home", maxAgeMs: 30_000, timeoutMs: 8_000 });
  const priceUrl = tab === "chart" && selectedTicker
    ? `/api/prices?ticker=${encodeURIComponent(selectedTicker)}&period=${encodeURIComponent(preferences.period)}&interval=${encodeURIComponent(preferences.interval)}`
    : null;
  const priceResource = useCachedJson(priceUrl, { enabled: tab === "chart", maxAgeMs: 5 * 60_000, timeoutMs: 10_000 });
  const forecastUrl = tab === "predictions" && selectedTicker
    ? `/api/forecast?ticker=${encodeURIComponent(selectedTicker)}&horizon=${encodeURIComponent(preferences.horizon)}`
    : null;
  const forecastResource = useCachedJson(forecastUrl, { enabled: tab === "predictions", maxAgeMs: 5 * 60_000, timeoutMs: 10_000 });

  const watchQuotes = watchResource.data?.quotes || [];
  const exploreQuotes = exploreResource.data?.quotes || [];
  const market = marketResource.data?.snapshot || [];
  const watchLoading = watchResource.loading && !watchResource.data;
  const exploreLoading = exploreResource.loading && !exploreResource.data;
  const marketLoading = marketResource.loading && !marketResource.data;
  const priceData = priceResource.data;
  const forecast = forecastResource.data;
  const pageCopy = PAGE_COPY[tab];

  useEffect(() => {
    if (tab !== "home") return;
    if (!watchResource.loading && !marketResource.loading && !exploreResource.loading) markInitialDataSettled();
  }, [tab, watchResource.loading, marketResource.loading, exploreResource.loading, markInitialDataSettled]);

  useEffect(() => {
    if (tab !== "chart" && tab !== "predictions") return;
    const resource = tab === "chart" ? priceResource : forecastResource;
    if (!resource.loading) markInitialDataSettled();
  }, [tab, priceResource.loading, forecastResource.loading, markInitialDataSettled]);

  if (tab === "home") {
    return <HomeWorkspace
      quotes={watchQuotes}
      quotesLoading={watchLoading}
      quoteError={watchResource.error}
      quoteUnavailableSymbols={watchResource.data?.unavailableSymbols || []}
      quoteFreshness={watchResource}
      exploreQuotes={exploreQuotes}
      exploreLoading={exploreLoading}
      exploreError={exploreResource.error}
      exploreUnavailableSymbols={exploreResource.data?.unavailableSymbols || []}
      exploreFreshness={exploreResource}
      market={market}
      marketLoading={marketLoading}
      marketError={marketResource.error}
      marketUnavailableSymbols={marketResource.data?.unavailableSymbols || []}
      marketFreshness={marketResource}
      watchlist={watchlist}
      onOpenStock={openStock}
      onToggleWatchlist={toggleWatchlist}
      onOpenSearch={openCommand}
      onRefresh={() => { watchResource.refresh(); exploreResource.refresh(); marketResource.refresh(); }}
    />;
  }

  if (tab === "predictions") {
    return <div className="research-page">
      <div className="page-heading-row prediction-heading-actions">
        <div><div className="eyebrow">RESEARCH / OUTLOOK</div><h1>Predictions</h1><p className="page-subtitle">{selectedTicker ? `Historical-price model estimates for ${selectedTicker}, with assumptions shown.` : "Choose a stock to load a real-history model estimate."}</p></div>
        {selectedTicker && <div className="page-heading-actions">
          <button type="button" className="button-secondary" onClick={() => openCommand("predictions")}>Change stock</button>
          <button type="button" className="button-secondary" onClick={forecastResource.refresh} disabled={forecastResource.loading}><Icon name="refresh" size={14} /> {forecastResource.loading ? "Updating…" : "Refresh estimate"}</button>
        </div>}
      </div>
      {!selectedTicker ? <StockSelectionPrompt title="Choose a stock for model estimates" description="No symbol is preselected. Search for a stock to load estimates based on its real provider history." onChoose={() => openCommand("predictions")} /> : <>
        {forecastResource.error && <DataWarning error={Boolean(!forecast)}>{forecastResource.error}{forecast ? " — showing the last real-data calculation." : ""}</DataWarning>}
        <Freshness resource={forecastResource} />
        <PredictionsWorkspace data={forecast} loading={forecastResource.loading && !forecast} error={forecast ? "" : forecastResource.error} horizon={preferences.horizon} section={predictionSection} onSectionChange={setPredictionSection} />
      </>}
    </div>;
  }

  if (tab === "settings") {
    return <SettingsWorkspace section={settingsSection} onSectionChange={setSettingsSection} preferences={preferences} setPreferences={setPreferences} />;
  }

  if (tab === "chart" && !selectedTicker) {
    return <div className="research-page">
      <PageHeading eyebrow="RESEARCH / WORKSPACE" title="Chart analysis" description="Choose a stock to load its real price history and technical indicators." />
      <StockSelectionPrompt title="Choose a stock to analyze" description="No stock is preselected. Search for a ticker to load its price history, chart, and indicators." onChoose={() => openCommand("chart")} />
    </div>;
  }

  if (tab === "backtest" && !selectedTicker) {
    return <div className="research-page">
      <PageHeading eyebrow="RESEARCH / BACKTESTING" title="Backtesting" description="Evaluate a strategy against real provider price history." />
      <StockSelectionPrompt title="Choose a stock for this backtest" description="No symbol is preselected. Search for a stock to run the historical strategy analysis." onChoose={() => openCommand("backtest")} />
    </div>;
  }

  return <div className="research-page">
    <PageHeading eyebrow="RESEARCH / WORKSPACE" title={pageCopy?.[0] || "Research"} description={pageCopy?.[1] || "Explore the market research tools."}>
      {selectedTicker && <span className="active-symbol-pill">{selectedTicker}<span aria-hidden="true">→</span></span>}
      {tab === "chart" && selectedTicker && <button type="button" className="button-secondary" onClick={() => openCommand("chart")}>Change stock</button>}
      {tab === "backtest" && selectedTicker && <button type="button" className="button-secondary" onClick={() => openCommand("backtest")}>Change stock</button>}
    </PageHeading>
    {tab === "markets" && <MarketsTab />}
    {tab === "chart" && <>
      {priceResource.error && <DataWarning error={!priceData}>{priceResource.error}{priceData ? " — showing the last real historical response." : ""}</DataWarning>}
      <Freshness resource={priceResource} />
      {priceResource.loading && !priceData && <div className="state-panel">Loading real chart history for {selectedTicker}…</div>}
      {!priceResource.loading && !priceData && <div className="state-panel state-error">{priceResource.error || "Historical prices are unavailable from the provider."}</div>}
      {priceData && <ChartTab data={priceData} loading={false} error={null} section={chartSection} />}
    </>}
    {tab === "scanner" && <ScannerTab />}
    {tab === "backtest" && <BacktestTab ticker={selectedTicker} />}
    {tab === "portfolio" && <PortfolioTab />}
    {tab === "markets" && <div className="research-note">Select a provider-returned instrument or use Command+K to open its stock research page.</div>}
  </div>;
}
