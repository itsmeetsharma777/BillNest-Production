import { Navigate, Route } from "react-router-dom";

import App from "@/App";
import ExplorePage from "@/pages/ExplorePage";

import ForgotPasswordPage from "@/pages/shopkeeper/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/shopkeeper/ResetPasswordPage";

import ShopkeeperLoginPage from "@/pages/shopkeeper/LoginPage";
import ShopkeeperRegisterPage from "@/pages/shopkeeper/RegisterPage";

import CustomerLoginPage from "@/pages/customer/LoginPage";
import CustomerRegisterPage from "@/pages/customer/RegisterPage";

import { useAuth } from "@/context/AuthContext";

function SessionLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </div>
    </main>
  );
}

/*
 * Root URL always opens the BillNest homepage.
 */
function PublicEntryRoute() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoading />;
  }

  return <App />;
}

/*
 * Prevent authenticated users from opening
 * public login/register pages.
 */
function PublicAuthRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoading />;
  }

  if (user) {
    return (
      <Navigate
        to={
          user.role === "customer"
            ? "/customer"
            : "/shopkeeper"
        }
        replace
      />
    );
  }

  return children;
}

export function PublicRoutes() {
  return (
    <>
      {/* HOME */}
      <Route
        path="/"
        element={<PublicEntryRoute />}
      />

      {/* EXPLORE */}
      <Route
        path="/explore"
        element={<ExplorePage />}
      />

      {/* ========================================= */}
      {/* SHOPKEEPER AUTH */}
      {/* ========================================= */}

      <Route
        path="/shopkeeper/login"
        element={
          <PublicAuthRoute>
            <ShopkeeperLoginPage />
          </PublicAuthRoute>
        }
      />

      <Route
        path="/shopkeeper/register"
        element={
          <PublicAuthRoute>
            <ShopkeeperRegisterPage />
          </PublicAuthRoute>
        }
      />

      {/* ========================================= */}
      {/* CUSTOMER AUTH */}
      {/* ========================================= */}

      <Route
        path="/customer/login"
        element={
          <PublicAuthRoute>
            <CustomerLoginPage />
          </PublicAuthRoute>
        }
      />

      <Route
        path="/customer/register"
        element={
          <PublicAuthRoute>
            <CustomerRegisterPage />
          </PublicAuthRoute>
        }
      />

      {/* ========================================= */}
      {/* PASSWORD RESET */}
      {/* ========================================= */}

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/* ========================================= */}
      {/* BACKWARD COMPATIBILITY */}
      {/* ========================================= */}

      <Route
        path="/login"
        element={
          <Navigate
            to="/shopkeeper/login"
            replace
          />
        }
      />

      <Route
        path="/register"
        element={
          <Navigate
            to="/shopkeeper/register"
            replace
          />
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </>
  );
}