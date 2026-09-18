import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
  User,
  UserRound,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type UserRole = "shopkeeper" | "customer";

interface LocationState {
  role?: UserRole;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    (location.state as LocationState | null) ?? null;

  const [role, setRole] = useState<UserRole>(
    locationState?.role ?? "shopkeeper",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordIsStrong =
    Object.values(passwordChecks).every(Boolean);

  function handleRoleChange(
    nextRole: UserRole,
  ) {
    if (nextRole === role) {
      return;
    }

    setRole(nextRole);

    /*
     * Clear every registration field whenever
     * the account type changes.
     */
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedName = name.trim();
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedName) {
      setError("Please enter your name.");
      return;
    }

    if (!normalizedEmail) {
      setError(
        "Please enter your email address.",
      );
      return;
    }

    if (!passwordIsStrong) {
      setError(
        "Please create a stronger password using at least 8 characters, uppercase, lowercase, a number, and a special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            password,
            role,
          }),
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ??
            "Unable to create your account. Please try again.",
        );
      }

      /*
       * Return to the login page and preserve the
       * role that was just used for registration.
       */
      navigate("/register", {
        replace: true,
        state: {
          registered: true,
          email: normalizedEmail,
          role,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
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
              Start managing smarter
            </p>

            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Bring your billing, customers and warranties
              together.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
              Whether you run a business or track your
              purchases, BillNest keeps everything organized
              in one place.
            </p>

            <div className="mt-8 space-y-3 text-sm text-primary-foreground/80">
              {[
                "Professional invoice management",
                "Customer purchase history",
                "Warranty tracking",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/10">
                    <Check className="size-3.5" />
                  </span>

                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} BillNest. All
            rights reserved.
          </p>
        </section>

        {/* Registration panel */}
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
                Create your account
              </h2>

              <p className="mt-2 text-muted-foreground">
                Choose how you want to use BillNest.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Registration form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Account type */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Account type
                  </label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Select how you will use BillNest.
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

              {/* Full name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

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
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </label>

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
                    autoComplete="new-password"
                    placeholder="Create a strong password"
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

                {/* Password requirements */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs">
                  <PasswordRequirement
                    valid={passwordChecks.length}
                    text="8+ characters"
                  />

                  <PasswordRequirement
                    valid={passwordChecks.uppercase}
                    text="Uppercase"
                  />

                  <PasswordRequirement
                    valid={passwordChecks.lowercase}
                    text="Lowercase"
                  />

                  <PasswordRequirement
                    valid={passwordChecks.number}
                    text="Number"
                  />

                  <PasswordRequirement
                    valid={passwordChecks.special}
                    text="Special character"
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value,
                      )
                    }
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none"
                  >
                    {showConfirmPassword ? (
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
                    Creating account...
                  </>
                ) : (
                  `Create ${
                    role === "shopkeeper"
                      ? "Shopkeeper"
                      : "Customer"
                  } Account`
                )}
              </button>
            </form>

            {/* Back to sign in */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
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
    <div
      className={
        valid
          ? "flex items-center gap-1.5 text-primary"
          : "flex items-center gap-1.5 text-muted-foreground"
      }
    >
      <span
        className={
          valid
            ? "flex size-4 items-center justify-center rounded-full bg-primary/10"
            : "flex size-4 items-center justify-center rounded-full bg-muted"
        }
      >
        <Check className="size-2.5" />
      </span>

      {text}
    </div>
  );
}