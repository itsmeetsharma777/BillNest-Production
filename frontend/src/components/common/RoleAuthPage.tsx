import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type UserRole = "shopkeeper" | "customer";
type AuthMode = "login" | "register";

interface RoleAuthPageProps {
  role: UserRole;
  mode: AuthMode;
}

interface AuthResponse {
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

export default function RoleAuthPage({
  role,
  mode,
}: RoleAuthPageProps) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const isLogin = mode === "login";

  const roleTitle =
    role === "shopkeeper" ? "Shopkeeper" : "Customer";

  const RoleIcon =
    role === "shopkeeper" ? Store : UserRound;

  const loginPath =
    role === "shopkeeper"
      ? "/shopkeeper/login"
      : "/customer/login";

  const registerPath =
    role === "shopkeeper"
      ? "/shopkeeper/register"
      : "/customer/register";

  const dashboardPath =
    role === "shopkeeper"
      ? "/shopkeeper"
      : "/customer";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (!isLogin) {
      const normalizedName = name.trim();

      if (!normalizedName) {
        setError("Please enter your name.");
        return;
      }

      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters.",
        );
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_URL}/auth/login`
        : `${API_URL}/auth/register`;

      const body = isLogin
        ? {
            email: normalizedEmail,
            password,
          }
        : {
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const result =
        (await response
          .json()
          .catch(() => null)) as AuthResponse | null;

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message ??
            (isLogin
              ? "Unable to sign in. Please try again."
              : "Unable to create your account. Please try again."),
        );
      }

      if (isLogin) {
        const loggedInUser = result?.data?.user;

        if (
          !loggedInUser?.role ||
          !["shopkeeper", "customer"].includes(
            loggedInUser.role,
          )
        ) {
          throw new Error(
            "Your account role could not be determined.",
          );
        }

        if (loggedInUser.role !== role) {
          throw new Error(
            `This account is registered as a ${
              loggedInUser.role === "shopkeeper"
                ? "Shopkeeper"
                : "Customer"
            }. Please use the correct login page.`,
          );
        }

        await refreshUser();

        navigate(dashboardPath, {
          replace: true,
        });

        return;
      }

      /*
       * Registration successful.
       * Send the user to the correct login page.
       */
      navigate(loginPath, {
        replace: true,
        state: {
          registered: true,
          email: normalizedEmail,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isLogin
            ? "Unable to sign in. Please try again."
            : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function goToForgotPassword() {
    navigate("/forgot-password", {
      state: {
        role,
      },
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        {/* Back to home */}
        <Link
          to="/"
          className="absolute left-5 top-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:left-8 sm:top-8"
        >
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>

        {/* Centered authentication content */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <span className="text-lg font-bold">
                  B
                </span>
              </span>

              <span className="text-xl font-bold tracking-tight">
                BillNest
              </span>
            </Link>
          </div>

          {/* Role icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RoleIcon className="size-8" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {roleTitle}
            </h1>
          </div>

          {/* Success */}
          {successMessage && (
            <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-primary">
              {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name - Register only */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                >
                  Password
                </label>

                {isLogin && (
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password - Register only */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {isLogin
                ? "Sign in"
                : "Create an account"}
            </button>
          </form>

          {/* Switch auth mode */}
          <div className="mt-7 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Don't have a BillNest account?{" "}
                <Link
                  to={registerPath}
                  className="font-semibold text-primary hover:underline"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have a BillNest account?{" "}
                <Link
                  to={loginPath}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}