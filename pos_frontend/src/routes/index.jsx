import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import CashierLayout from "../layouts/CashierLayout";
import LoginPage from "../features/dashboard/LoginPage";
import RegisterPage from "../features/dashboard/RegisterPage";
import CategoriesPage from "../features/categories/CategoriesPage";
import ProductsPage from "../features/products/ProductsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
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
      { path: "products", element: <ProductsPage /> },
      { path: "categories", element: <CategoriesPage /> },
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
      { path: "products", element: <ProductsPage /> },
      { path: "customers", element: <div>Customers</div> },
      { path: "invoices", element: <div>Invoices</div> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
