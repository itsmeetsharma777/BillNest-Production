import {
  ArrowRight,
  Check,
  Store,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import BillNestLogo from "@/components/branding/BillNestLogo";
import { ThemeSelector } from "@/components/common/theme-selector";

type AccountCardProps = {
  type: "customer" | "shopkeeper";
  onClick: () => void;
};

function AccountCard({
  type,
  onClick,
}: AccountCardProps) {
  const isCustomer = type === "customer";

  const title = isCustomer
    ? "Customer"
    : "Shopkeeper";

  const description = isCustomer
    ? "Sign in to your customer account and keep all your purchases, invoices and warranties in one place."
    : "Sign in to your shopkeeper account and manage your business, customers, invoices and warranties easily.";

  const features = isCustomer
    ? [
        "Track purchases",
        "Digital invoices",
        "Warranty details",
      ]
    : [
        "Create invoices",
        "Manage customers",
        "Track warranties",
      ];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left"
    >
      <div
        className={[
          "relative min-h-[410px] overflow-hidden rounded-2xl border bg-card p-6",
          "transition-all duration-300 hover:-translate-y-1",
          isCustomer
            ? "border-violet-500/70 shadow-[0_20px_60px_rgba(124,58,237,0.05)] hover:shadow-[0_25px_70px_rgba(124,58,237,0.12)]"
            : "border-blue-500/70 shadow-[0_20px_60px_rgba(37,99,235,0.05)] hover:shadow-[0_25px_70px_rgba(37,99,235,0.12)]",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-none absolute bottom-[-130px] size-[350px] rounded-full blur-[110px]",
            isCustomer
              ? "left-[-80px] bg-violet-600/10"
              : "right-[-80px] bg-blue-600/10",
          ].join(" ")}
        />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div
              className={[
                "flex size-14 items-center justify-center rounded-xl text-white shadow-xl",
                isCustomer
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20"
                  : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20",
              ].join(" ")}
            >
              {isCustomer ? (
                <UserRound className="size-7" />
              ) : (
                <Store className="size-7" />
              )}
            </div>

            <span
              className={[
                "rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]",
                isCustomer
                  ? "border-violet-500/60 bg-violet-500/[0.06] text-violet-500"
                  : "border-blue-500/60 bg-blue-500/[0.06] text-blue-500",
              ].join(" ")}
            >
              {title}
            </span>
          </div>

          <h1 className="mt-5 text-[25px] font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 max-w-[390px] text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>

          <div className="mt-5 grid gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium">
                Email address
              </p>

              <div className="flex h-11 items-center rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">
                <span
                  className={[
                    "mr-2 font-semibold",
                    isCustomer
                      ? "text-violet-500"
                      : "text-blue-500",
                  ].join(" ")}
                >
                  @
                </span>

                you@example.com
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium">
                  Password
                </p>

                <span
                  className={[
                    "text-xs",
                    isCustomer
                      ? "text-violet-500"
                      : "text-blue-500",
                  ].join(" ")}
                >
                  Forgot password?
                </span>
              </div>

              <div className="flex h-11 items-center rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">
                <span
                  className={[
                    "mr-2",
                    isCustomer
                      ? "text-violet-500"
                      : "text-blue-500",
                  ].join(" ")}
                >
                  ●
                </span>

                Enter your password

                <span className="ml-auto text-muted-foreground">
                  ◉
                </span>
              </div>
            </div>

            <div
              className={[
                "flex h-11 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-lg",
                isCustomer
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 shadow-violet-500/20"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20",
              ].join(" ")}
            >
              Sign in

              <ArrowRight className="ml-2 size-3.5" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />

            <span className="text-xs text-muted-foreground">
              or
            </span>

            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Don't have a BillNest account?{" "}

            <span
              className={[
                "font-semibold",
                isCustomer
                  ? "text-violet-500"
                  : "text-blue-500",
              ].join(" ")}
            >
              Create an account
            </span>
          </p>

          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-muted/30 p-2.5">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-center gap-1.5 text-[9px]"
              >
                <span
                  className={[
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                    isCustomer
                      ? "bg-violet-500"
                      : "bg-blue-500",
                  ].join(" ")}
                >
                  <Check className="size-2.5" />
                </span>

                <span className="text-muted-foreground">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function GetStartedPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[20%] top-[20%] size-[400px] rounded-full bg-violet-600/[0.035] blur-[130px] dark:bg-violet-600/[0.09]" />

        <div className="absolute right-[15%] top-[25%] size-[400px] rounded-full bg-blue-600/[0.035] blur-[130px] dark:bg-blue-600/[0.09]" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1100px] items-center px-5 py-8 sm:px-7">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center"
              aria-label="Go to BillNest home"
            >
              <BillNestLogo
                variant="full"
                size={82}
                className="h-[82px] w-[82px]"
              />
            </button>

            <div className="rounded-xl border border-border bg-card">
              <ThemeSelector />
            </div>
          </div>

          {/* Choose account */}
          <div className="mt-6 flex items-center justify-center gap-5">
            <div className="hidden h-px w-[100px] bg-border sm:block" />

            <p className="text-sm font-medium text-muted-foreground">
              Choose your account
            </p>

            <div className="hidden h-px w-[100px] bg-border sm:block" />
          </div>

          {/* Cards */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <AccountCard
              type="customer"
              onClick={() =>
                navigate("/customer/login")
              }
            />

            <AccountCard
              type="shopkeeper"
              onClick={() =>
                navigate("/shopkeeper/login")
              }
            />
          </div>

          {/* Back */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              ← Back to BillNest
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}