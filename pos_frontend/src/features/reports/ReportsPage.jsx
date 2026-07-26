import { useState } from "react";
import { getDailySales, getMonthlySales, getProductSales, getBestSellers } from "../../api/reports";

export default function ReportsPage() {
  const [tab, setTab] = useState("daily");
  const [days, setDays] = useState(7);
  const [months, setMonths] = useState(6);
  const [top, setTop] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      switch (tab) {
        case "daily":
          res = await getDailySales({ days });
          break;
        case "monthly":
          res = await getMonthlySales({ months });
          break;
        case "products":
          res = await getProductSales({ start: startDate || undefined, end: endDate || undefined });
          break;
        case "bestsellers":
          res = await getBestSellers({ top, start: startDate || undefined, end: endDate || undefined });
          break;
      }
      setData(res.data ?? []);
    } catch {
      setError("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reports</h1>
      <div>
        <button onClick={() => setTab("daily")} style={{ fontWeight: tab === "daily" ? "bold" : "normal" }}>Daily</button>
        <button onClick={() => setTab("monthly")} style={{ fontWeight: tab === "monthly" ? "bold" : "normal" }}>Monthly</button>
        <button onClick={() => setTab("products")} style={{ fontWeight: tab === "products" ? "bold" : "normal" }}>By Product</button>
        <button onClick={() => setTab("bestsellers")} style={{ fontWeight: tab === "bestsellers" ? "bold" : "normal" }}>Best Sellers</button>
      </div>

      <div style={{ margin: "1rem 0" }}>
        {tab === "daily" && <label>Days: <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="365" style={{ width: "60px" }} /></label>}
        {tab === "monthly" && <label>Months: <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} min="1" max="60" style={{ width: "60px" }} /></label>}
        {tab === "bestsellers" && <label>Top: <input type="number" value={top} onChange={(e) => setTop(e.target.value)} min="1" max="100" style={{ width: "60px" }} /></label>}
        {(tab === "products" || tab === "bestsellers") && (
          <>
            <label>From: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label>To: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          </>
        )}
        <button onClick={load} disabled={loading}>{loading ? "Loading..." : "Load"}</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && data.length === 0 && <p>No data. Click "Load" to fetch results.</p>}

      {loading && <div>Loading report...</div>}

      {!loading && tab === "daily" && data.length > 0 && (
        <table>
          <thead><tr><th>Date</th><th>Sales</th><th>Transactions</th></tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}><td>{r.date}</td><td>{r.total}</td><td>{r.transactions}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && tab === "monthly" && data.length > 0 && (
        <table>
          <thead><tr><th>Month</th><th>Sales</th><th>Transactions</th></tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}><td>{r.month}</td><td>{r.total}</td><td>{r.transactions}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && (tab === "products" || tab === "bestsellers") && data.length > 0 && (
        <table>
          <thead><tr><th>Product</th><th>SKU</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}><td>{r.product_name}</td><td>{r.product_sku}</td><td>{r.total_qty}</td><td>{r.total_revenue}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
