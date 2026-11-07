"use client";

export default function LoadingScreen({ progress = 0, visible = true }) {
  if (!visible) return null;
  const value = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="startup-screen" role="status" aria-live="polite">
      <div className="startup-progress" role="progressbar" aria-label="Loading StocksX" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <span className="startup-word">STOCK</span>
        <span className="startup-number">{value}%</span>
        <span className="startup-track" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>
      </div>
    </div>
  );
}
