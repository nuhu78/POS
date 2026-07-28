import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import Button from "../../components/Button";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, getPurchaseHistory } from "../../api/customers";

const emptyForm = { name: "", phone: "", address: "" };

export default function CustomersPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const isAdmin = user?.role === "admin";
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const params = search ? { search } : {};
        const { data } = await listCustomers(params);
        setCustomers(data?.results ?? data ?? []);
      } catch {
        showToast("Failed to load customers.", "error");
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
        await updateCustomer(editing, form);
        showToast("Customer updated.", "success");
      } else {
        await createCustomer(form);
        showToast("Customer created.", "success");
      }
      setForm(emptyForm);
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to save customer.", "error");
    }
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      showToast("Customer deleted.", "success");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to delete customer.", "error");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const showHistory = async (c) => {
    try {
      const { data } = await getPurchaseHistory(c.id);
      setHistory(data);
      setHistoryCustomer(c);
      setHistoryOpen(true);
    } catch {
      showToast("Failed to load purchase history.", "error");
    }
  };

  const actions = [];
  if (isAdmin) {
    actions.push({ key: "actions", label: "Actions", className: "text-right", render: (row) => (
      <div className="space-x-1">
        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>Delete</Button>
        <Button variant="ghost" size="sm" onClick={() => showHistory(row)}>History</Button>
      </div>
    )});
  } else {
    actions.push({ key: "actions", label: "Actions", className: "text-right", render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => showHistory(row)}>History</Button>
    )});
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address", className: "text-gray-500", render: (row) => row.address || "" },
    ...actions,
  ];

  if (loading) return <div className="text-gray-500 p-8">Loading customers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>

      <input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)] mb-6" />

      {isAdmin && (
        <form onSubmit={handleSave} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Address</label><textarea name="address" value={form.address} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={1} /></div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">{editing ? "Update" : "Add"}</Button>
            {editing && <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>}
          </div>
        </form>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table columns={columns} rows={customers} emptyMessage="No customers found." />
      </div>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={historyCustomer ? `Purchase History - ${historyCustomer.name}` : ""}>
        {history?.length === 0 && <p className="text-gray-500">No purchases yet.</p>}
        {history?.map((s) => (
          <div key={s.id} className="border-b border-gray-100 pb-3 mb-3">
            <p className="text-sm font-medium">{s.invoice_number} &mdash; {new Date(s.date).toLocaleDateString()} &mdash; Total: {s.total}</p>
            <ul className="text-xs text-gray-500 mt-1 space-y-0.5 ml-4 list-disc">
              {s.items.map((item, i) => (
                <li key={i}>{item.product__name} x{item.quantity} @ {item.price}</li>
              ))}
            </ul>
          </div>
        ))}
      </Modal>
    </div>
  );
}
