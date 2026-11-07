"use client";

const SECTIONS = [
  { id: "general", label: "General", description: "Historical range and interval" },
  { id: "charts", label: "Charts", description: "Style and overlays" },
  { id: "forecasts", label: "Forecasts", description: "Prediction horizon" },
  { id: "data", label: "Data & risk", description: "Sources and limitations" },
];

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];
const HORIZONS = [1, 5, 10, 20, 60];

function SettingRow({ title, description, children }) {
  return (
    <div className="setting-row">
      <div className="setting-copy"><strong>{title}</strong><span>{description}</span></div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export default function SettingsWorkspace({ section, onSectionChange, preferences, setPreferences }) {
  const current = SECTIONS.find((item) => item.id === section) || SECTIONS[0];
  const update = (patch) => setPreferences((value) => ({ ...value, ...patch }));

  return (
    <div className="settings-workspace">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">WORKSPACE / PREFERENCES</div>
          <h1>Settings</h1>
          <p className="page-subtitle">Tune how historical charts and statistical forecasts are presented.</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {SECTIONS.map((item) => (
            <button type="button" key={item.id} className={section === item.id ? "settings-nav-item is-active" : "settings-nav-item"} onClick={() => onSectionChange(item.id)}>
              <span>{item.label}</span><small>{item.description}</small>
            </button>
          ))}
        </nav>

        <section className="settings-panel card" aria-live="polite">
          <div className="settings-panel-heading"><div><div className="eyebrow">PREFERENCES</div><h2>{current.label}</h2></div><span className="settings-arrow" aria-hidden="true">→</span></div>

          {section === "general" && <>
            <SettingRow title="Historical period" description="Default range used in stock charts.">
              <select className="select settings-select" value={preferences.period} onChange={(event) => update({ period: event.target.value })}>
                {PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
              </select>
            </SettingRow>
            <SettingRow title="Chart interval" description="The spacing between each price observation.">
              <select className="select settings-select" value={preferences.interval} onChange={(event) => update({ interval: event.target.value })}>
                <option value="1d">Daily</option><option value="1wk">Weekly</option>
              </select>
            </SettingRow>
          </>}

          {section === "charts" && <>
            <SettingRow title="Chart style" description="Choose the price representation used on stock pages.">
              <div className="segmented-control">
                {["Candlestick", "Line"].map((style) => <button type="button" key={style} className={preferences.chartStyle === style ? "is-selected" : ""} onClick={() => update({ chartStyle: style })}>{style}</button>)}
              </div>
            </SettingRow>
            <SettingRow title="Moving averages" description="Display the existing SMA 20 and SMA 50 overlays.">
              <label className="switch-control"><input type="checkbox" checked={preferences.showMA} onChange={(event) => update({ showMA: event.target.checked })} /><span>{preferences.showMA ? "On" : "Off"}</span></label>
            </SettingRow>
          </>}

          {section === "forecasts" && <>
            <SettingRow title="Forecast horizon" description="Number of trading days covered by the statistical estimate.">
              <select className="select settings-select" value={preferences.horizon} onChange={(event) => update({ horizon: Number(event.target.value) })}>
                {HORIZONS.map((horizon) => <option key={horizon} value={horizon}>{horizon} days</option>)}
              </select>
            </SettingRow>
            <div className="settings-info-box">The forecast uses the app’s existing trend regression and EMA calculation. Changes to the horizon are applied to the Predictions page.</div>
          </>}

          {section === "data" && <>
            <div className="provider-card"><span className="provider-mark">YF</span><div><strong>Yahoo Finance</strong><span>Quote, historical price, and company profile source</span></div><span className="provider-status">Server-side provider</span></div>
            <div className="settings-info-box">Your name, watchlist, and preferences are stored on this device only; there is no account login or cross-device sync. Your name is never sent. Symbols and relevant chart or forecast parameters are included only in live-data requests to retrieve Yahoo Finance data; the app does not save a server-side user profile or watchlist.</div>
            <div className="settings-info-box">Quotes may be delayed, incomplete, or temporarily unavailable. Charts and forecasts are for research and education; this app does not connect to a broker or place orders.</div>
          </>}
        </section>
      </div>
    </div>
  );
}
