import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number &&
    passwordChecks.special;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!token) {
        if (isMounted) {
          setTokenError(
            "This password reset link is missing a valid token.",
          );
          setIsValidating(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/validate-reset-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "This password reset link is invalid or has expired.",
          );
        }

        if (isMounted) {
          setIsTokenValid(true);
        }
      } catch (requestError) {
        if (isMounted) {
          setTokenError(
            requestError instanceof Error
              ? requestError.message
              : "This password reset link is invalid or has expired.",
          );
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    void validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!isPasswordValid) {
      setError(
        "Please make sure your password meets all the requirements.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to reset your password. Please try again.",
        );
      }

      setIsSuccess(true);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isValidating) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />

          <div>
            <h1 className="text-lg font-semibold">
              Verifying reset link
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isTokenValid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <section className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-7 text-destructive" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Reset link unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {tokenError}
            </p>

            <div className="mt-6 space-y-3">
              <Link
                to="/forgot-password"
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Request a new reset link
              </Link>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <section className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Password reset successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your password has been changed successfully.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting you to the login page...
            </p>

            <Loader2 className="mx-auto mt-6 size-5 animate-spin text-primary" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>

          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="size-7 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Create a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose a strong password to secure your BillNest account.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                New password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your new password"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-medium text-foreground">
                Password must contain:
              </p>

              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <PasswordRequirement
                  valid={passwordChecks.length}
                  text="At least 8 characters"
                />

                <PasswordRequirement
                  valid={passwordChecks.uppercase}
                  text="One uppercase letter"
                />

                <PasswordRequirement
                  valid={passwordChecks.lowercase}
                  text="One lowercase letter"
                />

                <PasswordRequirement
                  valid={passwordChecks.number}
                  text="One number"
                />

                <PasswordRequirement
                  valid={passwordChecks.special}
                  text="One special character"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium"
              >
                Confirm new password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your new password"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs ${
                    passwordsMatch
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !isPasswordValid ||
                !passwordsMatch
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {isSubmitting
                ? "Resetting password..."
                : "Reset password"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            For your security, all existing BillNest sessions will be
            signed out after your password is changed.
          </p>
        </div>
      </section>
    </main>
  );
}

function PasswordRequirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-4 items-center justify-center rounded-full text-[10px] ${
          valid
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {valid ? "✓" : "•"}
      </span>

      <span
        className={
          valid
            ? "text-foreground"
            : "text-muted-foreground"
        }
      >
        {text}
      </span>
    </div>
  );
}