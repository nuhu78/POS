import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../../api/products";
import { listCategories } from "../../api/categories";

const emptyForm = { name: "", sku: "", category: "", purchase_price: "", selling_price: "", stock: "", low_stock_threshold: 5, status: "active" };

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const params = search ? { search } : {};
        const [pRes, cRes] = await Promise.all([listProducts(params), listCategories()]);
        setProducts(pRes.data?.results ?? pRes.data ?? []);
        setCategories(cRes.data?.results ?? cRes.data ?? []);
      } catch {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, [search, refreshKey]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateProduct(editing, form);
      } else {
        await createProduct(form);
      }
      setForm(emptyForm);
      setEditing(null);
      setSearch("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save product.");
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p, category: p.category });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    setError("");
    try {
      await deleteProduct(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to delete product.");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  if (loading) return <div className="text-gray-500 p-8">Loading products...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Products</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <input placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs mb-6" />

      {isAdmin && (
        <form onSubmit={handleSave} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input name="name" value={form.name} onChange={handleChange} required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">SKU</label><input name="sku" value={form.sku} onChange={handleChange} required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Category</label><select name="category" value={form.category} onChange={handleChange} required className="input">
            <option value="">Select</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Purchase price</label><input name="purchase_price" value={form.purchase_price} onChange={handleChange} type="number" step="0.01" required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Selling price</label><input name="selling_price" value={form.selling_price} onChange={handleChange} type="number" step="0.01" required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Stock</label><input name="stock" value={form.stock} onChange={handleChange} type="number" required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Low stock threshold</label><input name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} type="number" className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Status</label><select name="status" value={form.status} onChange={handleChange} className="input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select></div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
            <button type="submit" className="btn-primary">{editing ? "Update" : "Add"} Product</button>
            {editing && <button type="button" className="btn-ghost" onClick={handleCancel}>Cancel</button>}
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-3 text-left">Name</th><th className="p-3 text-left">SKU</th><th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Status</th>
                  {isAdmin && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="p-3">{p.name}</td><td className="p-3 text-gray-500">{p.sku}</td>
                    <td className="p-3">{p.category_name}</td><td className="p-3">{p.selling_price}</td>
                    <td className="p-3">{p.stock}</td><td className="p-3">{p.status}</td>
                    {isAdmin && (
                      <td className="p-3 text-right space-x-1">
                        <button onClick={() => handleEdit(p)} className="btn-ghost btn-sm">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="btn-danger btn-sm">Delete</button>
                      </td>
                    )}
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
