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

  if (loading) return <div className="text-gray-500 p-8">Loading invoice...</div>;
  if (!sale) return null;

  return (
    <div className="max-w-sm mx-auto" id="invoice">
      <div className="card print:shadow-none print:border-none">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{sale.shop.shop_name}</h2>
          <p className="text-xs text-gray-500">Invoice: {sale.invoice_number}</p>
          <p className="text-xs text-gray-500">Date: {new Date(sale.date).toLocaleDateString()}</p>
        </div>

        <hr className="border-gray-300 mb-3" />
        <div className="text-xs space-y-1 mb-3">
          <p><span className="font-medium">Cashier:</span> {sale.user_name}</p>
          <p><span className="font-medium">Customer:</span> {sale.customer_name || "Walk-in"}</p>
        </div>
        <hr className="border-gray-300 mb-3" />

        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-1">{item.product_name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{item.price}</td>
                <td className="text-right py-1">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-xs text-right space-y-1">
          <p><span className="font-medium">Subtotal:</span> {sale.subtotal} {sale.shop.currency}</p>
          <p><span className="font-medium">Discount:</span> {sale.discount}</p>
          {parseFloat(sale.shop.tax_percentage) > 0 && (
            <p><span className="font-medium">Tax ({sale.shop.tax_percentage}%):</span> {(parseFloat(sale.subtotal) * parseFloat(sale.shop.tax_percentage) / 100).toFixed(2)}</p>
          )}
          <p className="text-sm font-bold text-gray-800">Total: {sale.total} {sale.shop.currency}</p>
          <p><span className="font-medium">Paid via:</span> {sale.payment.method}</p>
        </div>

        <hr className="border-gray-300 my-3" />
        {sale.shop.receipt_footer && (
          <p className="text-xs text-center italic text-gray-500 mb-3">{sale.shop.receipt_footer}</p>
        )}

        <div className="flex gap-2 justify-center print:hidden">
          <button onClick={() => window.print()} className="btn-primary btn-sm">Print</button>
          <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">Back</button>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          #invoice { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
