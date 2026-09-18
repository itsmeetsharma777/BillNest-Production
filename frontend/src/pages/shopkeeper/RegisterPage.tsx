import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type UserRole = "shopkeeper" | "customer";

interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      emailVerified?: boolean;
    };
  };
}

interface LocationState {
  from?: {
    pathname?: string;
  };
  registered?: boolean;
  email?: string;
  role?: UserRole;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const locationState =
    (location.state as LocationState | null) ?? null;

  const [role, setRole] = useState<UserRole>(
    locationState?.role ?? "shopkeeper",
  );

  const [email, setEmail] = useState(
    locationState?.email ?? "",
  );

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address.",
      );
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        },
      );

      const result =
        (await response
          .json()
          .catch(() => null)) as LoginResponse | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ??
            "Unable to sign in. Please try again.",
        );
      }

      const loggedInUser = result.data?.user;

      if (
        !loggedInUser?.role ||
        !["shopkeeper", "customer"].includes(
          loggedInUser.role,
        )
      ) {
        throw new Error(
          "Your account role could not be determined. Please contact support.",
        );
      }

      if (loggedInUser.role !== role) {
        throw new Error(
          `This account is registered as a ${
            loggedInUser.role === "shopkeeper"
              ? "Shopkeeper"
              : "Customer"
          }. Please select the correct account type.`,
        );
      }

      await refreshUser();

      if (loggedInUser.role === "shopkeeper") {
        navigate("/shopkeeper", {
          replace: true,
        });
        return;
      }

      if (loggedInUser.role === "customer") {
        navigate("/customer", {
          replace: true,
        });
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleRoleChange(
    nextRole: UserRole,
  ) {
    if (nextRole === role) {
      return;
    }

    setRole(nextRole);

    /*
     * Clear all login fields whenever the
     * account type is changed.
     */
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-xl font-bold tracking-tight"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-lg">
                B
              </span>

              BillNest
            </Link>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/70">
              Smart billing management
            </p>

            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Everything your business needs to manage
              bills and warranties.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
              Create invoices, manage customers, track
              warranties, and keep your business records
              organized in one place.
            </p>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} BillNest. All
            rights reserved.
          </p>
        </section>

        {/* Sign in panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-3 text-xl font-bold tracking-tight"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  B
                </span>

                BillNest
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-muted-foreground">
                Sign in to your BillNest account to
                continue.
              </p>
            </div>

            {/* Account type */}
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-sm font-medium">
                  Account type
                </label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select how you use BillNest.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Shopkeeper */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleRoleChange("shopkeeper")
                  }
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    role === "shopkeeper"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-input bg-background hover:bg-muted/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div
                    className={`mb-3 flex size-10 items-center justify-center rounded-xl ${
                      role === "shopkeeper"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Store className="size-5" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      Shopkeeper
                    </span>

                    {role === "shopkeeper" && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Manage your business, customers,
                    invoices and warranties.
                  </p>
                </button>

                {/* Customer */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleRoleChange("customer")
                  }
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    role === "customer"
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-input bg-background hover:bg-muted/50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div
                    className={`mb-3 flex size-10 items-center justify-center rounded-xl ${
                      role === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <UserRound className="size-5" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      Customer
                    </span>

                    {role === "customer" && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Track your purchases, invoices and
                    product warranties.
                  </p>
                </button>
              </div>
            </div>

            {/* Registration success */}
            {locationState?.registered && (
              <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                Account created successfully. Sign in
                to continue.
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Sign in form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Create account */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have a BillNest account?{" "}
              <Link
                to="/login"
                state={{ role }}
                className="font-semibold text-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}