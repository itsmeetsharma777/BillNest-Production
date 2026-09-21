import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: Array<
    "shopkeeper" | "customer"
  >;
}

export function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  if (!user) {
    const isCustomerRoute =
      location.pathname === "/customer" ||
      location.pathname.startsWith(
        "/customer/",
      );

    return (
      <Navigate
        to={
          isCustomerRoute
            ? "/customer/login"
            : "/shopkeeper/login"
        }
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "customer") {
      return (
        <Navigate
          to="/customer"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/shopkeeper"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;