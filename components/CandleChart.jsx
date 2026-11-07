"use client";

import React from "react";

// Lightweight custom OHLC candlestick renderer (pure SVG, no extra deps).
export default function CandleChart({ data, showMA, sma20, sma50, height = 380 }) {
  const width = 900;
  const pad = 8;
  const n = data.length;
  if (n === 0) return <div className="muted">No data</div>;

  const values = data.flatMap((d) => [d.high, d.low, d.close, d.open]).filter(Number.isFinite);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const range = max - min || 1;
  min -= range * 0.05;
  max += range * 0.05;
  const xScale = (i) => pad + (i / Math.max(1, n - 1)) * (width - pad * 2);
  const yScale = (v) => pad + ((max - v) / (max - min)) * (height - pad * 2);

  const bodyWidth = Math.max(2, Math.min(8, (width - pad * 2) / n * 0.7));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={width - pad}
          y1={pad + t * (height - pad * 2)}
          y2={pad + t * (height - pad * 2)}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {[["#f59e0b", sma20], ["#a78bfa", sma50]].map(([color, arr], idx) =>
        showMA && Array.isArray(arr) ? (
          <path
            key={color}
            d={arr
              .map((v, i) => (Number.isFinite(v) ? { i, v } : null))
              .filter(Boolean)
              .map(({ i, v }, idx2) => `${idx2 === 0 ? "M" : "L"}${xScale(i)} ${yScale(v)}`)
              .join(" ")}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
          />
        ) : null
      )}

      {data.map((d, i) => {
        const x = xScale(i);
        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yOpen = yScale(d.open);
        const yClose = yScale(d.close);
        const up = d.close >= d.open;
        const color = up ? "#22c55e" : "#ef4444";
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(1, Math.abs(yClose - yOpen));
        return (
          <g key={d.date || i}>
            <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1} />
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyH}
              fill={color}
              opacity={0.9}
            />
          </g>
        );
      })}
    </svg>
  );
}
