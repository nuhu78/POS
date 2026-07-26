import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import CashierLayout from "../layouts/CashierLayout";
import LoginPage from "../features/dashboard/LoginPage";
import RegisterPage from "../features/dashboard/RegisterPage";
import CategoriesPage from "../features/categories/CategoriesPage";
import ProductsPage from "../features/products/ProductsPage";
import CustomersPage from "../features/customers/CustomersPage";
import POSScreen from "../features/pos/POSScreen";

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
      { path: "customers", element: <CustomersPage /> },
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
      { index: true, element: <POSScreen /> },
      { path: "products", element: <ProductsPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "invoices", element: <div>Invoices</div> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
