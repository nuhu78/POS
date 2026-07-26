import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../api/categories";

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const { data } = await listCategories();
        setCategories(data?.results ?? data ?? []);
      } catch {
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      if (editing) {
        await updateCategory(editing, { name });
      } else {
        await createCategory({ name });
      }
      setName("");
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save category.");
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setName(cat.name);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await deleteCategory(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to delete category.");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setName("");
  };

  if (loading) return <div className="text-gray-500 p-8">Loading categories...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Categories</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {isAdmin && (
        <form onSubmit={handleSave} className="card flex gap-2 items-end mb-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Category name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required className="input" />
          </div>
          <button type="submit" className="btn-primary btn-sm">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" className="btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>}
        </form>
      )}
      {categories.length === 0 ? (
        <p className="text-gray-500">No categories yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="table-header"><th className="p-3 text-left">Name</th>{isAdmin && <th className="p-3 text-right">Actions</th>}</tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100">
                  <td className="p-3">{cat.name}</td>
                  {isAdmin && (
                    <td className="p-3 text-right space-x-1">
                      <button onClick={() => handleEdit(cat)} className="btn-ghost btn-sm">Edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="btn-danger btn-sm">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
