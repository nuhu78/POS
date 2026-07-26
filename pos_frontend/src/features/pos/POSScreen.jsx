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
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const params = search ? { search } : { status: "active" };
      const { data } = await listProducts(params);
      setProducts(data?.results ?? data ?? []);
    } catch {
      setError("Failed to load products.");
    }
  }, [search]);

  const loadCustomers = useCallback(async () => {
    try {
      const { data } = await listCustomers();
      setCustomers(data?.results ?? data ?? []);
    } catch {
      /* customers are optional */
    } finally {
      setLoading(false);
    }
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
      setCustomerId("");
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Sale failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500 p-8">Loading POS...</div>;

  if (success) {
    return (
      <div className="card max-w-md mx-auto mt-12 text-center">
        <h2 className="text-xl font-bold text-green-600 mb-2">Sale Complete</h2>
        <p className="text-gray-600">Invoice: {success.invoice_number}</p>
        <p className="text-lg font-semibold text-gray-800 mt-1">Total: {success.total}</p>
        <div className="flex gap-2 justify-center mt-4">
          <button onClick={() => navigate(`/cashier/invoices/${success.id}`)} className="btn-primary">View Invoice</button>
          <button onClick={() => setSuccess(null)} className="btn-ghost">New Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Product panel */}
      <div className="md:w-1/2">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Products</h2>
        <input
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mb-3"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {products.length === 0 && <p className="text-gray-500 col-span-full">No products found.</p>}
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-amber-500 hover:shadow-sm transition-all bg-white"
            >
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-amber-600 font-semibold text-sm">{p.selling_price} BDT</p>
              <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="md:w-1/2">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Cart</h2>

        <div className="space-y-2 max-h-[30vh] overflow-y-auto mb-4">
          {cart.length === 0 && <p className="text-gray-500 text-sm">Cart is empty.</p>}
          {cart.map((item) => (
            <div key={item.product} className="card py-2 px-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.name}</span>
                <button onClick={() => removeFromCart(item.product)} className="text-red-500 text-xs font-bold hover:text-red-700">✕</button>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <span className="text-gray-500">Qty:</span>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  onChange={(e) => updateQty(item.product, parseInt(e.target.value) || 0)}
                  className="border border-gray-300 rounded w-16 px-2 py-1 text-sm"
                />
                <span className="text-gray-500">@ {item.price}</span>
                <span className="ml-auto font-semibold">{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
                <option value="">Walk-in</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_banking">Mobile Banking</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discount</label>
              <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount given</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" />
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="font-semibold">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-600">{total.toFixed(2)} BDT</span>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting || cart.length === 0}>
            {submitting ? "Processing..." : "Complete Sale"}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
