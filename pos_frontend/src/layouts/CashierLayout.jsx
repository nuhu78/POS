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
    <div>
      <nav>
        <Link to="/pos">POS</Link>
        <Link to="/customers">Customers</Link>
        <Link to="/invoices">Invoices</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
