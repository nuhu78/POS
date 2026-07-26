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

  if (loading) return <div className="text-gray-500 p-8">Loading invoices...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Invoices</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {sales.length === 0 ? (
        <p className="text-gray-500">No invoices yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Customer</th><th className="p-3 text-left">Cashier</th>
                  <th className="p-3 text-left">Total</th><th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{s.invoice_number}</td>
                    <td className="p-3 text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="p-3">{s.customer_name || "Walk-in"}</td>
                    <td className="p-3">{s.user_name}</td>
                    <td className="p-3 font-semibold">{s.total}</td>
                    <td className="p-3 text-right">
                      <Link to={s.id ? `${s.id}` : "#"} className="btn-ghost btn-sm inline-flex">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
