import streamlit as st
import pandas as pd

@st.cache_data(ttl=300, show_spinner=False)
def _download(ticker, period, interval):
    import yfinance as yf
    df = yf.download(ticker, period=period, interval=interval, auto_adjust=True, progress=False)
    if df is None or df.empty:
        return pd.DataFrame()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    needed = ["Open", "High", "Low", "Close", "Volume"]
    return df[[c for c in needed if c in df.columns]].dropna(subset=["Close"])

def load_prices(ticker, period="2y", interval="1d", refresh=False):
    if refresh:
        _download.clear()
    return _download(ticker, period, interval)

def market_snapshot():
    import yfinance as yf
    symbols = {"S&P 500": "^GSPC", "NASDAQ": "^IXIC", "Dow Jones": "^DJI", "DAX": "^GDAXI", "FTSE 100": "^FTSE"}
    rows = []
    for name, symbol in symbols.items():
        try:
            df = yf.download(symbol, period="5d", interval="1d", auto_adjust=True, progress=False)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            if len(df) >= 2:
                last, prior = float(df["Close"].iloc[-1]), float(df["Close"].iloc[-2])
                rows.append({"Index": name, "Latest close": last, "Change": (last/prior-1)*100})
        except Exception:
            continue
    return pd.DataFrame(rows)


def load_multi_market():
    """Download a cross-market snapshot using Yahoo Finance."""
    import pandas as pd
    import yfinance as yf

    instruments = [
        ("^GSPC", "S&P 500", "USA", "Index"),
        ("^IXIC", "NASDAQ Composite", "USA", "Index"),
        ("^DJI", "Dow Jones", "USA", "Index"),
        ("^RUT", "Russell 2000", "USA", "Index"),
        ("^STOXX50E", "Euro Stoxx 50", "Europe", "Index"),
        ("^GDAXI", "DAX", "Germany", "Index"),
        ("^FTSE", "FTSE 100", "UK", "Index"),
        ("^FCHI", "CAC 40", "France", "Index"),
        ("^N225", "Nikkei 225", "Japan", "Index"),
        ("^HSI", "Hang Seng", "Hong Kong", "Index"),
        ("GC=F", "Gold", "Global", "Commodity"),
        ("SI=F", "Silver", "Global", "Commodity"),
        ("CL=F", "Crude Oil", "Global", "Commodity"),
        ("BZ=F", "Brent Oil", "Global", "Commodity"),
        ("NG=F", "Natural Gas", "Global", "Commodity"),
        ("EURUSD=X", "EUR/USD", "Forex", "Currency"),
        ("GBPUSD=X", "GBP/USD", "Forex", "Currency"),
        ("USDJPY=X", "USD/JPY", "Forex", "Currency"),
        ("BTC-USD", "Bitcoin", "Crypto", "Cryptocurrency"),
        ("ETH-USD", "Ethereum", "Crypto", "Cryptocurrency"),
        ("SOL-USD", "Solana", "Crypto", "Cryptocurrency"),
        ("AAPL", "Apple", "USA", "Stock"),
        ("MSFT", "Microsoft", "USA", "Stock"),
        ("NVDA", "NVIDIA", "USA", "Stock"),
        ("TSLA", "Tesla", "USA", "Stock"),
    ]

    results = []

    for symbol, name, market, asset_type in instruments:
        try:
            history = yf.Ticker(symbol).history(
                period="5d",
                interval="1d",
                auto_adjust=True
            )

            if history.empty or len(history) < 1:
                continue

            price = float(history["Close"].dropna().iloc[-1])
            previous = (
                float(history["Close"].dropna().iloc[-2])
                if len(history["Close"].dropna()) >= 2
                else price
            )

            change = (
                ((price - previous) / previous) * 100
                if previous else 0.0
            )

            volume = (
                int(history["Volume"].fillna(0).iloc[-1])
                if "Volume" in history.columns else 0
            )

            results.append({
                "Symbol": symbol,
                "Name": name,
                "Market": market,
                "Type": asset_type,
                "Price": price,
                "Change %": change,
                "Change": change,
                "Volume": volume,
                "Previous Close": previous,
            })

        except Exception:
            continue

    return pd.DataFrame(results)
