import { Navigate, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { ShopkeeperLayout } from "@/components/layout/ShopkeeperLayout";

import CustomerDashboardPage from "@/pages/customer/CustomerDashboardPage";
import CustomerInvoiceDetailsPage from "@/pages/customer/CustomerInvoiceDetailsPage";
import CustomerInvoicesPage from "@/pages/customer/CustomerInvoicesPage";
import CustomerNotificationsPage from "@/pages/customer/CustomerNotificationsPage";
import CustomerWarrantyDetailsPage from "@/pages/customer/CustomerWarrantyDetailsPage";
import CustomerWarrantiesPage from "@/pages/customer/CustomerWarrantiesPage";

import { ShopkeeperDashboard } from "@/pages/shopkeeper/dashboard";
import CreateInvoicePage from "@/pages/shopkeeper/CreateInvoicePage";
import InvoiceDetailsPage from "@/pages/shopkeeper/InvoiceDetailsPage";
import InvoicesPage from "@/pages/shopkeeper/InvoicesPage";
import CustomersPage from "@/pages/customer/CustomersPage";
import WarrantiesPage from "@/pages/shopkeeper/WarrantiesPage";
import CreateWarrantyPage from "@/pages/shopkeeper/CreateWarrantyPage";
import WarrantyDetailsPage from "@/pages/shopkeeper/WarrantyDetailsPage";
import ReportsPage from "@/pages/shopkeeper/ReportsPage";
import NotificationsPage from "@/pages/shopkeeper/NotificationsPage";

function CustomerSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">
          Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Account settings will appear here.
        </p>
      </div>
    </div>
  );
}

function ShopkeeperSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">
          Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Shop settings will appear here.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoutes() {
  return (
    <>
      {/* SHOPKEEPER */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["shopkeeper"]} />
        }
      >
        <Route element={<ShopkeeperLayout />}>
          <Route
            path="/shopkeeper"
            element={<ShopkeeperDashboard />}
          />

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

          <Route
            path="/shopkeeper/customers"
            element={<CustomersPage />}
          />

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

          <Route
            path="/shopkeeper/reports"
            element={<ReportsPage />}
          />

          <Route
            path="/shopkeeper/notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="/shopkeeper/settings"
            element={<ShopkeeperSettingsPage />}
          />
        </Route>
      </Route>

      {/* CUSTOMER */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["customer"]} />
        }
      >
        <Route element={<CustomerLayout />}>
          <Route
            path="/customer"
            element={<CustomerDashboardPage />}
          />

          <Route
            path="/customer/invoices"
            element={<CustomerInvoicesPage />}
          />

          <Route
            path="/customer/invoices/:invoiceId"
            element={<CustomerInvoiceDetailsPage />}
          />

          <Route
            path="/customer/warranties"
            element={<CustomerWarrantiesPage />}
          />

          <Route
            path="/customer/warranties/:warrantyId"
            element={<CustomerWarrantyDetailsPage />}
          />

          <Route
            path="/customer/notifications"
            element={<CustomerNotificationsPage />}
          />

          <Route
            path="/customer/settings"
            element={<CustomerSettingsPage />}
          />
        </Route>
      </Route>

      {/* LEGACY DASHBOARD REDIRECT */}
      <Route
        path="/dashboard"
        element={
          <Navigate to="/shopkeeper" replace />
        }
      />
    </>
  );
}