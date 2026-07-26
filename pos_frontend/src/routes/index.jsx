import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import CashierLayout from "../layouts/CashierLayout";
import LoginPage from "../features/dashboard/LoginPage";
import RegisterPage from "../features/dashboard/RegisterPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import CategoriesPage from "../features/categories/CategoriesPage";
import ProductsPage from "../features/products/ProductsPage";
import CustomersPage from "../features/customers/CustomersPage";
import POSScreen from "../features/pos/POSScreen";
import InvoicePage from "../features/invoices/InvoicePage";
import InvoiceListPage from "../features/invoices/InvoiceListPage";
import ReportsPage from "../features/reports/ReportsPage";

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
      { index: true, element: <DashboardPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "sales", element: <InvoiceListPage /> },
      { path: "reports", element: <ReportsPage /> },
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
      { path: "invoices", element: <InvoiceListPage /> },
      { path: "invoices/:id", element: <InvoicePage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
