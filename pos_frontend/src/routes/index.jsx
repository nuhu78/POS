import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import CashierLayout from "../layouts/CashierLayout";
import LoginPage from "../features/dashboard/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <div>Admin Dashboard</div> },
      { path: "products", element: <div>Products</div> },
      { path: "categories", element: <div>Categories</div> },
      { path: "customers", element: <div>Customers</div> },
      { path: "sales", element: <div>Sales</div> },
      { path: "reports", element: <div>Reports</div> },
      { path: "settings", element: <div>Settings</div> },
    ],
  },
  {
    path: "/cashier",
    element: (
      <ProtectedRoute roles={["cashier"]}>
        <CashierLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <div>POS Screen</div> },
      { path: "customers", element: <div>Customers</div> },
      { path: "invoices", element: <div>Invoices</div> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
