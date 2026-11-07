import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from quant.data import load_prices, load_multi_market
from quant.indicators import add_indicators
from quant.forecast import run_forecasts
from quant.backtest import moving_average_backtest

st.set_page_config(
    page_title="StocksX",
    page_icon="V",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

:root {
    --bg: #000000;
    --surface: #0a0a0a;
    --surface-2: #111111;
    --border: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.14);
    --text: #ededed;
    --muted: #a1a1a1;
    --muted-2: #666666;
    --accent: #ffffff;
}

html, body, .stApp, [data-testid="stAppViewContainer"] {
    background: var(--bg) !important;
    color: var(--text) !important;
}

* {
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Sidebar: no border, blends with app */
[data-testid="stSidebar"] {
    background: var(--surface) !important;
    border-right: none !important;
    border: none !important;
    box-shadow: none !important;
}

[data-testid="stSidebar"] > div,
[data-testid="stSidebarContent"],
section[data-testid="stSidebar"] {
    border: none !important;
    box-shadow: none !important;
}

/* Collapsed control: no border */
[data-testid="collapsedControl"],
[data-testid="collapsedControl"] button {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
}

[data-testid="stSidebar"] > div,
[data-testid="stSidebarContent"] {
    background: var(--surface) !important;
}

[data-testid="stSidebarContent"] {
    padding-top: 1.5rem;
}

.block-container {
    max-width: 1280px;
    padding-top: 2rem;
    padding-bottom: 4rem;
}

h1, h2, h3, h4 {
    letter-spacing: -0.02em;
    color: var(--text);
    font-weight: 600;
}

h1 {
    font-size: 28px !important;
    font-weight: 700 !important;
    letter-spacing: -0.03em !important;
}

h2 {
    font-size: 22px !important;
}

h3 {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: var(--text) !important;
}

h4 {
    font-size: 14px !important;
}

.stCaption, [data-testid="stCaptionContainer"] {
    color: var(--muted) !important;
    font-size: 13px !important;
}

/* Metrics */
[data-testid="stMetric"] {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    transition: border-color 0.15s ease;
}

[data-testid="stMetric"]:hover {
    border-color: var(--border-strong);
}

[data-testid="stMetricLabel"] {
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 500 !important;
}

[data-testid="stMetricValue"] {
    color: var(--text) !important;
    font-size: 22px !important;
    font-weight: 600 !important;
    font-family: 'Geist Mono', monospace !important;
    letter-spacing: -0.02em;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 0;
    background: transparent;
    border-bottom: 1px solid var(--border);
    padding: 0;
    overflow-x: auto;
    scrollbar-width: none;
}

.stTabs [data-baseweb="tab-list"]::-webkit-scrollbar {
    display: none;
}

.stTabs [data-baseweb="tab"] {
    color: var(--muted);
    background: transparent;
    border: none;
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
}

.stTabs [data-baseweb="tab"]:hover {
    color: var(--text);
}

.stTabs [aria-selected="true"] {
    color: var(--text) !important;
    border-bottom: 2px solid var(--text) !important;
}

/* Buttons */
.stButton button, .stDownloadButton button {
    border-radius: 6px;
    background: var(--text);
    border: 1px solid var(--text);
    color: #000000;
    font-weight: 500;
    font-size: 13px;
    padding: 8px 14px;
    transition: opacity 0.15s ease;
}

.stButton button:hover {
    opacity: 0.85;
    background: var(--text);
    color: #000000;
    border-color: var(--text);
}

/* Inputs */
.stTextInput input,
.stNumberInput input,
.stTextArea textarea {
    background: var(--surface-2) !important;
    border: 1px solid var(--border-strong) !important;
    border-radius: 6px !important;
    color: var(--text) !important;
    font-size: 13px !important;
}

.stTextInput input:focus,
.stNumberInput input:focus {
    border-color: #ffffff !important;
    box-shadow: 0 0 0 1px #ffffff !important;
}

.stSelectbox div[data-baseweb="select"] > div {
    background: var(--surface-2) !important;
    border: 1px solid var(--border-strong) !important;
    border-radius: 6px !important;
    color: var(--text) !important;
    min-height: 36px;
}

/* DataFrame */
div[data-testid="stDataFrame"] {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-2);
}

