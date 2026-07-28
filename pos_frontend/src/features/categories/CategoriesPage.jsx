import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../api/categories";

export default function CategoriesPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === "admin";
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listCategories();
        setCategories(data?.results ?? data ?? []);
      } catch {
        showToast("Failed to load categories.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateCategory(editing, { name });
        showToast("Category updated.", "success");
      } else {
        await createCategory({ name });
        showToast("Category created.", "success");
      }
      setName("");
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to save category.", "error");
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setName(cat.name);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      showToast("Category deleted.", "success");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to delete category.", "error");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setName("");
  };

  const columns = [
    { key: "name", label: "Name" },
    ...(isAdmin ? [{ key: "actions", label: "Actions", className: "text-right", render: (row) => (
      <div className="space-x-1">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}] : []),
  ];

  if (loading) return <div className="text-gray-500 p-8">Loading categories...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Categories</h1>
      {isAdmin && (
        <form onSubmit={handleSave} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex gap-2 items-end mb-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Category name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" />
          </div>
          <Button type="submit" size="sm">{editing ? "Update" : "Add"}</Button>
          {editing && <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>}
        </form>
      )}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} rows={categories} emptyMessage="No categories yet." />
      </div>
    </div>
  );
}
