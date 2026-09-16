import { Navigate, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ShopkeeperLayout } from "@/components/layout/ShopkeeperLayout";
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

export function ProtectedRoutes() {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["shopkeeper"]}
          />
        }
      >
        <Route element={<ShopkeeperLayout />}>
          <Route
            path="/shopkeeper"
            element={<ShopkeeperDashboard />}
          />

          <Route
            path="/shopkeeper/customers"
            element={<CustomersPage />}
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
            path="/shopkeeper/invoices"
            element={<InvoicesPage />}
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
            element={
              <PlaceholderPage
                title="Settings"
                description="Manage your BillNest account and preferences."
              />
            }
          />
        </Route>
      </Route>

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

function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}