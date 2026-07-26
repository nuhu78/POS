import { useState, useEffect } from "react";
import { getDashboard } from "../../api/reports";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: d } = await getDashboard();
      setData(d);
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
    </div>
  );
}
