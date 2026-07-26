import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvoice } from "../../api/sales";

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getInvoice(id);
        setSale(data);
      } catch {
        navigate("/cashier/invoices", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!sale) return null;

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem" }} id="invoice">
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <h2>{sale.shop.shop_name}</h2>
        <p style={{ fontSize: "0.85rem" }}>Invoice: {sale.invoice_number}</p>
        <p style={{ fontSize: "0.85rem" }}>Date: {new Date(sale.date).toLocaleDateString()}</p>
      </div>

      <hr />
      <p><strong>Cashier:</strong> {sale.user_name}</p>
      <p><strong>Customer:</strong> {sale.customer_name || "Walk-in"}</p>
      <hr />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left" }}>Item</th>
            <th style={{ textAlign: "center" }}>Qty</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
              <td>{item.product_name}</td>
              <td style={{ textAlign: "center" }}>{item.quantity}</td>
              <td style={{ textAlign: "right" }}>{item.price}</td>
              <td style={{ textAlign: "right" }}>{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <p><strong>Subtotal:</strong> {sale.subtotal} {sale.shop.currency}</p>
        <p><strong>Discount:</strong> {sale.discount}</p>
        {parseFloat(sale.shop.tax_percentage) > 0 && (
          <p><strong>Tax ({sale.shop.tax_percentage}%):</strong> {(parseFloat(sale.subtotal) * parseFloat(sale.shop.tax_percentage) / 100).toFixed(2)}</p>
        )}
        <p style={{ fontSize: "1.2rem" }}><strong>Total:</strong> {sale.total} {sale.shop.currency}</p>
        <p><strong>Paid via:</strong> {sale.payment.method}</p>
      </div>

      <hr />
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        {sale.shop.receipt_footer && <p style={{ fontSize: "0.85rem", fontStyle: "italic" }}>{sale.shop.receipt_footer}</p>}
        <button onClick={() => window.print()}>Print</button>
        <button onClick={() => navigate("/cashier")} style={{ marginLeft: "0.5rem" }}>Back to POS</button>
      </div>

      <style>{`
        @media print {
          button { display: none; }
          #invoice { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
