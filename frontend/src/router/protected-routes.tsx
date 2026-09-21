import { Navigate, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ShopkeeperShopRequired } from "@/components/common/ShopkeeperShopRequired";

import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ShopkeeperLayout } from "@/components/layout/ShopkeeperLayout";

import CustomerDashboardPage from "@/pages/customer/CustomerDashboardPage";
import CustomerInvoiceDetailsPage from "@/pages/customer/CustomerInvoiceDetailsPage";
import CustomerInvoicesPage from "@/pages/customer/CustomerInvoicesPage";
import CustomerNotificationsPage from "@/pages/customer/CustomerNotificationsPage";
import CustomerPaymentsPage from "@/pages/customer/CustomerPaymentsPage";
import CustomerSettingsPage from "@/pages/customer/CustomerSettingsPage";
import CustomerWarrantyDetailsPage from "@/pages/customer/CustomerWarrantyDetailsPage";
import CustomerWarrantiesPage from "@/pages/customer/CustomerWarrantiesPage";

import CustomersPage from "@/pages/customer/CustomersPage";

import CreateInvoicePage from "@/pages/shopkeeper/CreateInvoicePage";
import CreateWarrantyPage from "@/pages/shopkeeper/CreateWarrantyPage";
import CreateShopPage from "@/pages/shopkeeper/CreateShopPage";
import CustomerLedgerPage from "@/pages/shopkeeper/CustomerLedgerPage";
import InvoiceDetailsPage from "@/pages/shopkeeper/InvoiceDetailsPage";
import InvoicesPage from "@/pages/shopkeeper/InvoicesPage";
import NotificationsPage from "@/pages/shopkeeper/NotificationsPage";
import ProductsPage from "@/pages/shopkeeper/ProductsPage";
import ReportsPage from "@/pages/shopkeeper/ReportsPage";
import SettingsPage from "@/pages/shopkeeper/SettingsPage";
import { ShopkeeperDashboard } from "@/pages/shopkeeper/dashboard";
import WarrantyDetailsPage from "@/pages/shopkeeper/WarrantyDetailsPage";
import WarrantiesPage from "@/pages/shopkeeper/WarrantiesPage";
import InventoryHistoryPage from "@/pages/shopkeeper/InventoryHistoryPage";



export function ProtectedRoutes() {
  return (
    <>
      {/* ===================================================== */}
      {/* SHOPKEEPER AUTHENTICATION                             */}
      {/* ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["shopkeeper"]}
          />
        }
      >
        {/* =================================================== */}
        {/* FIRST-TIME SHOP SETUP                               */}
        {/* =================================================== */}

        <Route
          path="/shopkeeper/create-shop"
          element={<CreateShopPage />}
        />

        {/* =================================================== */}
        {/* SHOPKEEPER APPLICATION                              */}
        {/* =================================================== */}

        <Route
          element={<ShopkeeperShopRequired />}
        >
          <Route
            element={<ShopkeeperLayout />}
          >
            {/* ================================================= */}
            {/* DASHBOARD                                         */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper"
              element={<ShopkeeperDashboard />}
            />

            {/* ================================================= */}
            {/* CUSTOMERS                                         */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/customers"
              element={<CustomersPage />}
            />

            <Route
              path="/shopkeeper/customers/:customerId"
              element={<CustomerLedgerPage />}
            />

            {/* ================================================= */}
            {/* PRODUCTS                                          */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/products"
              element={<ProductsPage />}
            />

            <Route
              path="/shopkeeper/inventory/history"
              element={<InventoryHistoryPage />}
            />

            {/* ================================================= */}
            {/* INVOICES                                          */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/invoices"
              element={<InvoicesPage />}
            />

            <Route
              path="/shopkeeper/invoices/new"
              element={<CreateInvoicePage />}
            />

            <Route
              path="/shopkeeper/invoices/:invoiceId"
              element={<InvoiceDetailsPage />}
            />

            {/* ================================================= */}
            {/* WARRANTIES                                        */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/warranties"
              element={<WarrantiesPage />}
            />

            <Route
              path="/shopkeeper/warranties/new"
              element={<CreateWarrantyPage />}
            />

            <Route
              path="/shopkeeper/warranties/:warrantyId"
              element={<WarrantyDetailsPage />}
            />

            {/* ================================================= */}
            {/* REPORTS                                            */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/reports"
              element={<ReportsPage />}
            />

            {/* ================================================= */}
            {/* NOTIFICATIONS                                      */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/notifications"
              element={<NotificationsPage />}
            />

            {/* ================================================= */}
            {/* SETTINGS                                           */}
            {/* ================================================= */}

            <Route
              path="/shopkeeper/settings"
              element={<SettingsPage />}
            />
          </Route>
        </Route>
      </Route>

      {/* ===================================================== */}
      {/* CUSTOMER                                             */}
      {/* ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["customer"]}
          />
        }
      >
        <Route
          element={<CustomerLayout />}
        >
          {/* Dashboard */}
          <Route
            path="/customer"
            element={<CustomerDashboardPage />}
          />

          {/* Invoices */}
          <Route
            path="/customer/invoices"
            element={<CustomerInvoicesPage />}
          />

          <Route
            path="/customer/invoices/:invoiceId"
            element={<CustomerInvoiceDetailsPage />}
          />

          {/* Payments */}
          <Route
            path="/customer/payments"
            element={<CustomerPaymentsPage />}
          />

          {/* Warranties */}
          <Route
            path="/customer/warranties"
            element={<CustomerWarrantiesPage />}
          />

          <Route
            path="/customer/warranties/:warrantyId"
            element={<CustomerWarrantyDetailsPage />}
          />

          {/* Notifications */}
          <Route
            path="/customer/notifications"
            element={<CustomerNotificationsPage />}
          />

          {/* Settings */}
          <Route
            path="/customer/settings"
            element={<CustomerSettingsPage />}
          />
        </Route>
      </Route>

      {/* ===================================================== */}
      {/* LEGACY DASHBOARD REDIRECT                             */}
      {/* ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <Navigate
            to="/shopkeeper"
            replace
          />
        }
      />
    </>
  );
}

export default ProtectedRoutes;