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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await listCategories();
      setCategories(data?.results ?? data ?? []);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      load();
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
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to delete category.");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setName("");
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div>
      <h1>Categories</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isAdmin && (
        <form onSubmit={handleSave}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required />
          <button type="submit">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={handleCancel}>Cancel</button>}
        </form>
      )}
      {categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <ul>
          {categories.map((cat) => (
            <li key={cat.id}>
              {cat.name}
              {isAdmin && (
                <>
                  <button onClick={() => handleEdit(cat)}>Edit</button>
                  <button onClick={() => handleDelete(cat.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