/* Expanders */
.streamlit-expanderHeader {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
}

details {
    border: none;
}

/* HR */
hr {
    border-color: var(--border) !important;
    margin: 1.5rem 0;
}

/* Market card */
.market-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 12px;
}

.subtitle {
    color: var(--muted);
    font-size: 13px;
}

.signal {
    display: inline-block;
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.04em;
    border: 1px solid rgba(34, 197, 94, 0.25);
}

.stPlotlyChart {
    border-radius: 8px;
    overflow: hidden;
}

/* Sidebar labels */
[data-testid="stSidebar"] .stTextInput label,
[data-testid="stSidebar"] .stSelectbox label {
    color: var(--muted) !important;
    font-size: 12px !important;
    font-weight: 500;
}

/* Hide chrome */
header[data-testid="stHeader"] {
    background: transparent !important;
}

[data-testid="stToolbar"] {
    display: none;
}

#MainMenu {
    visibility: hidden;
}

footer {
    visibility: hidden;
}

.stAlert {
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
}

[data-testid="stDataEditor"] {
    border: 1px solid var(--border);
    border-radius: 8px;
}
</style>
""", unsafe_allow_html=True)

# Floating sidebar toggle (always visible)
st.markdown(
    """
    <button id="stocksx-sidebar-toggle" class="stocksx-sidebar-toggle" onclick="stocksxToggleSidebar()" aria-label="Toggle sidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    </button>
    <style>
        .stocksx-sidebar-toggle {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 999999;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(10,10,10,0.85);
            color: #ededed;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: background 0.15s ease, transform 0.15s ease;
        }
        .stocksx-sidebar-toggle:hover {
            background: rgba(255,255,255,0.12);
            transform: scale(1.05);
        }
    </style>
    <script>
        function stocksxToggleSidebar() {
            const candidates = [
                'button[aria-label="Collapse sidebar"]',
                'button[aria-label="Expand sidebar"]',
                '[data-testid="collapsedControl"] button',
                '[data-testid="stSidebarCollapseButton"] button'
            ];
            for (const sel of candidates) {
                const btn = document.querySelector(sel);
                if (btn) { btn.click(); return; }
            }
        }
    </script>
    """,
    unsafe_allow_html=True,
)


# -------------------------------------------------
# CHART CONFIGURATION
# -------------------------------------------------

def configure_chart(fig, height=430):
    fig.update_layout(
        template="plotly_dark",
        height=height,
        paper_bgcolor="#000000",
        plot_bgcolor="#000000",
        font=dict(color="#a1a1a1", family="Geist"),
        margin=dict(l=5, r=5, t=25, b=5),
        hovermode="x unified",
        xaxis=dict(
            showgrid=False,
            rangeslider=dict(visible=False),
            linecolor="rgba(255,255,255,0.08)"
        ),
        yaxis=dict(
            side="right",
            gridcolor="rgba(255,255,255,0.06)"
        ),
        legend=dict(
            orientation="h",
            y=1.08,
            font=dict(color="#a1a1a1", size=11)
        )
    )
    return fig


def create_price_chart(data, chart_type, show_sma):
    fig = go.Figure()

    if chart_type == "Candlestick":
        fig.add_trace(go.Candlestick(
            x=data.index,
            open=data["Open"],
            high=data["High"],
            low=data["Low"],
            close=data["Close"],
            name="Price",
            increasing_line_color="#22c55e",
            decreasing_line_color="#ef4444"
        ))
    else:
        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["Close"],
            name="Price",
            line=dict(color="#ededed", width=2),
            fill="tozeroy",
            fillcolor="rgba(255,255,255,0.04)"
        ))

    if show_sma:
        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["SMA20"],
            name="SMA 20",
            line=dict(color="#f59e0b", width=1)
        ))

        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["SMA50"],
            name="SMA 50",
            line=dict(color="#a78bfa", width=1)
        ))

    return configure_chart(fig, 490)


# -------------------------------------------------
# SIDEBAR
# -------------------------------------------------

with st.sidebar:
    st.markdown(
        """
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:34px;height:34px;border-radius:8px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3v18h18"/>
                    <path d="M7 14l4-4 3 3 5-6"/>
                </svg>
            </div>
            <div>
                <div style="font-weight:600;font-size:15px;color:#ededed;letter-spacing:-0.02em;">StocksX</div>
                <div style="font-size:11px;color:#a1a1a1;">Market intelligence</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.divider()

    # Universal search
    st.markdown("##### :material/search: Universal search")
    all_symbols = [
        "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "SPY", "QQQ",
        "GC=F", "SI=F", "CL=F", "NG=F", "BTC-USD", "ETH-USD", "SOL-USD",
        "^GSPC", "^IXIC", "^DJI", "^RUT", "^GDAXI", "^FTSE", "^FCHI", "^STOXX50E",
        "^N225", "^HSI", "^AXJO", "EURUSD=X", "GBPUSD=X", "JPY=X", "GLD", "TLT",
    ]
    pages = ["Overview", "Markets", "Chart Analysis", "Predictions", "Market Scanner",
             "Backtesting", "Portfolio", "Settings"]
    indicators = ["RSI", "MACD", "Bollinger", "SMA20", "SMA50", "Volatility"]

    if "ticker" not in st.session_state:
        st.session_state.ticker = "AAPL"

    universal = st.text_input(
        "Search",
        placeholder="Symbols, pages, indicators...",
        label_visibility="collapsed",
        key="universal_search",
    )
    if universal:
        q = universal.lower()
        sym_matches = [s for s in all_symbols if q in s.lower()]
        page_matches = [p for p in pages if q in p.lower()]
        ind_matches = [i for i in indicators if q in i.lower()]
        if sym_matches:
            chosen_sym = st.selectbox("Symbols", sym_matches, key="search_sym_pick")
            if chosen_sym:
                st.session_state.ticker = chosen_sym
        if page_matches:
            st.caption("Pages: " + ", ".join(page_matches))
        if ind_matches:
            st.caption("Indicators: " + ", ".join(ind_matches))
        if not (sym_matches or page_matches or ind_matches):
            st.caption("No matches found.")

    ticker = st.text_input(
        "Symbol",
        value=st.session_state.ticker,
        help="Ticker symbol, e.g. AAPL, MSFT, BTC-USD, ^GSPC",
    ).upper().strip()
    if ticker:
        st.session_state.ticker = ticker

    st.markdown("##### :material/watchlist: Watchlist")
    watch_cols = st.columns(4)
    for i, sym in enumerate(["AAPL", "MSFT", "NVDA", "TSLA"]):
        with watch_cols[i]:
            if st.button(sym, key=f"watch_{sym}", use_container_width=True):
                st.session_state.ticker = sym
                st.rerun()

    st.divider()

    col_p, col_i = st.columns(2)
    with col_p:
        period = st.selectbox(
            "Period",
            ["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"],
            index=4,
            help="Historical lookback window",
        )
    with col_i:
        interval = st.selectbox(
            "Interval",
            ["1d", "1wk"],
            index=0,
            help="Bar timeframe",
        )

    st.markdown("##### :material/show_chart: Chart")
    chart_type = st.segmented_control(
        "Style",
        ["Candlestick", "Line"],
        default="Candlestick",
    )
    show_sma = st.checkbox("Show moving averages (SMA 20/50)", True)

    st.markdown("##### :material/insights: Forecast")
    col_h, col_s = st.columns(2)
    with col_h:
        horizon = st.selectbox(
            "Horizon (days)",
            [1, 5, 10, 20, 60],
            index=3,
            help="Prediction horizon in trading days",
        )
    with col_s:
        simulations = st.select_slider(
            "MC sims",
            options=[500, 1000, 2000, 3000, 5000, 10000],
            value=3000,
            help="Monte Carlo simulation count",
        )

    refresh = st.button("Refresh data", icon=":material/refresh:", use_container_width=True)

    st.divider()

    with st.expander(":material/settings: Engine details", expanded=False):
        st.caption("Statistical forecasting (ARIMA, EMA, trend)")
        st.caption("Monte Carlo simulation")
        st.caption("Technical analysis (RSI, MACD, BB)")
        st.caption("Historical backtesting")
        st.caption("Data: Yahoo Finance (yfinance)")

    with st.expander(":material/help: How to use", expanded=False):
        st.markdown(
            "1. Search or enter a ticker symbol.\n"
            "2. Pick period and timeframe.\n"
            "3. Explore tabs for charts, predictions, scanner, backtests.\n"
            "4. Adjust forecast horizon / simulations as needed."
        )


