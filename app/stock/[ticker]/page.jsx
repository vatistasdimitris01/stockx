import StockDetail from "../../../components/StockDetail";

export default async function StockPage({ params }) {
  const { ticker } = await params;
  return <StockDetail ticker={ticker} />;
}
