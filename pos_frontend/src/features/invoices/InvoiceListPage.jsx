import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listSales } from "../../api/sales";

export default function InvoiceListPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await listSales();
        setSales(data?.results ?? data ?? []);
      } catch {
        setError("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div>
      <h1>Invoices</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {sales.length === 0 ? (
        <p>No invoices yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Invoice</th><th>Date</th><th>Customer</th><th>Cashier</th><th>Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.invoice_number}</td>
                <td>{new Date(s.date).toLocaleDateString()}</td>
                <td>{s.customer_name || "Walk-in"}</td>
                <td>{s.user_name}</td>
                <td>{s.total}</td>
                <td><Link to={s.id ? `/cashier/invoices/${s.id}` : "#"}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