# -------------------------------------------------
# DATA
# -------------------------------------------------

if not ticker:
    st.stop()

try:
    with st.spinner("Loading market data..."):
        prices = load_prices(
            ticker,
            period,
            interval,
            refresh=refresh
        )

    if prices.empty or len(prices) < 40:
        st.error("Insufficient historical data.")
        st.stop()

    data = add_indicators(prices)

except Exception as error:
    st.error(f"Market data error: {error}")
    st.stop()


latest = data.iloc[-1]
previous = float(data["Close"].iloc[-2])

price = float(latest["Close"])
change = (price / previous - 1) * 100


# -------------------------------------------------
# HEADER
# -------------------------------------------------

st.caption("MARKET OVERVIEW / QUANTITATIVE RESEARCH")

st.title(f"{ticker} Market Overview")

st.markdown(
    '<p class="subtitle">Your quantitative market intelligence workspace.</p>',
    unsafe_allow_html=True
)

a, b, c, d, e = st.columns(5)

a.metric("Latest close", f"{price:,.2f}", f"{change:+.2f}%")

b.metric(
    "Day high",
    f"{float(latest['High']):,.2f}"
)

c.metric(
    "Day low",
    f"{float(latest['Low']):,.2f}"
)

d.metric(
    "RSI",
    f"{latest['RSI']:.1f}"
)

