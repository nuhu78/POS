import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../components/Toast";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { listSales } from "../../api/sales";

export default function InvoiceListPage() {
  const showToast = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listSales();
        setSales(data?.results ?? data ?? []);
      } catch {
        showToast("Failed to load invoices.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns = [
    { key: "invoice_number", label: "Invoice", className: "font-medium" },
    { key: "date", label: "Date", className: "text-gray-500", render: (row) => new Date(row.date).toLocaleDateString() },
    { key: "customer_name", label: "Customer", render: (row) => row.customer_name || "Walk-in" },
    { key: "user_name", label: "Cashier" },
    { key: "total", label: "Total", className: "font-semibold" },
    { key: "actions", label: "", className: "text-right", render: (row) => (
      <Link to={String(row.id)}><Button variant="ghost" size="sm">View</Button></Link>
    )},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Invoices</h1>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} rows={sales} loading={loading} emptyMessage="No invoices yet." />
      </div>
    </div>
  );
}
