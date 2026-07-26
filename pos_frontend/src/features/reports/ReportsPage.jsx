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

  const tabs = [
    { key: "daily", label: "Daily" },
    { key: "monthly", label: "Monthly" },
    { key: "products", label: "By Product" },
    { key: "bestsellers", label: "Best Sellers" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === t.key ? "bg-amber-500 text-white font-semibold" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex flex-wrap items-end gap-3 mb-6">
        {tab === "daily" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Days</label><input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="365" className="input w-20" /></div>
        )}
        {tab === "monthly" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Months</label><input type="number" value={months} onChange={(e) => setMonths(e.target.value)} min="1" max="60" className="input w-20" /></div>
        )}
        {tab === "bestsellers" && (
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Top</label><input type="number" value={top} onChange={(e) => setTop(e.target.value)} min="1" max="100" className="input w-20" /></div>
        )}
        {(tab === "products" || tab === "bestsellers") && (
          <>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" /></div>
          </>
        )}
        <div><button onClick={load} disabled={loading} className="btn-primary btn-sm">{loading ? "Loading..." : "Load"}</button></div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!loading && data.length === 0 && <p className="text-gray-500">No data. Click "Load" to fetch results.</p>}
      {loading && <div className="text-gray-500">Loading report...</div>}

      {!loading && data.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  {(tab === "daily" || tab === "monthly") && <><th className="p-3 text-left">{tab === "daily" ? "Date" : "Month"}</th><th className="p-3 text-left">Sales</th><th className="p-3 text-left">Transactions</th></>}
                  {(tab === "products" || tab === "bestsellers") && <><th className="p-3 text-left">Product</th><th className="p-3 text-left">SKU</th><th className="p-3 text-left">Qty Sold</th><th className="p-3 text-left">Revenue</th></>}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {(tab === "daily" || tab === "monthly") && <><td className="p-3">{r.date || r.month}</td><td className="p-3">{r.total}</td><td className="p-3">{r.transactions}</td></>}
                    {(tab === "products" || tab === "bestsellers") && <><td className="p-3">{r.product_name}</td><td className="p-3 text-gray-500">{r.product_sku}</td><td className="p-3">{r.total_qty}</td><td className="p-3">{r.total_revenue}</td></>}
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
