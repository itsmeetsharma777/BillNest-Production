import { useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  UserRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import BillNestLogo from "@/components/branding/BillNestLogo";
import { ThemeSelector } from "@/components/common/theme-selector";
import { useAuth } from "@/context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type UserRole =
  | "shopkeeper"
  | "customer";

type AuthMode =
  | "login"
  | "register";

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

const roleConfig = {
  shopkeeper: {
    title: "Shopkeeper",
    badge: "SHOPKEEPER",
    description:
      "Sign in to your shopkeeper account and manage your business, customers, invoices and warranties easily.",
    icon: Store,
    accent: "blue",
    features: [
      "Create invoices",
      "Manage customers",
      "Track warranties",
    ],
  },

  customer: {
    title: "Customer",
    badge: "CUSTOMER",
    description:
      "Sign in to your customer account and keep all your purchases, invoices and warranties in one place.",
    icon: UserRound,
    accent: "violet",
    features: [
      "Track purchases",
      "Digital invoices",
      "Warranty details",
    ],
  },
} as const;

export default function RoleAuthPage({
  role,
  mode,
}: RoleAuthPageProps) {
  const navigate = useNavigate();

  const { refreshUser } =
    useAuth();

  const isLogin =
    mode === "login";

  const config =
    roleConfig[role];

  const RoleIcon =
    config.icon;

  const isBlue =
    config.accent === "blue";

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

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

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
      setError(
        "Please enter your password.",
      );

      return;
    }

    if (!isLogin) {
      const normalizedName =
        name.trim();

      if (!normalizedName) {
        setError(
          "Please enter your name.",
        );

        return;
      }

      if (password.length < 8) {
        setError(
          "Password must be at least 8 characters.",
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match.",
        );

        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint =
        isLogin
          ? `${API_URL}/auth/login`
          : `${API_URL}/auth/register`;

      const body =
        isLogin
          ? {
              email:
                normalizedEmail,
              password,
            }
          : {
              name: name.trim(),
              email:
                normalizedEmail,
              password,
              role,
            };

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body:
              JSON.stringify(body),
          },
        );

      const result =
        (await response
          .json()
          .catch(() => null)) as
          | AuthResponse
          | null;

      if (
        !response.ok ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ??
            (isLogin
              ? "Unable to sign in. Please try again."
              : "Unable to create your account. Please try again."),
        );
      }

      if (isLogin) {
        const loggedInUser =
          result?.data?.user;

        if (
          !loggedInUser?.role ||
          ![
            "shopkeeper",
            "customer",
          ].includes(
            loggedInUser.role,
          )
        ) {
          throw new Error(
            "Your account role could not be determined.",
          );
        }

        if (
          loggedInUser.role !==
          role
        ) {
          const actualRole =
            loggedInUser.role ===
            "shopkeeper"
              ? "Shopkeeper"
              : "Customer";

          throw new Error(
            "This account is registered as a " +
              actualRole +
              ". Please use the correct login page.",
          );
        }

        await refreshUser();

        navigate(
          dashboardPath,
          {
            replace: true,
          },
        );

        return;
      }

      navigate(
        loginPath,
        {
          replace: true,
          state: {
            registered: true,
            email:
              normalizedEmail,
          },
        },
      );
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
    navigate(
      "/forgot-password",
      {
        state: {
          role,
        },
      },
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">

      {/* Background */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={[
            "absolute left-1/2 top-[-220px]",
            "h-[450px] w-[650px]",
            "-translate-x-1/2 rounded-full",
            "blur-[140px]",
            isBlue
              ? "bg-blue-500/[0.035] dark:bg-blue-500/[0.08]"
              : "bg-violet-500/[0.035] dark:bg-violet-500/[0.08]",
          ].join(" ")}
        />
      </div>

      {/* Page */}

      <div className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col px-5 py-3 sm:px-8">

        {/* Header */}

        <header className="flex shrink-0 items-center justify-between">

          <Link
            to="/"
            className="flex items-center"
            aria-label="Go to BillNest home"
          >
            <BillNestLogo
              variant="full"
              size={76}
              className="h-[76px] w-[76px]"
            />
          </Link>

          <div className="rounded-lg border border-border bg-card">
            <ThemeSelector />
          </div>

        </header>

        {/* Center */}

        <div className="flex flex-1 flex-col items-center justify-center">

          {/* Back */}

          <div className="mb-2.5 w-full max-w-[600px]">

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />

              Back to Home
            </Link>

          </div>

          {/* Login card */}

          <section
            className={[
              "w-full max-w-[600px]",
              "rounded-[18px] border",
              "bg-card/90 backdrop-blur-xl",
              "px-5 py-5",
              "shadow-2xl",
              "sm:px-6 sm:py-6",
              isBlue
                ? "border-blue-500/65 shadow-blue-500/[0.07]"
                : "border-violet-500/65 shadow-violet-500/[0.07]",
            ].join(" ")}
          >

            {/* Card header */}

            <div className="flex items-start justify-between">

              <div
                className={[
                  "flex size-12 items-center justify-center",
                  "rounded-xl text-white shadow-lg",
                  isBlue
                    ? [
                        "bg-gradient-to-br",
                        "from-blue-400 to-blue-600",
                        "shadow-blue-500/20",
                      ].join(" ")
                    : [
                        "bg-gradient-to-br",
                        "from-violet-400 to-purple-600",
                        "shadow-violet-500/20",
                      ].join(" "),
                ].join(" ")}
              >
                <RoleIcon className="size-6" />
              </div>

              <span
                className={[
                  "rounded-full border",
                  "px-3.5 py-1.5",
                  "text-[8px] font-bold",
                  "tracking-[0.18em]",
                  isBlue
                    ? [
                        "border-blue-500/70",
                        "bg-blue-500/[0.04]",
                        "text-blue-500",
                      ].join(" ")
                    : [
                        "border-violet-500/70",
                        "bg-violet-500/[0.04]",
                        "text-violet-500",
                      ].join(" "),
                ].join(" ")}
              >
                {config.badge}
              </span>

            </div>

            {/* Title */}

            <div className="mt-3.5">

              <h1 className="text-[27px] font-bold tracking-tight">
                {isLogin
                  ? "Welcome back"
                  : "Create your " +
                    config.title.toLowerCase() +
                    " account"}
              </h1>

              <p className="mt-1.5 max-w-[550px] text-[11px] leading-[1.55] text-muted-foreground sm:text-[12px]">
                {isLogin
                  ? config.description
                  : "Create your BillNest " +
                    config.title.toLowerCase() +
                    " account and keep everything organized in one place."}
              </p>

            </div>

            {/* Error */}

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[10px] text-destructive"
              >
                {error}
              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-3"
            >

              {!isLogin && (
                <div>

                  <label
                    htmlFor="name"
                    className="mb-1 block text-[11px] font-medium"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your name"
                    disabled={isLoading}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                  />

                </div>
              )}

              <div>

                <label
                  htmlFor="email"
                  className="mb-1 block text-[11px] font-medium"
                >
                  Email address
                </label>

                <div className="relative">

                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                  />

                </div>

              </div>

              <div>

                <div className="mb-1 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-[11px] font-medium"
                  >
                    Password
                  </label>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={
                        goToForgotPassword
                      }
                      className={[
                        "text-[11px] font-medium hover:underline",
                        isBlue
                          ? "text-blue-500"
                          : "text-violet-500",
                      ].join(" ")}
                    >
                      Forgot password?
                    </button>
                  )}

                </div>

                <div className="relative">

                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

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
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>

                </div>

              </div>

              {!isLogin && (
                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-[11px] font-medium"
                  >
                    Confirm password
                  </label>

                  <div className="relative">

                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={
                        confirmPassword
                      }
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Confirm your password"
                      disabled={isLoading}
                      className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) =>
                            !current,
                        )
                      }
                      className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>

                  </div>

                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={[
                  "flex h-10 w-full items-center",
                  "justify-center gap-2 rounded-lg",
                  "text-xs font-medium text-white",
                  "shadow-lg transition",
                  "hover:brightness-110",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-60",
                  isBlue
                    ? [
                        "bg-gradient-to-r",
                        "from-blue-500 to-blue-600",
                        "shadow-blue-500/20",
                      ].join(" ")
                    : [
                        "bg-gradient-to-r",
                        "from-violet-500 to-purple-600",
                        "shadow-violet-500/20",
                      ].join(" "),
                ].join(" ")}
              >
                {isLoading && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}

                {isLogin
                  ? "Sign in"
                  : "Create an account"}

                {!isLoading &&
                  isLogin && (
                    <ArrowRight className="size-3.5" />
                  )}
              </button>

            </form>

            {/* Divider */}

            <div className="my-3 flex items-center gap-3">

              <div className="h-px flex-1 bg-border" />

              <span className="text-[10px] text-muted-foreground">
                or
              </span>

              <div className="h-px flex-1 bg-border" />

            </div>

            {/* Register */}

            <p className="text-center text-[11px] text-muted-foreground">

              {isLogin
                ? "Don't have a BillNest account?"
                : "Already have a BillNest account?"}{" "}

              <Link
                to={
                  isLogin
                    ? registerPath
                    : loginPath
                }
                className={[
                  "font-semibold hover:underline",
                  isBlue
                    ? "text-blue-500"
                    : "text-violet-500",
                ].join(" ")}
              >
                {isLogin
                  ? "Create an account"
                  : "Sign in"}
              </Link>

            </p>

            {/* Features */}

            {isLogin && (
              <div
                className={[
                  "mt-3 grid grid-cols-3 gap-1",
                  "rounded-lg border p-2",
                  isBlue
                    ? "border-blue-500/15 bg-blue-500/[0.035]"
                    : "border-violet-500/15 bg-violet-500/[0.035]",
                ].join(" ")}
              >
                {config.features.map(
                  (feature) => (
                    <div
                      key={feature}
                      className="flex items-center justify-center gap-1.5"
                    >
                      <span
                        className={[
                          "flex size-4 shrink-0",
                          "items-center justify-center",
                          "rounded-full text-white",
                          isBlue
                            ? "bg-blue-500"
                            : "bg-violet-500",
                        ].join(" ")}
                      >
                        <Check className="size-2" />
                      </span>

                      <span className="text-center text-[8px] text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}

          </section>

          <p className="mt-2 text-center text-[8px] text-muted-foreground">
            © 2026 BillNest. All rights reserved.
          </p>

        </div>
      </div>
    </main>
  );
}