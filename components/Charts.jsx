"use client";

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const axisStyle = { fill: "#a1a1a1", fontSize: 11 };

function baseTooltip() {
  return (
    <Tooltip
      contentStyle={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        fontSize: 12,
        color: "#ededed",
      }}
      labelStyle={{ color: "#a1a1a1", fontSize: 11 }}
      itemStyle={{ color: "#ededed" }}
      cursor={{ stroke: "rgba(255,255,255,0.15)" }}
    />
  );
}

export function PriceArea({ data, height = 380 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ededed" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#ededed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={60} domain={["auto", "auto"]} />
        {baseTooltip()}
        <Area type="monotone" dataKey="close" stroke="#ededed" strokeWidth={2} fill="url(#px)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({ data, keys, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={60} domain={["auto", "auto"]} />
        {baseTooltip()}
        {keys.map((k, idx) => (
          <Line
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={
              ["#ededed", "#f59e0b", "#a78bfa", "#22c55e", "#ef4444", "#666666"][idx % 6]
            }
            strokeWidth={k.key === "close" ? 2 : 1.5}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RsiChart({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={40} domain={[0, 100]} />
        <ReferenceLine y={70} stroke="rgba(239,68,68,0.5)" dash="dot" />
        <ReferenceLine y={30} stroke="rgba(34,197,94,0.5)" dash="dot" />
        {baseTooltip()}
        <Line type="monotone" dataKey="rsi" name="RSI" stroke="#a78bfa" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MacdChart({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={50} domain={["auto", "auto"]} />
        {baseTooltip()}
        <Line type="monotone" dataKey="macd" name="MACD" stroke="#ededed" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="macdSignal" name="Signal" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart({ data, height = 180 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={60} />
        {baseTooltip()}
        <Bar dataKey="volume" fill="rgba(255,255,255,0.25)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EquityChart({ data, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={60} domain={["auto", "auto"]} />
        {baseTooltip()}
        <Line type="monotone" dataKey="strategy" name="Strategy" stroke="#ededed" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="buyHold" name="Buy & hold" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
