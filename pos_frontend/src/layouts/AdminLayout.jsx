import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      <nav>
        <Link to="">Dashboard</Link>
        <Link to="products">Products</Link>
        <Link to="categories">Categories</Link>
        <Link to="customers">Customers</Link>
        <Link to="sales">Sales</Link>
        <Link to="reports">Reports</Link>
        <Link to="settings">Settings</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
