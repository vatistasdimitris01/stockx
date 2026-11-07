// Deterministic forecast engine: linear regression + EMA ensemble.
// No LLM, no simulation. Confidence is derived from agreement and trend fit.

import { ema } from "./indicators";

function linreg(y) {
  const n = y.length;
  const t = Array.from({ length: n }, (_, i) => i);
  const sumX = t.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = t.reduce((acc, x, i) => acc + x * y[i], 0);
  const sumX2 = t.reduce((acc, x) => acc + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function forecastSeries(closes, horizon = 20) {
  if (!closes || closes.length < 40) return null;
  const last = closes[closes.length - 1];
  const logPrices = closes.slice(-250).map((c) => Math.log(c));
  const { slope, intercept } = linreg(logPrices);
  const trendPrice = Math.exp(intercept + slope * (logPrices.length - 1 + horizon));

  const ema20 = ema(closes, 20);
  const emaNow = ema20[ema20.length - 1];
  const emaPrev = ema20[Math.max(0, ema20.length - 6)];
  const recentSlope = Math.log(emaNow / emaPrev) / 5;
  const clamped = Math.max(-0.03, Math.min(0.03, recentSlope));
  const emaPrice = last * Math.exp(clamped * horizon);

  const trendReturn = trendPrice / last - 1;
  const emaReturn = emaPrice / last - 1;
  const ensembleReturn = 0.5 * trendReturn + 0.5 * emaReturn;
  const agreement = (trendPrice > last ? 1 : 0) + (emaPrice > last ? 1 : 0);

  // Confidence from magnitude, agreement, and trend fit
  const rSquared = (() => {
    const mean = logPrices.reduce((a, b) => a + b, 0) / logPrices.length;
    const ssTot = logPrices.reduce((acc, v, i) => {
      const fitted = intercept + slope * i;
      return acc + (v - mean) ** 2 + (v - fitted) ** 2;
    }, 0);
    const ssReg = logPrices.reduce((acc, _, i) => {
      const fitted = intercept + slope * i;
      return acc + (fitted - mean) ** 2;
    }, 0);
    return ssTot ? ssReg / ssTot : 0;
  })();

  let confidence = 0;
  confidence += Math.min(Math.abs(ensembleReturn) / 0.05, 1) * 40;
  if (agreement === 2 || agreement === 0) confidence += 20;
  if (rSquared > 0.3) confidence += 10;
  if (Math.abs(ensembleReturn) > 0.01) confidence += 10;
  if (horizon >= 10) confidence += 10;
  confidence = Math.max(0, Math.min(100, confidence));

  let action = "WAIT";
  let reason = "Signals are mixed or too small for a directional call.";
  const threshold = 0.01;
  if (ensembleReturn > threshold && agreement === 2 && confidence >= 50) {
    action = "BUY";
    reason = "Trend and momentum both point higher; ensemble expectation is positive.";
  } else if (ensembleReturn > threshold && agreement >= 1 && confidence >= 35) {
    action = "BUY";
    reason = "Trend and momentum agree on higher prices over the horizon.";
  } else if (ensembleReturn < -threshold && agreement === 0 && confidence >= 50) {
    action = "SELL";
    reason = "Trend and momentum both point lower; downside pressure is clear.";
  } else if (ensembleReturn < -threshold && agreement <= 1 && confidence >= 35) {
    action = "SELL";
    reason = "Trend and momentum lean lower over the horizon.";
  } else if (Math.abs(ensembleReturn) <= threshold) {
    action = "HOLD";
    reason = "Estimated move is small relative to the decision threshold.";
  }

  return {
    trendPrice,
    emaPrice,
    ensembleReturn,
    confidence,
    action,
    reason,
    horizon,
    last,
  };
}
