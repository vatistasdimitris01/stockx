import numpy as np
import pandas as pd

def moving_average_backtest(data, fast=20, slow=50):
    x = data[["Close"]].copy()
    x["fast"] = x["Close"].rolling(fast).mean()
    x["slow"] = x["Close"].rolling(slow).mean()
    x["position"] = (x["fast"] > x["slow"]).astype(float).shift(1).fillna(0)
    x["returns"] = x["Close"].pct_change().fillna(0)
    x["strategy"] = x["position"] * x["returns"]
    x["equity"] = (1+x["strategy"]).cumprod()
    x["buy_hold"] = (1+x["returns"]).cumprod()
    peak = x["equity"].cummax()
    drawdown = x["equity"]/peak - 1
    vol = x["strategy"].std()
    sharpe = (x["strategy"].mean()/vol*np.sqrt(252)) if vol and np.isfinite(vol) else 0
    return {"strategy_return": float(x["equity"].iloc[-1]-1),
            "buy_hold_return": float(x["buy_hold"].iloc[-1]-1),
            "max_drawdown": float(drawdown.min()), "sharpe": float(sharpe),
            "equity": x[["equity", "buy_hold"]].rename(columns={"equity":"Strategy", "buy_hold":"Buy & hold"})}
