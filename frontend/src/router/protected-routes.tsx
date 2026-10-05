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
import CreateShopPage from "@/pages/shopkeeper/CreateShopPage";
import CreateWarrantyPage from "@/pages/shopkeeper/CreateWarrantyPage";
import CustomerLedgerPage from "@/pages/shopkeeper/CustomerLedgerPage";
import InvoiceDetailsPage from "@/pages/shopkeeper/InvoiceDetailsPage";
import InvoicesPage from "@/pages/shopkeeper/InvoicesPage";
import InventoryHistoryPage from "@/pages/shopkeeper/InventoryHistoryPage";
import NotificationsPage from "@/pages/shopkeeper/NotificationsPage";
import OcrPage from "@/pages/shopkeeper/OcrPage";
import ProductsPage from "@/pages/shopkeeper/ProductsPage";
import ProductVariantsPage from "@/pages/shopkeeper/ProductVariantsPage";
import ReportsPage from "@/pages/shopkeeper/ReportsPage";
import SettingsPage from "@/pages/shopkeeper/SettingsPage";
import { ShopkeeperDashboard } from "@/pages/shopkeeper/dashboard";
import WarrantyDetailsPage from "@/pages/shopkeeper/WarrantyDetailsPage";
import WarrantiesPage from "@/pages/shopkeeper/WarrantiesPage";
import CategoriesPage from "@/pages/shopkeeper/CategoriesPage";
import BrandsPage from "@/pages/shopkeeper/BrandsPage";

export function ProtectedRoutes() {
  return (
    <>
      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "shopkeeper",
            ]}
          />
        }
      >
        <Route
          path="/shopkeeper/create-shop"
          element={
            <CreateShopPage />
          }
        />

        <Route
          element={
            <ShopkeeperLayout />
          }
        >
          <Route
            path="/shopkeeper/brands"
            element={
              <BrandsPage />
            }
          />
        </Route>

        <Route
          element={
            <ShopkeeperShopRequired />
          }
        >
          <Route
            element={
              <ShopkeeperLayout />
            }
          >
            <Route
              path="/shopkeeper"
              element={
                <ShopkeeperDashboard />
              }
            />

            <Route
              path="/shopkeeper/customers"
              element={
                <CustomersPage />
              }
            />

            <Route
              path="/shopkeeper/customers/:customerId"
              element={
                <CustomerLedgerPage />
              }
            />

            <Route
              path="/shopkeeper/products"
              element={
                <ProductsPage />
              }
            />

            <Route
              path="/shopkeeper/products/:productId/variants"
              element={
                <ProductVariantsPage />
              }
            />

            <Route
              path="/shopkeeper/categories"
              element={
                <CategoriesPage />
              }
            />

            <Route
              path="/shopkeeper/inventory/history"
              element={
                <InventoryHistoryPage />
              }
            />

            <Route
              path="/shopkeeper/invoices"
              element={
                <InvoicesPage />
              }
            />

            <Route
              path="/shopkeeper/invoices/new"
              element={
                <CreateInvoicePage />
              }
            />

            <Route
              path="/shopkeeper/invoices/:invoiceId"
              element={
                <InvoiceDetailsPage />
              }
            />

            <Route
              path="/shopkeeper/ocr"
              element={
                <OcrPage />
              }
            />

            <Route
              path="/shopkeeper/warranties"
              element={
                <WarrantiesPage />
              }
            />

            <Route
              path="/shopkeeper/warranties/new"
              element={
                <CreateWarrantyPage />
              }
            />

            <Route
              path="/shopkeeper/warranties/:warrantyId"
              element={
                <WarrantyDetailsPage />
              }
            />

            <Route
              path="/shopkeeper/reports"
              element={
                <ReportsPage />
              }
            />

            <Route
              path="/shopkeeper/notifications"
              element={
                <NotificationsPage />
              }
            />

            <Route
              path="/shopkeeper/settings"
              element={
                <SettingsPage />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "customer",
            ]}
          />
        }
      >
        <Route
          element={
            <CustomerLayout />
          }
        >
          <Route
            path="/customer"
            element={
              <CustomerDashboardPage />
            }
          />

          <Route
            path="/customer/invoices"
            element={
              <CustomerInvoicesPage />
            }
          />

          <Route
            path="/customer/invoices/:invoiceId"
            element={
              <CustomerInvoiceDetailsPage />
            }
          />

          <Route
            path="/customer/payments"
            element={
              <CustomerPaymentsPage />
            }
          />

          <Route
            path="/customer/warranties"
            element={
              <CustomerWarrantiesPage />
            }
          />

          <Route
            path="/customer/warranties/:warrantyId"
            element={
              <CustomerWarrantyDetailsPage />
            }
          />

          <Route
            path="/customer/notifications"
            element={
              <CustomerNotificationsPage />
            }
          />

          <Route
            path="/customer/settings"
            element={
              <CustomerSettingsPage />
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

export default ProtectedRoutes;
