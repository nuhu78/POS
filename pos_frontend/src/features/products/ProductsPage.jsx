import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import Modal from "../../components/Modal";
import { listProducts, createProduct, updateProduct, deleteProduct, exportProducts, importProducts } from "../../api/products";
import { listCategories } from "../../api/categories";

const emptyForm = { name: "", sku: "", category: "", purchase_price: "", selling_price: "", stock: "", low_stock_threshold: 5, status: "active" };

const PAGE_SIZE = 20;

const money = (n) => `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} BDT`;
const num = (n) => Number(n || 0).toLocaleString("en-US");

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy-900 outline-none transition-shadow placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500";

const buttonGhost =
  "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

const STOCK_CHIPS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
];

function KpiCard({ label, value, sub, tone = "navy" }) {
  const valueClass =
    tone === "orange" ? "text-brand-600" : tone === "red" ? "text-red-600" : "text-navy-900";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold leading-9 ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-gray-500" title={sub}>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status === "active";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function LowStockBadge() {
  return (
    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
      Low
    </span>
  );
}

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === "admin";
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockStatus, setStockStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    setPage(1);
  }, [search, category, priceMin, priceMax, stockStatus, refreshKey]);

  useEffect(() => {
    (async () => {
      try {
        const params = { page };
        if (search) params.search = search;
        if (category) params.category = category;
        if (priceMin) params.price_min = priceMin;
        if (priceMax) params.price_max = priceMax;
        if (stockStatus !== "all") params.stock_status = stockStatus;
        const [pRes, cRes] = await Promise.all([listProducts(params), listCategories()]);
        const payload = pRes.data;
        const rows = Array.isArray(payload) ? payload : (payload?.results ?? []);
        setProducts(rows);
        setTotal(Array.isArray(payload) ? payload.length : (payload?.count ?? rows.length));
        setCategories(cRes.data?.results ?? cRes.data ?? []);
      } catch {
        showToastRef.current("Failed to load products.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [search, category, priceMin, priceMax, stockStatus, page, refreshKey]);

  const stats = {
    total,
    active: products.filter((p) => p.status === "active").length,
    lowStock: products.filter((p) => p.status === "active" && Number(p.stock) <= Number(p.low_stock_threshold ?? 0)).length,
    categories: categories.length,
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(search || category || priceMin || priceMax || stockStatus !== "all");

  const isLowStock = (p) => p.status === "active" && Number(p.stock) <= Number(p.low_stock_threshold ?? 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddClick = () => {
    setFormOpen(true);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateProduct(editing, form);
        showToast("Product updated.", "success");
      } else {
        await createProduct(form);
        showToast("Product created.", "success");
      }
      setForm(emptyForm);
      setEditing(null);
      setFormOpen(false);
      setSearch("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to save product.", "error");
    }
  };

  const handleEdit = (p) => {
    setFormOpen(true);
    setEditing(p.id);
    setForm({ ...p, category: p.category });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      showToast("Product deleted.", "success");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to delete product.", "error");
    }
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setPriceMin("");
    setPriceMax("");
    setStockStatus("all");
  };

  const handleExport = async () => {
    try {
      const res = await exportProducts();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Products exported.", "success");
    } catch {
      showToast("Failed to export products.", "error");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await importProducts(file);
      setSummary(res.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to import products.";
      showToast(msg, "error");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const closeSummary = () => {
    setSummary(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your inventory catalog and pricing</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <span className="text-base leading-none">＋</span>
            Add Product
          </button>
        )}
      </div>

      {isAdmin && formOpen && (
        <form onSubmit={handleSave} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-navy-900">{editing ? "Edit Product" : "Add Product"}</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {editing ? "Update the fields below to save your changes" : "Fill in the details to create a new product"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editing && (
                <button type="button" onClick={handleCancel} className={buttonGhost}>
                  Cancel editing
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                title="Hide add form"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50 hover:text-navy-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SKU</label>
              <input name="sku" value={form.sku} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} required className={inputClass}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Purchase price</label>
              <input name="purchase_price" value={form.purchase_price} onChange={handleChange} type="number" step="0.01" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Selling price</label>
              <input name="selling_price" value={form.selling_price} onChange={handleChange} type="number" step="0.01" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input name="stock" value={form.stock} onChange={handleChange} type="number" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Low stock threshold</label>
              <input name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} type="number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
                {["active", "inactive"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`rounded-md px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                      form.status === s ? "bg-brand-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-navy-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                {editing ? "Update Product" : "Add Product"}
              </button>
              <button type="button" onClick={handleCancel} className={buttonGhost}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          : (
            <>
              <KpiCard label="Total Products" value={num(stats.total)} sub="in your catalog" />
              <KpiCard label="Active" value={num(stats.active)} sub="on this page" />
              <KpiCard label="Low Stock" value={num(stats.lowStock)} sub="on this page" tone={stats.lowStock > 0 ? "red" : "navy"} />
              <KpiCard label="Categories" value={num(stats.categories)} sub="product groups" />
            </>
          )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Inventory</h2>
            <p className="mt-0.5 text-xs text-gray-500">Search, filter, export, and import your product catalog</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div className="relative w-full max-w-xs">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className={`pl-9 ${inputClass}`} />
          </div>

          <label className="block">
            <span className={labelClass}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-44 ${inputClass}`}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Min price</span>
            <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} min="0" placeholder="Any" className={`w-28 ${inputClass}`} />
          </label>

          <label className="block">
            <span className={labelClass}>Max price</span>
            <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} min="0" placeholder="Any" className={`w-28 ${inputClass}`} />
          </label>

          <div>
            <span className={labelClass}>Stock</span>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
              {STOCK_CHIPS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStockStatus(s.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    stockStatus === s.key ? "bg-brand-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:text-navy-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className={buttonGhost}>
              Clear filters
            </button>
          )}

          {isAdmin && (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={handleExport} className={buttonGhost}>
                Export Excel
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? "Importing…" : "Import Excel"}
              </button>
              <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
        {loading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-9 w-1/3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">📦</div>
            <p className="mt-4 text-sm font-medium text-navy-900">No products found</p>
            <p className="mt-1 text-xs text-gray-500">
              {hasFilters ? "No products match your filters." : "Add your first product to get started."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-navy-800">{p.name}</p>
                        <p className="font-mono text-xs text-gray-500">{p.sku}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{p.category_name || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy-900">{money(p.selling_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={isLowStock(p) ? "font-semibold text-red-600" : "text-gray-600"}>{num(p.stock)}</span>
                          {isLowStock(p) && <LowStockBadge />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-navy-800">{products.length}</span> of{" "}
                  <span className="font-semibold text-navy-800">{num(total)}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-medium text-navy-800">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
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

      <Modal open={!!summary} onClose={closeSummary} title="Import Summary">
        {summary && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-navy-50 p-3 text-center">
                <p className="text-2xl font-bold text-navy-700">{summary.processed}</p>
                <p className="text-xs text-navy-500">Processed</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{summary.added}</p>
                <p className="text-xs text-emerald-600">Added</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{summary.updated}</p>
                <p className="text-xs text-amber-600">Updated</p>
              </div>
            </div>
            {summary.skipped?.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <p className="mb-2 font-semibold text-red-600">Skipped Rows ({summary.skipped.length})</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {summary.skipped.map((s, i) => (
                    <p key={i} className="text-xs text-gray-600">Row {s.row}: {s.reason}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={closeSummary}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}