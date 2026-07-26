import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../../api/reports";
import { getLowStock } from "../../api/products";
import { useAuth } from "../../auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const prefix = user?.role === "admin" ? "/admin" : "/cashier";
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    (async () => {
      const [dRes, lsRes] = await Promise.all([getDashboard(), getLowStock()]);
      setData(dRes.data);
      setLowStock(lsRes.data ?? []);
    })();
  }, []);

  if (!data) return <div className="text-gray-500 p-8">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Today's Sales</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.today_sales} BDT</p>
          <p className="text-xs text-gray-500">{data.today_transactions} transactions</p>
        </div>
        <div className="card text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Active Products</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.active_products}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Customers</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.total_customers}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Low Stock</h3>
          <p className={`text-2xl font-bold mt-1 ${data.low_stock_products > 0 ? "text-red-600" : "text-gray-800"}`}>
            {data.low_stock_products}
          </p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Low Stock Alerts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Stock</th>
                  <th className="p-2 text-left">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">
                      <Link to={`${prefix}/products?search=${p.sku}`} className="text-amber-600 hover:text-amber-800 underline">
                        {p.sku}
                      </Link>
                    </td>
                    <td className="p-2 text-red-600 font-semibold">{p.stock}</td>
                    <td className="p-2 text-gray-500">{p.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
