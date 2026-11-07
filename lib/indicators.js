// Small, dependency-free technical indicators / analytics helpers used by
// the serverless API routes.

export function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length === 0) return out;
  const k = 2 / (period + 1);
  out[0] = values[0];
  for (let i = 1; i < values.length; i += 1) {
    out[i] = values[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

export function rsi(values, period = 14) {
  const out = new Array(values.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (i >= period) {
      const rs = avgLoss === 0 ? null : avgGain / avgLoss;
      out[i] = rs === null ? 100 : 100 - (100 / (1 + rs));
    }
  }
  return out;
}

export function macd(values, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = values.map((_, i) => (emaFast[i] ?? 0) - (emaSlow[i] ?? 0));
  const validIdx = macdLine.findIndex((v) => Number.isFinite(v));
  const signalFrom = validIdx === -1 ? macdLine : macdLine.slice(validIdx);
  const signalLine = ema(signalFrom, signalPeriod);
  const signal = new Array(values.length).fill(null);
  for (let i = 0; i < signalLine.length; i += 1) {
    if (validIdx !== -1 && validIdx + i < values.length) {
      signal[validIdx + i] = signalLine[i];
    }
  }
  return { macdLine, signalLine: signal };
}

export function bollinger(values, period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper = new Array(values.length).fill(null);
  const lower = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i += 1) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = mid[i];
    const variance = window.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { mid, upper, lower };
}

export function decadesFromPeriod(period = "2y") {
  const n = parseInt(period, 10);
  const days = period.endsWith("mo") ? n * 30 : n * 365;
  return Date.now() / 1000 - days * 86400;
}

export function annualVolatility(returns) {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  return std * Math.sqrt(252);
}

export function logReturns(values) {
  const out = [];
  for (let i = 1; i < values.length; i += 1) {
    out.push(Math.log(values[i] / values[i - 1]));
  }
  return out;
}
