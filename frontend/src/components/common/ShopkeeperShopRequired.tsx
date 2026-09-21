import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  RefreshCw,

} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type ShopCheckState =
  | "checking"
  | "has-shop"
  | "no-shop"
  | "error";

interface ShopCheckResponse {
  success?: boolean;
  data?: {
    shop?: {
      _id?: string;
    } | null;
  };
  code?: string;
  message?: string;
}

export function ShopkeeperShopRequired() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [state, setState] =
    useState<ShopCheckState>("checking");

  const [error, setError] = useState("");

  async function checkShop() {
    setState("checking");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/shops/me`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response
          .json()
          .catch(() => null)) as
          | ShopCheckResponse
          | null;

      /*
       * The backend intentionally returns
       * SHOP_NOT_FOUND when the authenticated
       * shopkeeper has not created a shop yet.
       */
      if (
        response.status === 404 &&
        result?.code === "SHOP_NOT_FOUND"
      ) {
        setState("no-shop");
        return;
      }

      /*
       * If authentication somehow disappeared
       * while checking the shop, return to login.
       */
      if (response.status === 401) {
        navigate("/shopkeeper/login", {
          replace: true,
          state: {
            from: location,
          },
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ??
            "Unable to check your shop.",
        );
      }

      if (!result?.data?.shop) {
        setState("no-shop");
        return;
      }

      setState("has-shop");
    } catch (err) {
      setState("error");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to check your shop.",
      );
    }
  }

  useEffect(() => {
    /*
     * This route is only mounted for authenticated
     * shopkeepers.
     */
    if (!user || user.role !== "shopkeeper") {
      return;
    }

    void checkShop();

    // We intentionally check when this protected
    // shell mounts. After shop creation the user
    // navigates here again, causing a fresh check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (state === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="size-6 animate-spin" />
          </div>

          <div>
            <h1 className="text-sm font-semibold">
              Checking your shop
            </h1>

            <p className="mt-1 text-xs text-muted-foreground">
              Please wait while we prepare your workspace.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (state === "no-shop") {
    /*
     * Prevent redirecting if we are already on the
     * shop creation page. In normal routing this
     * component isn't mounted there, but this guard
     * makes the component safe against future route
     * changes.
     */
    if (
      location.pathname !==
      "/shopkeeper/create-shop"
    ) {
      return (
        <Navigate
          to="/shopkeeper/create-shop"
          replace
          state={{
            from: location,
          }}
        />
      );
    }
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>

          <h1 className="mt-4 text-lg font-semibold">
            We couldn't check your shop
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error ||
              "Something went wrong while checking your shop."}
          </p>

          <Button
            type="button"
            className="mt-5"
            onClick={() => {
              void checkShop();
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </main>
    );
  }

  if (state === "has-shop") {
    return <Outlet />;
  }

  return null;
}

export default ShopkeeperShopRequired;