"use client";

import { Icon } from "./Icon";

const NAV_ITEMS = [
  { label: "Watchlist", value: "home", icon: "star" },
  { label: "Explore", value: "markets", icon: "globe" },
  { label: "Chart analysis", value: "chart", icon: "monitor" },
  { label: "Predictions", value: "predictions", icon: "insights" },
  { label: "Market scanner", value: "scanner", icon: "radar" },
  { label: "Portfolio", value: "portfolio", icon: "wallet" },
  { label: "Backtesting", value: "backtest", icon: "flask" },
];

export default function NavigationSidebar({ activeTab, isStockPage, collapsed, onToggle, onNavigate, watchCount }) {
  return (
    <aside className={`app-sidebar${collapsed ? " is-collapsed" : ""}`} aria-label="Main navigation">
      <div className="sidebar-brand-row">
        {!collapsed && (
          <div className="sidebar-brand-copy">
            <div className="sidebar-brand-name">StocksX</div>
            <div className="sidebar-brand-caption">Market intelligence</div>
          </div>
        )}
        <button
          type="button"
          className="sidebar-toggle icon-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
        </button>
      </div>

      {!collapsed && <div className="sidebar-section-label">WORKSPACE</div>}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = isStockPage ? item.value === "home" : activeTab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              className={`sidebar-nav-item${active ? " is-active" : ""}`}
              onClick={() => onNavigate(item.value)}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={item.icon} size={17} />
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {!collapsed && item.value === "home" && <span className="sidebar-nav-count">{watchCount}</span>}
              {active && !collapsed && <span className="sidebar-active-arrow" aria-hidden="true">→</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button
          type="button"
          className={`sidebar-nav-item${activeTab === "settings" ? " is-active" : ""}`}
          onClick={() => onNavigate("settings", { settingsSection: "general" })}
          title={collapsed ? "Settings" : undefined}
          aria-current={activeTab === "settings" ? "page" : undefined}
        >
          <Icon name="settings" size={17} />
          {!collapsed && <span className="sidebar-nav-label">Settings</span>}
          {activeTab === "settings" && !collapsed && <span className="sidebar-active-arrow" aria-hidden="true">→</span>}
        </button>
        {!collapsed && <div className="sidebar-data-note">Quotes and history from Yahoo Finance</div>}
      </div>
    </aside>
  );
}
