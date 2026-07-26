import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function CashierLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-400">POS</span>
          <nav className="flex gap-2">
            <Link to="" className="text-sm text-gray-300 hover:text-white px-2 py-1">POS</Link>
            <Link to="products" className="text-sm text-gray-300 hover:text-white px-2 py-1">Products</Link>
            <Link to="customers" className="text-sm text-gray-300 hover:text-white px-2 py-1">Customers</Link>
            <Link to="invoices" className="text-sm text-gray-300 hover:text-white px-2 py-1">Invoices</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-white">Logout</button>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