e.metric(
    "Annual volatility",
    f"{latest['Volatility'] * 100:.1f}%"
)


# -------------------------------------------------
# MAIN NAVIGATION
# -------------------------------------------------

tabs = st.tabs([
    ":material/dashboard: Overview",
    ":material/public: Markets",
    ":material/show_chart: Chart Analysis",
    ":material/insights: Predictions",
    ":material/radar: Market Scanner",
    ":material/science: Backtesting",
    ":material/account_balance_wallet: Portfolio",
    ":material/settings: Settings"
])


# -------------------------------------------------
# OVERVIEW
# -------------------------------------------------

with tabs[0]:

    st.markdown("### Price performance")

    col1, col2 = st.columns([3, 1])

    with col1:

        fig = create_price_chart(
            data,
            chart_type,
            show_sma
        )

        st.plotly_chart(
            fig,
            use_container_width=True,
            config={"displaylogo": False}
        )

    with col2:

        st.markdown("### Statistics")

        st.metric(
            "52-week high",
            f"{data['High'].tail(252).max():,.2f}"
        )

        st.metric(
            "52-week low",
            f"{data['Low'].tail(252).min():,.2f}"
        )

        st.metric(
            "Average volume",
            f"{data['Volume'].tail(20).mean():,.0f}"
        )

        st.metric(
            "Observations",
            len(data)
        )

    st.divider()

    st.markdown("### Trading volume")

    volume_fig = go.Figure()

    volume_fig.add_trace(go.Bar(
        x=data.index,
        y=data["Volume"],
        marker_color="rgba(255,255,255,0.25)"
    ))

    st.plotly_chart(
        configure_chart(volume_fig, 220),
        use_container_width=True
    )


# -------------------------------------------------
# MARKETS
# -------------------------------------------------

with tabs[1]:

    st.markdown("### Global markets")

    st.caption(
        "Explore equities, indices, commodities, currencies and crypto."
    )

    markets = load_multi_market()

    if not markets.empty:

        st.dataframe(
            markets,
            use_container_width=True,
            hide_index=True
        )

    st.markdown("### Market categories")

    categories = {
        "US indices": ["^GSPC", "^IXIC", "^DJI", "^RUT"],
        "European indices": ["^GDAXI", "^FTSE", "^FCHI", "^STOXX50E"],
        "Asian indices": ["^N225", "^HSI", "^AXJO"],
        "Commodities": ["GC=F", "SI=F", "CL=F", "NG=F"],
        "Forex": ["EURUSD=X", "GBPUSD=X", "JPY=X"],
        "Cryptocurrency": ["BTC-USD", "ETH-USD", "SOL-USD"],
        "ETFs": ["SPY", "QQQ", "GLD", "TLT"]
    }

    for category, symbols in categories.items():

        with st.expander(category):
            st.write(" · ".join(symbols))


