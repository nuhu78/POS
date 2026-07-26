import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listSales } from "../../api/sales";

export default function InvoiceListPage() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await listSales();
      setSales(data?.results ?? data ?? []);
    })();
  }, []);

  return (
    <div>
      <h1>Invoices</h1>
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
              <td><Link to={`/cashier/invoices/${s.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
