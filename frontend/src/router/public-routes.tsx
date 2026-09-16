import { Navigate, Route } from "react-router-dom";

import App from "@/App";
import ForgotPasswordPage from "@/pages/shopkeeper/ForgotPasswordPage";
import LoginPage from "@/pages/shopkeeper/LoginPage";
import RegisterPage from "@/pages/shopkeeper/RegisterPage";
import ResetPasswordPage from "@/pages/shopkeeper/ResetPasswordPage";

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
        element={<ForgotPasswordPage />}
      />

<Route
  path="/reset-password"
  element={<ResetPasswordPage />}
/>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </>
  );
}