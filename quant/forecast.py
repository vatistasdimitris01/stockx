import numpy as np
import pandas as pd

def _regression_forecast(log_prices, horizon):
    y = np.asarray(log_prices[-120:], dtype=float)
    t = np.arange(len(y))
    slope, intercept = np.polyfit(t, y, 1)
    return float(np.exp(intercept + slope*(len(y)-1+horizon)))

def _ema_forecast(close, horizon):
    s = pd.Series(close).ewm(span=20, adjust=False).mean()
    recent = np.log(s.iloc[-1] / s.iloc[-6]) / 5
    recent = float(np.clip(recent, -0.03, 0.03))
    return float(close[-1] * np.exp(recent*horizon))

def _arima_forecast(close, horizon):
    try:
        from statsmodels.tsa.arima.model import ARIMA
        model = ARIMA(np.log(np.asarray(close[-250:], dtype=float)), order=(1,1,1))
        fit = model.fit()
        forecast = fit.forecast(steps=horizon)
        return float(np.exp(forecast.iloc[-1] if hasattr(forecast, "iloc") else forecast[-1]))
    except Exception:
        return None

def _rolling_error(close, method, window=250):
    # Historical one-step error estimate using expanding, strictly prior observations.
    errors = []
    start = max(60, len(close)-window)
    for i in range(start, len(close)-1):
        hist = close[:i+1]
        if method == "Trend regression":
            pred = _regression_forecast(np.log(hist), 1)
        elif method == "EMA trend":
            pred = _ema_forecast(hist, 1)
        else:
            continue
        errors.append(abs(pred/close[i+1]-1))
    return float(np.mean(errors)) if errors else 0.03

def run_forecasts(data, horizon=20, n_simulations=3000):
    close = data["Close"].dropna().to_numpy(dtype=float)
    if len(close) < 40:
        raise ValueError("At least 40 observations are required.")
    last = float(close[-1])
    log_returns = np.diff(np.log(close))
    mu = float(np.mean(log_returns[-252:]))
    sigma = float(np.std(log_returns[-252:], ddof=1))
    rng = np.random.default_rng(42)
    paths = rng.normal(mu, sigma, size=(n_simulations, horizon))
    terminal = last * np.exp(paths.sum(axis=1))
    mc_median, mc_low, mc_high = np.quantile(terminal, [0.5, 0.05, 0.95])

    forecasts = {
        "Trend regression": _regression_forecast(np.log(close), horizon),
        "EMA trend": _ema_forecast(close, horizon),
    }
    arima = _arima_forecast(close, horizon)
    if arima is not None and np.isfinite(arima):
        forecasts["ARIMA(1,1,1)"] = arima

    errors = {name: _rolling_error(close, name) for name in forecasts if name != "ARIMA(1,1,1)"}
    # ARIMA has no equivalent rolling evaluation in this lightweight implementation; do not give it a fabricated score.
    rows, weighted, total_w = [], 0.0, 0.0
    for name, price in forecasts.items():
        ret = price/last - 1
        err = errors.get(name)
        weight = min(1/max(err or 0.05, 0.005), 100) if err is not None else 0.0
        weighted += ret*weight
        total_w += weight
        rows.append({"Method": name, "Forecast price": price, "Expected change": ret*100,
                     "Rolling 1-step error": err*100 if err is not None else np.nan,
                     "Weight": weight})
    ensemble_return = weighted/total_w if total_w else 0.0
    daily_vol = sigma
    downside = float(np.quantile(terminal/last-1, 0.05))
    rsi = float(data["RSI"].iloc[-1]) if pd.notna(data["RSI"].iloc[-1]) else 50
    agreement = sum(1 for p in forecasts.values() if p > last) / len(forecasts)
    if len(forecasts) < 2 or sigma <= 0:
        signal, reason = "WAIT", "Insufficient independent forecast evidence or usable volatility estimate."
    elif ensemble_return > max(0.015, sigma*np.sqrt(horizon)*0.20) and agreement >= 0.67 and downside > -0.25 and rsi < 78:
        signal, reason = "BUY", "Positive ensemble return, model agreement, and downside threshold passed."
    elif ensemble_return < -max(0.015, sigma*np.sqrt(horizon)*0.20) and agreement <= 0.33 and rsi > 22:
        signal, reason = "SELL", "Negative ensemble return and model agreement passed the downside threshold."
    elif abs(ensemble_return) < 0.005:
        signal, reason = "HOLD", "Estimated return is small relative to the decision threshold."
    else:
        signal, reason = "WAIT", "Forecasts are mixed or uncertainty is too high for a directional signal."

    # Confidence score (0-100) for the AI decision
    conf = 0.0
    conf += min(abs(ensemble_return) / 0.05, 1.0) * 40.0
    if (signal in ("BUY",) and agreement >= 0.67) or (signal in ("SELL",) and agreement <= 0.33):
        conf += 20.0
    if downside > -0.15:
        conf += 10.0
    if rsi < 75 and rsi > 25:
        conf += 10.0
    if sigma < 0.03:
        conf += 10.0
    if signal in ("HOLD", "WAIT"):
        conf = min(conf, 45.0)
    confidence = float(np.clip(conf, 0.0, 100.0))

    if signal == "BUY":
        action = "Buy"
    elif signal == "SELL":
        action = "Sell"
    elif signal == "HOLD":
        action = "Hold"
    else:
        action = "Wait"

    risk_level = "Low" if sigma < 0.02 else ("Medium" if sigma < 0.04 else "High")

    bins = pd.cut(terminal, bins=30)
    distribution = pd.Series(terminal).value_counts(bins=30, sort=False).rename_axis("Price range").to_frame("Count")
    distribution.index = distribution.index.astype(str)
    return {"models": pd.DataFrame(rows), "ensemble_return": ensemble_return,
            "mc_median": float(mc_median), "mc_low": float(mc_low), "mc_high": float(mc_high),
            "daily_vol": daily_vol, "distribution": distribution,
            "decision": {"signal": signal, "reason": reason, "confidence": confidence,
                         "action": action, "risk": risk_level}}
