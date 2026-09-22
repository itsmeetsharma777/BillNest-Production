import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoutes } from "./protected-routes";
import { PublicRoutes } from "./public-routes";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        {PublicRoutes()}

        {/* =================================================
            PROTECTED ROUTES
        ================================================= */}

        {ProtectedRoutes()}

        {/* =================================================
            GLOBAL FALLBACK
        =================================================

            This MUST be after both public and protected
            routes so authenticated routes such as:

              /shopkeeper/categories
              /shopkeeper/products
              /shopkeeper/invoices
              /shopkeeper/inventory/history

            are resolved before the fallback.
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;