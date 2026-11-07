import "./globals.css";
import "./research.css";
import "./mobile-research.css";
import "./chart-section-anchors.css";
import "./black-minimal.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "StocksX",
  description: "Stock research terminal for watchlists, charts, and statistical forecasts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
