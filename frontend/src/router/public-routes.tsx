import { Navigate, Route } from "react-router-dom";

import App from "@/App";
import LoginPage from "@/pages/shopkeeper/LoginPage";
import RegisterPage from "@/pages/shopkeeper/RegisterPage";

export function PublicRoutes() {
  return (
    <>
      <Route path="/" element={<App />} />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/forgot-password"
        element={
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-muted-foreground">
              Forgot password page coming next.
            </p>
          </div>
        }
      />

      <Route
        path="/reset-password"
        element={
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-muted-foreground">
              Reset password page coming next.
            </p>
          </div>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </>
  );
}