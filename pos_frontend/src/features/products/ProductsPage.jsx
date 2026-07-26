import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../../api/products";
import { listCategories } from "../../api/categories";

const emptyForm = { name: "", sku: "", category: "", purchase_price: "", selling_price: "", stock: "", low_stock_threshold: 5, status: "active" };

export default function ProductsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const params = search ? { search } : {};
    const [pRes, cRes] = await Promise.all([listProducts(params), listCategories()]);
    setProducts(pRes.data?.results ?? pRes.data ?? []);
    setCategories(cRes.data?.results ?? cRes.data ?? []);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateProduct(editing, form);
    } else {
      await createProduct(form);
    }
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p, category: p.category });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    load();
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <h1>Products</h1>
      <input placeholder="Search name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {isAdmin && (
        <form onSubmit={handleSave}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
          <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" required />
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="purchase_price" value={form.purchase_price} onChange={handleChange} placeholder="Purchase price" type="number" step="0.01" required />
          <input name="selling_price" value={form.selling_price} onChange={handleChange} placeholder="Selling price" type="number" step="0.01" required />
          <input name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" type="number" required />
          <input name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} placeholder="Low stock threshold" type="number" />
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={handleCancel}>Cancel</button>}
        </form>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.sku}</td><td>{p.category_name}</td>
              <td>{p.selling_price}</td><td>{p.stock}</td><td>{p.status}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEdit(p)}>Edit</button>
                  <button onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