# -------------------------------------------------
# CHART ANALYSIS
# -------------------------------------------------

with tabs[2]:

    st.markdown("### Technical analysis")

    left, right = st.columns(2)

    with left:

        st.markdown("#### RSI")

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["RSI"],
            line=dict(color="#a78bfa", width=2)
        ))

        fig.add_hline(y=70, line_dash="dot", line_color="#ef4444")
        fig.add_hline(y=30, line_dash="dot", line_color="#22c55e")

        fig.update_yaxes(range=[0, 100])

        st.plotly_chart(
            configure_chart(fig, 280),
            use_container_width=True
        )

    with right:

        st.markdown("#### MACD")

        fig = go.Figure()

        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["MACD"],
            name="MACD",
            line=dict(color="#ededed")
        ))

        fig.add_trace(go.Scatter(
            x=data.index,
            y=data["MACD_Signal"],
            name="Signal",
            line=dict(color="#f59e0b")
        ))

        st.plotly_chart(
            configure_chart(fig, 280),
            use_container_width=True
        )

    st.markdown("#### Bollinger bands")

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=data.index,
        y=data["BB_Upper"],
        name="Upper band",
        line=dict(color="#666666", dash="dot")
    ))

    fig.add_trace(go.Scatter(
        x=data.index,
        y=data["BB_Lower"],
        name="Lower band",
        line=dict(color="#666666", dash="dot"),
        fill="tonexty",
        fillcolor="rgba(255,255,255,0.04)"
    ))

    fig.add_trace(go.Scatter(
        x=data.index,
        y=data["Close"],
        name="Price",
        line=dict(color="#ededed", width=2)
    ))

    st.plotly_chart(
        configure_chart(fig, 350),
        use_container_width=True
    )

    st.markdown("#### Indicator history")

    st.dataframe(
        data.tail(30).sort_index(ascending=False),
        use_container_width=True
    )


# -------------------------------------------------
# PREDICTIONS
# -------------------------------------------------

with tabs[3]:

    st.markdown("### Quantitative prediction engine")

    st.caption(
        "Independent statistical forecasting methods. No LLMs or AI APIs."
    )

    try:

        result = run_forecasts(
            data,
            horizon=horizon,
            n_simulations=simulations
        )

        decision = result["decision"]

        col_sig, col_conf, col_risk = st.columns([2, 1, 1])
        with col_sig:
            st.markdown(
                f'<span class="signal">{decision["signal"]}</span> '
                f'<span style="margin-left:8px;color:#a1a1a1;font-size:13px;">AI action: {decision["action"]}</span>',
                unsafe_allow_html=True
            )
        with col_conf:
            st.metric("Confidence", f'{decision["confidence"]:.0f}%')
        with col_risk:
            st.metric("Risk", decision["risk"])

        st.write(decision["reason"])

        if decision["signal"] == "BUY":
            st.success("AI suggests BUYING: forecast and indicators align upward.")
        elif decision["signal"] == "SELL":
            st.error("AI suggests SELLING/avoiding: forecast and indicators align downward.")
        else:
            st.info("AI suggests HOLDING/WAITING: no clear directional edge.")

        a, b, c, d = st.columns(4)

        a.metric(
            "Expected return",
            f"{result['ensemble_return'] * 100:+.2f}%"
        )

        b.metric(
            "Monte Carlo median",
            f"{result['mc_median']:,.2f}"
        )

        c.metric(
            "5th percentile",
            f"{result['mc_low']:,.2f}"
        )

        d.metric(
            "95th percentile",
            f"{result['mc_high']:,.2f}"
        )

        st.markdown("#### Individual model predictions")

        st.dataframe(
            result["models"],
            use_container_width=True,
            hide_index=True
        )

        st.markdown("#### Monte Carlo distribution")

        st.bar_chart(
            result["distribution"],
            use_container_width=True
        )

        st.warning(
            "Forecasts are statistical estimates, not guaranteed outcomes."
        )

    except Exception as error:

        st.error(f"Prediction error: {error}")


# -------------------------------------------------
# MARKET SCANNER
# -------------------------------------------------

