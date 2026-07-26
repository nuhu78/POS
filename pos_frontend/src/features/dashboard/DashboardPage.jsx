import { useState, useEffect } from "react";
import { getDashboard } from "../../api/reports";
import { getLowStock } from "../../api/products";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    (async () => {
      const [dRes, lsRes] = await Promise.all([getDashboard(), getLowStock()]);
      setData(dRes.data);
      setLowStock(lsRes.data ?? []);
    })();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid #ccc", padding: "1rem", textAlign: "center" }}>
          <h3>Today's Sales</h3>
          <p style={{ fontSize: "1.5rem" }}>{data.today_sales} BDT</p>
          <small>{data.today_transactions} transactions</small>
        </div>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid #ccc", padding: "1rem", textAlign: "center" }}>
          <h3>Active Products</h3>
          <p style={{ fontSize: "1.5rem" }}>{data.active_products}</p>
        </div>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid #ccc", padding: "1rem", textAlign: "center" }}>
          <h3>Customers</h3>
          <p style={{ fontSize: "1.5rem" }}>{data.total_customers}</p>
        </div>
        <div style={{ flex: 1, minWidth: "150px", border: "1px solid #ccc", padding: "1rem", textAlign: "center" }}>
          <h3>Low Stock</h3>
          <p style={{ fontSize: "1.5rem", color: data.low_stock_products > 0 ? "red" : "inherit" }}>{data.low_stock_products}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h2 style={{ color: "red" }}>Low Stock Alerts</h2>
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Threshold</th></tr></thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.sku}</td><td style={{ color: "red" }}>{p.stock}</td><td>{p.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
