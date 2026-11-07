"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavigationSidebar from "./NavigationSidebar";
import CommandPalette from "./CommandPalette";
import LoadingScreen from "./LoadingScreen";
import LocalProfileMenu, { LocalNameGate } from "./LocalProfile";
import { Icon } from "./Icon";

const AppShellContext = createContext(null);
const DEFAULT_WATCHLIST = [];
const DEFAULT_PREFERENCES = {
  period: "2y",
  interval: "1d",
  chartStyle: "Candlestick",
  showMA: true,
  horizon: 20,
};
const VALID_PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];
const VALID_HORIZONS = [1, 5, 10, 20, 60];

function normalizePreferences(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_PREFERENCES;
  return {
    period: VALID_PERIODS.includes(value.period) ? value.period : DEFAULT_PREFERENCES.period,
    interval: ["1d", "1wk"].includes(value.interval) ? value.interval : DEFAULT_PREFERENCES.interval,
    chartStyle: ["Candlestick", "Line"].includes(value.chartStyle) ? value.chartStyle : DEFAULT_PREFERENCES.chartStyle,
    showMA: typeof value.showMA === "boolean" ? value.showMA : DEFAULT_PREFERENCES.showMA,
    horizon: VALID_HORIZONS.includes(value.horizon) ? value.horizon : DEFAULT_PREFERENCES.horizon,
  };
}

function normalizeTickerList(value) {
  if (!Array.isArray(value)) return DEFAULT_WATCHLIST;
  return [...new Set(value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z0-9.^=_/-]{1,18}$/.test(item)))].slice(0, 30);
}

