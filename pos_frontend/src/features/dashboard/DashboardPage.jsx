import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import Table from "../../components/Table";
import { getDashboard } from "../../api/reports";
import { getLowStock } from "../../api/products";

export default function DashboardPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const prefix = user?.role === "admin" ? "/admin" : "/cashier";
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [dRes, lsRes] = await Promise.all([getDashboard(), getLowStock()]);
        setData(dRes.data);
        setLowStock(lsRes.data ?? []);
      } catch {
        showToast("Failed to load dashboard.", "error");
      }
    })();
  }, []);

  if (!data) return <div className="text-gray-500 p-8">Loading dashboard...</div>;

  const lowStockColumns = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU", render: (row) => (
      <Link to={`${prefix}/products?search=${row.sku}`} className="text-amber-600 hover:text-amber-800 underline">{row.sku}</Link>
    )},
    { key: "stock", label: "Stock", render: (row) => <span className="text-red-600 font-semibold">{row.stock}</span> },
    { key: "low_stock_threshold", label: "Threshold", className: "text-gray-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Today's Sales</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.today_sales} BDT</p>
          <p className="text-xs text-gray-500">{data.today_transactions} transactions</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Active Products</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.active_products}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Customers</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.total_customers}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Low Stock</h3>
          <p className={`text-2xl font-bold mt-1 ${data.low_stock_products > 0 ? "text-red-600" : "text-gray-800"}`}>
            {data.low_stock_products}
          </p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Low Stock Alerts</h2>
          <Table columns={lowStockColumns} rows={lowStock} />
        </div>
      )}
    </div>
  );
}
