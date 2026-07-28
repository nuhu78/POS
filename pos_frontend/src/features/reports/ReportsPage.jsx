import { useState } from "react";
import { useToast } from "../../components/Toast";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { getDailySales, getMonthlySales, getProductSales, getBestSellers } from "../../api/reports";

export default function ReportsPage() {
  const showToast = useToast();
  const [tab, setTab] = useState("daily");
  const [days, setDays] = useState(7);
  const [months, setMonths] = useState(6);
  const [top, setTop] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
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
      showToast("Failed to load report.", "error");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: "daily", label: "Daily" },
    { key: "monthly", label: "Monthly" },
    { key: "products", label: "By Product" },
    { key: "bestsellers", label: "Best Sellers" },
  ];

  const isDateRange = tab === "products" || tab === "bestsellers";
  const isSimple = tab === "daily" || tab === "monthly";

  const columns = isSimple
    ? [
        { key: tab === "daily" ? "date" : "month", label: tab === "daily" ? "Date" : "Month" },
        { key: "total", label: "Sales" },
        { key: "transactions", label: "Transactions" },
      ]
    : [
        { key: "product_name", label: "Product" },
        { key: "product_sku", label: "SKU", className: "text-gray-500" },
        { key: "total_qty", label: "Qty Sold" },
        { key: "total_revenue", label: "Revenue" },
      ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <Button key={t.key} variant={tab === t.key ? "primary" : "ghost"} size="sm" onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-wrap items-end gap-3 mb-6">
        {tab === "daily" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Days</label><input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="365" className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
        )}
        {tab === "monthly" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Months</label><input type="number" value={months} onChange={(e) => setMonths(e.target.value)} min="1" max="60" className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
        )}
        {tab === "bestsellers" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Top</label><input type="number" value={top} onChange={(e) => setTop(e.target.value)} min="1" max="100" className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
        )}
        {isDateRange && (
          <>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          </>
        )}
        <Button size="sm" onClick={load} loading={loading}>Load</Button>
      </div>

      {!loading && data.length === 0 && <p className="text-gray-500">No data. Click "Load" to fetch results.</p>}

      {!loading && data.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table columns={columns} rows={data} />
        </div>
      )}

      {loading && <div className="text-gray-500">Loading report...</div>}
    </div>
  );
}