export function useAppShell() {
  const value = useContext(AppShellContext);
  if (!value) throw new Error("useAppShell must be used inside AppShell");
  return value;
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState("home");
  const [settingsSection, setSettingsSection] = useState("general");
  const [predictionSection, setPredictionSection] = useState("overview");
  const [chartSection, setChartSection] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [profileName, setProfileName] = useState("");
  const [localStateReady, setLocalStateReady] = useState(false);
  const [initialDataSettled, setInitialDataSettled] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(52);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [stockSelectionTarget, setStockSelectionTarget] = useState(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    const match = pathname.match(/^\/stock\/([^/]+)/);
    if (match) {
      try {
        setSelectedTicker(decodeURIComponent(match[1]).toUpperCase());
      } catch {
        setSelectedTicker(match[1].toUpperCase());
      }
    }
  }, [pathname]);

  useEffect(() => {
    try {
      const savedWatchlist = window.localStorage.getItem("stocksx-watchlist");
      if (savedWatchlist) setWatchlist(normalizeTickerList(JSON.parse(savedWatchlist)));
    } catch { /* Ignore malformed or blocked watchlist storage. */ }
    try {
      const savedPreferences = window.localStorage.getItem("stocksx-preferences");
      if (savedPreferences) setPreferences(normalizePreferences(JSON.parse(savedPreferences)));
    } catch { /* Use safe default preferences if local storage is unavailable. */ }
    try {
      const savedName = window.localStorage.getItem("stocksx-local-name");
      if (typeof savedName === "string") setProfileName(savedName.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 32));
    } catch { /* The local profile is optional when browser storage is blocked. */ }
    setLocalStateReady(true);
  }, []);

  useEffect(() => {
    if (!localStateReady) return;
    try {
      window.localStorage.setItem("stocksx-watchlist", JSON.stringify(watchlist));
    } catch {
      // Local data remains usable for this browser session if storage is unavailable.
    }
  }, [watchlist, localStateReady]);

  useEffect(() => {
    if (!localStateReady) return;
    try {
      window.localStorage.setItem("stocksx-preferences", JSON.stringify(preferences));
    } catch {
      // Preferences remain usable for this browser session if storage is unavailable.
    }
  }, [preferences, localStateReady]);

  useEffect(() => {
    if (!localStateReady) return;
    try {
      if (profileName) window.localStorage.setItem("stocksx-local-name", profileName);
      else window.localStorage.removeItem("stocksx-local-name");
    } catch {
      // The local name is not sent to any server if browser storage is unavailable.
    }
  }, [profileName, localStateReady]);

  useEffect(() => {
    if (localStateReady) setLoadingProgress(52);
  }, [localStateReady]);

  useEffect(() => {
    if (!localStateReady || !initialDataSettled) return undefined;
    setLoadingProgress(100);
    const timer = window.setTimeout(() => setLoadingVisible(false), 450);
    return () => window.clearTimeout(timer);
  }, [localStateReady, initialDataSettled]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const markInitialDataSettled = useCallback(() => setInitialDataSettled(true), []);
  const openStock = useCallback((symbol) => {
    const ticker = String(symbol || "").trim().toUpperCase();
    if (!ticker) return;
    const target = stockSelectionTarget;
    setSelectedTicker(ticker);
    setCommandOpen(false);
    setStockSelectionTarget(null);
    if (target) {
      setTab(target);
      return;
    }
    router.push(`/stock/${encodeURIComponent(ticker)}`);
  }, [router, stockSelectionTarget]);

  const navigate = useCallback((destination, options = {}) => {
    if (options.settingsSection) setSettingsSection(options.settingsSection);
    if (options.predictionSection) setPredictionSection(options.predictionSection);
    if (destination === "chart") setChartSection(options.chartSection || "");
    if (options.ticker) setSelectedTicker(options.ticker.toUpperCase());
    setCommandOpen(false);
    setStockSelectionTarget(null);
    setTab(destination);
    if (pathname !== "/") router.push("/");
  }, [pathname, router]);

  const openCommand = useCallback((target = null) => {
    setStockSelectionTarget(target);
    setCommandOpen(true);
  }, []);
  const closeCommand = useCallback(() => {
    setCommandOpen(false);
    setStockSelectionTarget(null);
  }, []);

  const toggleWatchlist = useCallback((symbol) => {
    const ticker = String(symbol || "").trim().toUpperCase();
    if (!/^[A-Z0-9.^=_/-]{1,18}$/.test(ticker)) return;
    setWatchlist((current) => current.includes(ticker)
      ? current.filter((item) => item !== ticker)
      : [...current, ticker].slice(0, 30));
  }, []);

  const value = useMemo(() => ({
    tab,
    setTab,
    settingsSection,
    setSettingsSection,
    predictionSection,
    setPredictionSection,
    chartSection,
    setChartSection,
    selectedTicker,
    setSelectedTicker,
    watchlist,
    setWatchlist,
    toggleWatchlist,
    preferences,
    setPreferences,
    navigate,
    openStock,
    openCommand,
    markInitialDataSettled,
  }), [
    tab,
    settingsSection,
    predictionSection,
    chartSection,
    selectedTicker,
    watchlist,
    toggleWatchlist,
    preferences,
    navigate,
    openStock,
    openCommand,
    markInitialDataSettled,
  ]);

  const isStockPage = pathname.startsWith("/stock/");

  return (
    <AppShellContext.Provider value={value}>
      <div className={`app-shell${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
        <NavigationSidebar
          activeTab={tab}
          isStockPage={isStockPage}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          onNavigate={navigate}
          watchCount={watchlist.length}
        />
        <div className="app-workspace">
          <header className="workspace-topbar">
            <div className="topbar-context">
              <span className="status-dot" aria-hidden="true" />
              <span>MARKET RESEARCH</span>
            </div>
            <button className="global-search-trigger" type="button" onClick={() => openCommand()}>
              <Icon name="search" size={16} />
              <span className="search-trigger-copy">Search stocks, pages, settings…</span>
              <kbd><span>⌘</span><span>K</span></kbd>
            </button>
            {localStateReady && <LocalProfileMenu
              name={profileName}
              onUpdate={setProfileName}
              onClear={() => setProfileName("")}
            />}
          </header>
          <main className="main-content">{localStateReady ? children : null}</main>
        </div>
        <CommandPalette
          open={commandOpen}
          onClose={closeCommand}
          onNavigate={navigate}
          onOpenStock={openStock}
        />
      </div>
      {localStateReady && !profileName && !loadingVisible && <LocalNameGate onSave={setProfileName} />}
      <LoadingScreen progress={loadingProgress} visible={loadingVisible} />
    </AppShellContext.Provider>
  );
}
