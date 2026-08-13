import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "../../components/Toast";
import { getDailySales, getMonthlySales, getProductSales, getBestSellers } from "../../api/reports";

const money = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} BDT`;
const num = (n) => Number(n || 0).toLocaleString("en-US");

const PAGE_SIZE = 20;

const inputClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

const TABS = [
  { key: "daily", label: "Daily", description: "Revenue per day" },
  { key: "monthly", label: "Monthly", description: "Revenue per month" },
  { key: "products", label: "By Product", description: "Revenue and units per product" },
  { key: "bestsellers", label: "Best Sellers", description: "Top products by units sold" },
];

function KpiCard({ label, value, sub, tone = "navy" }) {
  const valueClass = tone === "orange" ? "text-brand-600" : "text-navy-900";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold leading-9 ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-gray-500" title={sub}>{sub}</p>}
    </div>
  );
}

function BarChart({ rows, labelKey, valueKey, formatLabel, formatValue }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 0);
  return (
    <div>
      <div className="flex h-44 items-end gap-2">
        {rows.map((row, i) => {
          const ratio = max > 0 ? Number(row[valueKey] || 0) / max : 0;
          const height = Math.max(4, Math.round(ratio * 168));
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all group-hover:from-brand-700 group-hover:to-brand-500"
                style={{ height: `${height}px` }}
                title={formatValue(row[valueKey])}
              />
              <span className="max-w-full truncate text-[10px] font-medium text-gray-400">{formatLabel(row[labelKey])}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const top = rank < 3;
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
        top ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {rank}
    </span>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

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
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReport = async (reportTab, targetPage) => {
    setLoading(true);
    try {
      let res;
      switch (reportTab) {
        case "daily":
          res = await getDailySales({ days });
          break;
        case "monthly":
          res = await getMonthlySales({ months });
          break;
        case "products":
          res = await getProductSales({
            start: startDate || undefined,
            end: endDate || undefined,
            page: targetPage,
            page_size: PAGE_SIZE,
          });
          break;
        case "bestsellers":
          res = await getBestSellers({
            top,
            start: startDate || undefined,
            end: endDate || undefined,
            page: targetPage,
            page_size: PAGE_SIZE,
          });
          break;
      }
      const payload = Array.isArray(res.data)
        ? { results: res.data, count: res.data.length }
        : res.data ?? { results: [], count: 0 };
      setData(payload.results ?? []);
      setTotal(payload.count ?? 0);
      setPage(targetPage);
    } catch {
      showToast("Failed to load report.", "error");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const load = () => fetchReport(tab, 1);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    loadRef.current();
  }, []);

  const activeTab = TABS.find((t) => t.key === tab);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSimple = tab === "daily" || tab === "monthly";
  const isDateRange = tab === "products" || tab === "bestsellers";

  const kpis = useMemo(() => {
    if (!loaded || data.length === 0) return null;
    if (isSimple) {
      const revenue = data.reduce((s, r) => s + Number(r.total || 0), 0);
      const transactions = data.reduce((s, r) => s + Number(r.transactions || 0), 0);
      const best = data.reduce((a, b) => (Number(b.total || 0) > Number(a.total || 0) ? b : a), data[0]);
      const bestLabel = tab === "daily"
        ? new Date(`${best.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date(`${best.month}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return [
        { label: "Total Revenue", value: money(revenue), sub: "across the selected period" },
        { label: "Transactions", value: num(transactions), sub: "completed orders" },
        { label: "Avg Sale Value", value: money(transactions ? revenue / transactions : 0), sub: "revenue per order" },
        { label: "Peak Day", value: money(best.total), sub: bestLabel, tone: "orange" },
      ];
    }
    const revenue = data.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
    const units = data.reduce((s, r) => s + Number(r.total_qty || 0), 0);
    const topProduct = data[0];
    return [
      { label: "Total Revenue", value: money(revenue), sub: "across selected products" },
      { label: "Units Sold", value: num(units), sub: "total quantity" },
      { label: "Avg Unit Price", value: money(units ? revenue / units : 0), sub: "revenue per unit" },
      { label: "Top Product", value: topProduct.product_name || "—", sub: `${money(topProduct.total_revenue)} · ${num(topProduct.total_qty)} units`, tone: "orange" },
    ];
  }, [data, loaded, isSimple, tab]);

  const chartConfig = isSimple && loaded && data.length > 0
    ? {
        rows: data,
        labelKey: tab === "daily" ? "date" : "month",
        valueKey: "total",
        formatLabel: (v) =>
          tab === "daily"
            ? new Date(`${v}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : new Date(`${v}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        formatValue: money,
      }
    : null;

  const columns = isSimple
    ? [
        {
          key: tab === "daily" ? "date" : "month",
          label: tab === "daily" ? "Date" : "Month",
          align: "left",
          render: (r) => (
            <span className="font-medium text-navy-800">
              {tab === "daily"
                ? new Date(`${r.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                : new Date(`${r.month}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          ),
        },
        {
          key: "total",
          label: "Sales",
          align: "right",
          render: (r) => <span className="font-semibold text-navy-900">{money(r.total)}</span>,
        },
        {
          key: "transactions",
          label: "Transactions",
          align: "right",
          render: (r) => <span className="text-gray-600">{num(r.transactions)}</span>,
        },
      ]
    : [
        { key: "rank", label: "#", align: "center", render: (_r, i) => <RankBadge rank={i + 1} /> },
        {
          key: "product_name",
          label: "Product",
          align: "left",
          render: (r) => <span className="font-medium text-navy-800">{r.product_name}</span>,
        },
        {
          key: "product_sku",
          label: "SKU",
          align: "left",
          render: (r) => <span className="font-mono text-xs text-gray-500">{r.product_sku || "—"}</span>,
        },
        {
          key: "total_qty",
          label: "Qty Sold",
          align: "right",
          render: (r) => <span className="text-gray-600">{num(r.total_qty)}</span>,
        },
        {
          key: "total_revenue",
          label: "Revenue",
          align: "right",
          render: (r) => <span className="font-semibold text-navy-900">{money(r.total_revenue)}</span>,
        },
      ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Sales performance analytics for your shop</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? "Loading…" : "Refresh report"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis
          ? kpis.map((k) => <KpiCard key={k.label} {...k} />)
          : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Report Configuration</h2>
            <p className="mt-0.5 text-xs text-gray-500">{activeTab.description}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  fetchReport(t.key, 1);
                }}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white hover:text-navy-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          {tab === "daily" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Days</span>
              <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min="1" max="365" className={`w-24 ${inputClass}`} />
            </label>
          )}
          {tab === "monthly" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Months</span>
              <input type="number" value={months} onChange={(e) => setMonths(e.target.value)} min="1" max="60" className={`w-24 ${inputClass}`} />
            </label>
          )}
          {tab === "bestsellers" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Top</span>
              <input type="number" value={top} onChange={(e) => setTop(e.target.value)} min="1" max="100" className={`w-24 ${inputClass}`} />
            </label>
          )}
          {isDateRange && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">From</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">To</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </label>
            </>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      </div>

      {chartConfig && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-navy-900">{tab === "daily" ? "Daily Trend" : "Monthly Trend"}</h2>
              <p className="mt-0.5 text-xs text-gray-500">Revenue across the selected period</p>
            </div>
          </div>
          <div className="mt-6">
            <BarChart {...chartConfig} />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        {loading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-9 w-1/3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">📈</div>
            <p className="mt-4 text-sm font-medium text-navy-900">No data found</p>
            <p className="mt-1 text-xs text-gray-500">Adjust the filters above and refresh to see results.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                          col.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.id ?? i} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`whitespace-nowrap px-4 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}
                        >
                          {col.render ? col.render(row, i) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isSimple && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-navy-800">{data.length}</span> of{" "}
                  <span className="font-semibold text-navy-800">{num(total)}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchReport(tab, page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-medium text-navy-800">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchReport(tab, page + 1)}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
