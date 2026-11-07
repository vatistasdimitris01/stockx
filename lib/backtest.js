// Moving-average crossover backtest (no fees, no slippage).

export function maBacktest(closes, fast = 20, slow = 50) {
  if (!closes || closes.length <= slow + 2) return null;
  const eq = [];
  const buyHold = [];
  const positions = [];
  let pos = 0;
  let value = 1;
  let holdValue = 1;

  const smaFast = [];
  const smaSlow = [];
  for (let i = 0; i < closes.length; i += 1) {
    if (i >= fast) {
      const s = closes.slice(i - fast + 1, i + 1).reduce((a, b) => a + b, 0) / fast;
      smaFast.push(s);
    } else smaFast.push(null);
    if (i >= slow) {
      const s = closes.slice(i - slow + 1, i + 1).reduce((a, b) => a + b, 0) / slow;
      smaSlow.push(s);
    } else smaSlow.push(null);
  }

  for (let i = 1; i < closes.length; i += 1) {
    // trade on prior day's signal
    if (i - 1 >= slow) {
      const prevFast = smaFast[i - 1];
      const prevSlow = smaSlow[i - 1];
      pos = prevFast > prevSlow ? 1 : 0;
    }
    const ret = closes[i] / closes[i - 1] - 1;
    value *= 1 + pos * ret;
    holdValue *= 1 + ret;
    eq.push({ i, equity: value, buyHold: holdValue, pos, close: closes[i] });
    positions.push(pos);
  }

  const peak = [];
  let maxSeen = 1;
  for (const p of eq) {
    maxSeen = Math.max(maxSeen, p.equity);
    peak.push(maxSeen);
  }
  const drawdowns = eq.map((p, idx) => p.equity / peak[idx] - 1);
  const maxDrawdown = Math.min(...drawdowns, 0);

  const strategyRetSeries = [];
  for (let i = 1; i < eq.length; i += 1) {
    strategyRetSeries.push(eq[i].equity / eq[i - 1].equity - 1);
  }
  const mean = strategyRetSeries.reduce((a, b) => a + b, 0) / (strategyRetSeries.length || 1);
  const variance =
    strategyRetSeries.reduce((acc, r) => acc + (r - mean) ** 2, 0) /
    (Math.max(1, strategyRetSeries.length - 1));
  const vol = Math.sqrt(variance);
  const sharpe = vol > 0 ? (mean / vol) * Math.sqrt(252) : 0;

  return {
    strategyReturn: (eq[eq.length - 1]?.equity ?? 1) - 1,
    buyHoldReturn: (eq[eq.length - 1]?.buyHold ?? 1) - 1,
    maxDrawdown,
    sharpe,
    equity: eq.map((e) => ({ date: e.i, strategy: e.equity, buyHold: e.buyHold, close: e.close })),
    smaFast,
    smaSlow,
    closes,
  };
}
