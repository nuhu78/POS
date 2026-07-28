import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../../api/products";
import { listCategories } from "../../api/categories";

const emptyForm = { name: "", sku: "", category: "", purchase_price: "", selling_price: "", stock: "", low_stock_threshold: 5, status: "active" };

export default function ProductsPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === "admin";
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const params = search ? { search } : {};
        const [pRes, cRes] = await Promise.all([listProducts(params), listCategories()]);
        setProducts(pRes.data?.results ?? pRes.data ?? []);
        setCategories(cRes.data?.results ?? cRes.data ?? []);
      } catch {
        showToast("Failed to load products.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [search, refreshKey]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      setSearch("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to save product.", "error");
    }
  };

  const handleEdit = (p) => {
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
    setEditing(null);
    setForm(emptyForm);
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "sku", label: "SKU", className: "text-gray-500" },
    { key: "category_name", label: "Category" },
    { key: "selling_price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "status", label: "Status" },
    ...(isAdmin ? [{ key: "actions", label: "Actions", className: "text-right", render: (row) => (
      <div className="space-x-1">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}] : []),
  ];

  if (loading) return <div className="text-gray-500 p-8">Loading products...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Products</h1>

      <input placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)] mb-6" />

      {isAdmin && (
        <form onSubmit={handleSave} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">SKU</label><input name="sku" value={form.sku} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Category</label><select name="category" value={form.category} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Purchase price</label><input name="purchase_price" value={form.purchase_price} onChange={handleChange} type="number" step="0.01" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Selling price</label><input name="selling_price" value={form.selling_price} onChange={handleChange} type="number" step="0.01" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Stock</label><input name="stock" value={form.stock} onChange={handleChange} type="number" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Low stock threshold</label><input name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Status</label><select name="status" value={form.status} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select></div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
            <Button type="submit">{editing ? "Update" : "Add"} Product</Button>
            {editing && <Button variant="ghost" onClick={handleCancel}>Cancel</Button>}
          </div>
        </form>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} rows={products} emptyMessage="No products found." />
      </div>
    </div>
  );
}
