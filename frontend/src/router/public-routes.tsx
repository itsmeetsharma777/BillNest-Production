import { Navigate, Route } from "react-router-dom";

import App from "@/App";
import ExplorePage from "@/pages/ExplorePage";
import ForgotPasswordPage from "@/pages/shopkeeper/ForgotPasswordPage";
import LoginPage from "@/pages/shopkeeper/LoginPage";
import RegisterPage from "@/pages/shopkeeper/RegisterPage";
import ResetPasswordPage from "@/pages/shopkeeper/ResetPasswordPage";
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
 * The BillNest root URL is always the public landing page.
 *
 * Authentication is intentionally NOT used to redirect "/" into
 * a dashboard. The session can remain active in the background,
 * but opening the main BillNest URL should always show Get Started.
 */
function PublicEntryRoute() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SessionLoading />;
  }

  return <App />;
}

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
      {/* PUBLIC LANDING PAGE */}
      <Route
        path="/"
        element={<PublicEntryRoute />}
      />

      {/* PUBLIC EXPLORE PAGE */}
      <Route
        path="/explore"
        element={<ExplorePage />}
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />

      {/* REGISTER */}
      <Route
        path="/register"
        element={
          <PublicAuthRoute>
            <RegisterPage />
          </PublicAuthRoute>
        }
      />

      {/* PASSWORD RESET */}
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
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