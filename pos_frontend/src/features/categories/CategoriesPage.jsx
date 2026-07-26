import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../api/categories";

export default function CategoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");

  const load = async () => {
    const { data } = await listCategories();
    setCategories(data?.results ?? data ?? []);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      await updateCategory(editing, { name });
    } else {
      await createCategory({ name });
    }
    setName("");
    setEditing(null);
    load();
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setName(cat.name);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategory(id);
    load();
  };

  const handleCancel = () => {
    setEditing(null);
    setName("");
  };

  return (
    <div>
      <h1>Categories</h1>
      {isAdmin && (
        <form onSubmit={handleSave}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required />
          <button type="submit">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={handleCancel}>Cancel</button>}
        </form>
      )}
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
    </div>
  );
}
