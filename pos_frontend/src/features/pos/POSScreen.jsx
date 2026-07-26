import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { listProducts } from "../../api/products";
import { listCustomers } from "../../api/customers";
import { createSale } from "../../api/sales";

export default function POSScreen() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0.00");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    const params = search ? { search } : { status: "active" };
    const { data } = await listProducts(params);
    setProducts(data?.results ?? data ?? []);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    const { data } = await listCustomers();
    setCustomers(data?.results ?? data ?? []);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product: product.id, name: product.name, price: product.selling_price, quantity: 1 }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.product === productId ? { ...i, quantity: qty } : i)));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal - parseFloat(discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setError("");
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({ product: i.product, quantity: i.quantity })),
        discount: discount || "0.00",
        payment: { method: paymentMethod, amount: String(total) },
      };
      if (customerId) payload.customer = parseInt(customerId);
      const { data } = await createSale(payload);
      setSuccess(data);
      setCart([]);
      setDiscount("0.00");
      setPaid("");
      setCustomerId("");
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || "Sale failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <h2>Sale Complete</h2>
        <p>Invoice: {success.invoice_number}</p>
        <p>Total: {success.total}</p>
        <button onClick={() => navigate(`/cashier/invoices/${success.id}`)}>View Invoice</button>
        <button onClick={() => setSuccess(null)}>New Sale</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div style={{ flex: 1 }}>
        <h2>Products</h2>
        <input placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ccc", padding: "0.5rem", margin: "0.25rem 0", cursor: "pointer" }} onClick={() => addToCart(p)}>
              <strong>{p.name}</strong> — {p.selling_price} BDT<br />
              <small>SKU: {p.sku} | Stock: {p.stock}</small>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h2>Cart</h2>
        {cart.length === 0 && <p>Cart is empty.</p>}
        {cart.map((item) => (
          <div key={item.product} style={{ border: "1px solid #ccc", padding: "0.5rem", margin: "0.25rem 0" }}>
            <strong>{item.name}</strong>
            <div>
              Qty: <input type="number" value={item.quantity} min="1" onChange={(e) => updateQty(item.product, parseInt(e.target.value) || 0)} style={{ width: "60px" }} />
              @ {item.price} BDT
              <button onClick={() => removeFromCart(item.product)} style={{ marginLeft: "0.5rem" }}>X</button>
            </div>
            <small>Line total: {(item.price * item.quantity).toFixed(2)}</small>
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <div>
            <label>Customer (optional): </label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>
          <div>
            <label>Discount: </label>
            <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <label>Payment method: </label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_banking">Mobile Banking</option>
            </select>
          </div>
          <div><strong>Subtotal: {subtotal.toFixed(2)}</strong></div>
          <div><strong>Total: {total.toFixed(2)}</strong></div>
          <button type="submit" disabled={submitting || cart.length === 0}>
            {submitting ? "Processing..." : "Complete Sale"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
