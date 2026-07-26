import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "", label: "Dashboard", icon: "📊" },
  { to: "products", label: "Products", icon: "📦" },
  { to: "categories", label: "Categories", icon: "🏷️" },
  { to: "customers", label: "Customers", icon: "👥" },
  { to: "sales", label: "Sales", icon: "🧾" },
  { to: "reports", label: "Reports", icon: "📈" },
  { to: "settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (!path) return location.pathname === "/admin";
    return location.pathname.startsWith(`/admin/${path}`);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 text-white transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-700">
          <span className="font-bold text-amber-400 text-lg">POS Admin</span>
          <button className="lg:hidden text-white text-xl" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="flex flex-col py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive(link.to) ? "bg-amber-500 text-white font-semibold" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 p-4">
          <button onClick={handleLogout} className="btn w-full text-gray-300 hover:text-white hover:bg-gray-800">
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile hamburger) */}
        <header className="h-14 bg-white border-b flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button className="lg:hidden text-2xl mr-3" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className="text-lg font-semibold text-gray-800 truncate">Gift Shop & Furniture</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
