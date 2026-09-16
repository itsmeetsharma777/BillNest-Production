import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to process your request. Please try again.",
        );
      }

      setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <section className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-7 text-primary" />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Check your email
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                If an account exists for{" "}
                <span className="font-medium text-foreground">
                  {email}
                </span>
                , we've sent you a password reset link.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                The link will expire in 30 minutes.
              </p>
            </div>

            <div className="mt-6 rounded-xl border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try
                again with the same email address.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setError("");
              }}
              className="mt-6 w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Try another email
            </button>

            <Link
              to="/login"
              className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to login
            </Link>
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
            <Mail className="size-7 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Forgot your password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter your email address and we'll send you a secure link
            to reset your password.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
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
              disabled={isSubmitting || !email.trim()}
              className="h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}