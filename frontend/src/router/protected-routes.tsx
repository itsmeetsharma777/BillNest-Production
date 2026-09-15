import { Navigate, Route } from "react-router-dom";

import { ShopkeeperDashboard } from "@/pages/shopkeeper/dashboard";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export function ProtectedRoutes() {
  return (
    <>
      <Route element={<ProtectedRoute allowedRoles={["shopkeeper"]} />}>
        <Route
          path="/shopkeeper"
          element={<ShopkeeperDashboard />}
        />

        <Route
          path="/dashboard"
          element={<Navigate to="/shopkeeper" replace />}
        />
      </Route>
    </>
  );
}