import { Navigate, Route } from "react-router-dom";

import App from "@/App";
import ExplorePage from "@/pages/ExplorePage";
import GetStartedPage from "@/pages/GetStartedPage";

import ForgotPasswordPage from "@/pages/shopkeeper/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/shopkeeper/ResetPasswordPage";

import ShopkeeperLoginPage from "@/pages/shopkeeper/LoginPage";
import ShopkeeperRegisterPage from "@/pages/shopkeeper/RegisterPage";
import ShopkeeperLearnMorePage from "@/pages/shopkeeper/LearnMorePage";

import CustomerLoginPage from "@/pages/customer/LoginPage";
import CustomerRegisterPage from "@/pages/customer/RegisterPage";
import CustomerLearnMorePage from "@/pages/customer/LearnMorePage";

import { useAuth } from "@/context/AuthContext";

function PublicRootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </div>
    );
  }

  /*
   * IMPORTANT:
   *
   * The landing page should remain accessible when
   * there is no logged-in user.
   *
   * If there is an authenticated user, send them to
   * their dashboard.
   */
  if (user?.role === "shopkeeper") {
    return <Navigate to="/shopkeeper" replace />;
  }

  if (user?.role === "customer") {
    return <Navigate to="/customer" replace />;
  }

  return <App />;
}

export function PublicRoutes() {
  return (
    <>
      {/* =====================================================
          LANDING
      ===================================================== */}
      <Route
        path="/"
        element={<PublicRootRedirect />}
      />

      {/* =====================================================
          ACCOUNT SELECTION
      ===================================================== */}
      <Route
        path="/get-started"
        element={<GetStartedPage />}
      />

      {/* =====================================================
          EXPLORE
      ===================================================== */}
      <Route
        path="/explore"
        element={<ExplorePage />}
      />

      {/* =====================================================
          SHOPKEEPER AUTH
      ===================================================== */}
      <Route
        path="/shopkeeper/login"
        element={<ShopkeeperLoginPage />}
      />

      <Route
        path="/shopkeeper/register"
        element={<ShopkeeperRegisterPage />}
      />

      <Route
        path="/shopkeeper/learn-more"
        element={<ShopkeeperLearnMorePage />}
      />

      {/* =====================================================
          CUSTOMER AUTH
      ===================================================== */}
      <Route
        path="/customer/login"
        element={<CustomerLoginPage />}
      />

      <Route
        path="/customer/register"
        element={<CustomerRegisterPage />}
      />

      <Route
        path="/customer/learn-more"
        element={<CustomerLearnMorePage />}
      />

      {/* =====================================================
          PASSWORD
      ===================================================== */}
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/* =====================================================
          BACKWARD COMPATIBILITY
      ===================================================== */}
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

      {/* =====================================================
          FALLBACK
      ===================================================== */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </>
  );
}