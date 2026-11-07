import "./globals.css";

export const metadata = {
  title: "StocksX",
  description: "Quantitative market terminal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
