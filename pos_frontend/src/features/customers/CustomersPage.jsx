import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, getPurchaseHistory } from "../../api/customers";

const emptyForm = { name: "", phone: "", address: "" };

export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const params = search ? { search } : {};
        const { data } = await listCustomers(params);
        setCustomers(data?.results ?? data ?? []);
      } catch {
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await updateCustomer(editing, form);
      } else {
        await createCustomer(form);
      }
      setForm(emptyForm);
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save customer.");
    }
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    setError("");
    try {
      await deleteCustomer(id);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to delete customer.");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const showHistory = async (c) => {
    setError("");
    try {
      const { data } = await getPurchaseHistory(c.id);
      setHistory(data);
      setHistoryCustomer(c);
    } catch {
      setError("Failed to load purchase history.");
    }
  };

  if (loading) return <div className="text-gray-500 p-8">Loading customers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-xs mb-6" />

      {isAdmin && (
        <form onSubmit={handleSave} className="card grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input name="name" value={form.name} onChange={handleChange} required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input name="phone" value={form.phone} onChange={handleChange} required className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Address</label><textarea name="address" value={form.address} onChange={handleChange} className="input" rows={1} /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm">{editing ? "Update" : "Add"}</button>
            {editing && <button type="button" className="btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>}
          </div>
        </form>
      )}

      {customers.length === 0 ? (
        <p className="text-gray-500">No customers found.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-header"><th className="p-3 text-left">Name</th><th className="p-3 text-left">Phone</th><th className="p-3 text-left">Address</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="p-3">{c.name}</td><td className="p-3">{c.phone}</td><td className="p-3 text-gray-500">{c.address}</td>
                    <td className="p-3 text-right space-x-1">
                      {isAdmin && <button onClick={() => handleEdit(c)} className="btn-ghost btn-sm">Edit</button>}
                      {isAdmin && <button onClick={() => handleDelete(c.id)} className="btn-danger btn-sm">Delete</button>}
                      <button onClick={() => showHistory(c)} className="btn-ghost btn-sm">History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {historyCustomer && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Purchase History — {historyCustomer.name}</h2>
            <button onClick={() => { setHistory(null); setHistoryCustomer(null); }} className="btn-ghost btn-sm">Close</button>
          </div>
          {history?.length === 0 && <p className="text-gray-500">No purchases yet.</p>}
          {history?.map((s) => (
            <div key={s.id} className="border-b border-gray-100 pb-3 mb-3">
              <p className="text-sm font-medium">{s.invoice_number} — {new Date(s.date).toLocaleDateString()} — Total: {s.total}</p>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5 ml-4 list-disc">
                {s.items.map((item, i) => (
                  <li key={i}>{item.product__name} x{item.quantity} @ {item.price}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
