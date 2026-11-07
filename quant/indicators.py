import numpy as np
import pandas as pd

def add_indicators(df):
    x = df.copy()
    close = x["Close"].astype(float)
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    x["RSI"] = 100 - (100 / (1 + rs))
    x["SMA20"] = close.rolling(20).mean()
    x["SMA50"] = close.rolling(50).mean()
    x["EMA12"] = close.ewm(span=12, adjust=False).mean()
    x["EMA26"] = close.ewm(span=26, adjust=False).mean()
    x["MACD"] = x["EMA12"] - x["EMA26"]
    x["MACD_Signal"] = x["MACD"].ewm(span=9, adjust=False).mean()
    mid = close.rolling(20).mean()
    std = close.rolling(20).std()
    x["BB_Upper"] = mid + 2*std
    x["BB_Lower"] = mid - 2*std
    x["Returns"] = close.pct_change()
    x["LogReturns"] = np.log(close).diff()
    x["Volatility"] = x["LogReturns"].rolling(20).std() * np.sqrt(252)
    return x
