import { useState, useEffect, useCallback } from "react";
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

  const load = useCallback(async () => {
    const params = search ? { search } : {};
    const { data } = await listCustomers(params);
    setCustomers(data?.results ?? data ?? []);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateCustomer(editing, form);
    } else {
      await createCustomer(form);
    }
    setForm(emptyForm);
    setEditing(null);
    load();
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    load();
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const showHistory = async (c) => {
    const { data } = await getPurchaseHistory(c.id);
    setHistory(data);
    setHistoryCustomer(c);
  };

  return (
    <div>
      <h1>Customers</h1>
      <input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {isAdmin && (
        <form onSubmit={handleSave}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" required />
          <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" />
          <button type="submit">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={handleCancel}>Cancel</button>}
        </form>
      )}
      <table>
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Address</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td><td>{c.phone}</td><td>{c.address}</td>
              <td>
                {isAdmin && <button onClick={() => handleEdit(c)}>Edit</button>}
                {isAdmin && <button onClick={() => handleDelete(c.id)}>Delete</button>}
                <button onClick={() => showHistory(c)}>History</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {historyCustomer && (
        <div>
          <h2>Purchase History — {historyCustomer.name}</h2>
          <button onClick={() => { setHistory(null); setHistoryCustomer(null); }}>Close</button>
          {history?.length === 0 && <p>No purchases yet.</p>}
          {history?.map((s) => (
            <div key={s.id}>
              <strong>{s.invoice_number}</strong> — {s.date} — Total: {s.total}
              <ul>
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
