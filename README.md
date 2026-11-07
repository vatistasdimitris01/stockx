# Quant Terminal

A local Python quantitative stock research dashboard. It contains no LLMs, generative AI, AI APIs, Laya, or AI inference models. Forecasting uses statistical methods and Monte Carlo simulation.

## Run (local)

```bash
python -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows
pip install -r requirements.txt
streamlit run app.py
```

Open the local URL printed by Streamlit, usually http://localhost:8501.

## Deploy to Vercel (serverless / static)

This project ships a static, browser-based build powered by [stlite](https://github.com/whitphx/stlite),
so it can be deployed to Vercel without a Python server.

```bash
npm i -g vercel
vercel
```

Vercel will serve `index.html` + `app.py` as static assets and run the Streamlit app in the browser.
Note: market data calls (Yahoo Finance) happen from the browser; if a request is blocked by CORS,
route it through a Vercel serverless function in `api/`.

## Notes

- Yahoo Finance data is not guaranteed real-time and may be delayed or unavailable.
- ARIMA is a statistical time-series method, not an LLM or generative AI model.
- The lightweight rolling validation uses one-step historical errors for trend and EMA methods. It is not proof of future performance.
- The signal thresholds are transparent heuristics, not optimized trading instructions.
- Backtests omit brokerage fees, taxes, spread, slippage, survivorship bias, and corporate-action edge cases.
- No trades are placed. Use paper trading before risking capital.