with tabs[4]:

    st.markdown("### Quantitative market scanner")

    st.caption(
        "Scan a selection of liquid symbols for momentum, volatility and volume."
    )

    scan_symbols = st.text_input(
        "Symbols to scan",
        "AAPL, MSFT, NVDA, TSLA, AMZN, META, GOOGL, SPY, QQQ"
    )

    if st.button("Run market scan"):

        import yfinance as yf

        results = []

        for symbol in [
            x.strip().upper()
            for x in scan_symbols.split(",")
            if x.strip()
        ]:

            try:

                df = load_prices(symbol, "6mo", "1d")

                if len(df) < 40:
                    continue

                indicators = add_indicators(df)
                row = indicators.iloc[-1]

                results.append({
                    "Symbol": symbol,
                    "Price": float(row["Close"]),
                    "RSI": float(row["RSI"]),
                    "Volatility %": float(row["Volatility"] * 100),
                    "Volume": int(row["Volume"]),
                    "Above SMA20": bool(row["Close"] > row["SMA20"]),
                    "Above SMA50": bool(row["Close"] > row["SMA50"])
                })

            except Exception:
                continue

        if results:

            scan = pd.DataFrame(results)

            st.dataframe(
                scan,
                use_container_width=True,
                hide_index=True
            )

        else:

            st.info("No usable market data returned.")


# -------------------------------------------------
# BACKTESTING
# -------------------------------------------------

with tabs[5]:

    st.markdown("### Strategy laboratory")

    fast = st.slider("Fast moving average", 5, 60, 20)
    slow = st.slider("Slow moving average", 20, 200, 50)

    if fast >= slow:

        st.warning("Fast period must be smaller than slow period.")

    else:

        result = moving_average_backtest(
            data,
            fast,
            slow
        )

        a, b, c, d = st.columns(4)

        a.metric(
            "Strategy return",
            f"{result['strategy_return'] * 100:+.2f}%"
        )

        b.metric(
            "Buy and hold",
            f"{result['buy_hold_return'] * 100:+.2f}%"
        )

        c.metric(
            "Maximum drawdown",
            f"{result['max_drawdown'] * 100:.2f}%"
        )

        d.metric(
            "Sharpe ratio",
            f"{result['sharpe']:.2f}"
        )

        st.line_chart(
            result["equity"],
            use_container_width=True
        )


# -------------------------------------------------
# PORTFOLIO
# -------------------------------------------------

with tabs[6]:

    st.markdown("### Portfolio simulator")

    st.caption(
        "A hypothetical portfolio tracker. No broker connection or orders."
    )

    portfolio = st.data_editor(
        pd.DataFrame([
            {
                "Symbol": ticker,
                "Quantity": 1.0,
                "Average cost": price
            }
        ]),
        num_rows="dynamic",
        use_container_width=True
    )

    if st.button("Calculate portfolio"):

        total = 0.0

        for _, row in portfolio.iterrows():

            try:

                quote = load_prices(
                    str(row["Symbol"]).upper(),
                    "5d",
                    "1d"
                )

                current = float(quote["Close"].iloc[-1])
                quantity = float(row["Quantity"])
                cost = float(row["Average cost"])

                value = current * quantity
                pnl = (current - cost) * quantity

                total += value

                st.write(
                    f"{row['Symbol']}: {value:,.2f} "
                    f"| P/L: {pnl:+,.2f}"
                )

            except Exception:

                st.write(f"{row['Symbol']}: unavailable")

        st.metric("Portfolio value", f"{total:,.2f}")


# -------------------------------------------------
# SETTINGS
# -------------------------------------------------

with tabs[7]:

    st.markdown("### Application settings")

    st.write("Quantitative engine configuration")

    st.write("Data provider: Yahoo Finance / yfinance")

    st.write("Forecast engine: Python statistical algorithms")

    st.write("Storage: Local application")

    st.write("Broker integration: Disabled")

    st.write("LLM integration: None")

    st.write("AI APIs: None")

    st.write("Laya: Not used")

    st.divider()

    st.caption(
        "Vatistas Quant is a research and simulation tool. "
        "Market data may be delayed. No forecast guarantees profit."
    )

st.divider()
st.caption("© vatistasdimitris · StocksX Terminal · All rights reserved.")

