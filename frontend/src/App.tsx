import {
  ArrowRight,
  Check,
  Cloud,
  FileText,
  Heart,
  Mail,
  Monitor,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ThemeSelector } from "@/components/common/theme-selector";

type RoleCardProps = {
  role: "shopkeeper" | "customer";
  title: string;
  description: string;
  features: string[];
  onClick: () => void;
};

function ShopkeeperIllustration() {
  return (
    <div className="relative h-full w-full">
      {/* Store */}
      <div className="absolute bottom-0 left-5 h-[55px] w-[92px] rounded-b-lg bg-blue-600 shadow-lg shadow-blue-500/20">
        <div className="absolute left-[-4px] top-[-14px] h-[25px] w-[100px] overflow-hidden rounded-t-lg bg-blue-400">
          <div className="flex h-full">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-full flex-1 skew-x-[-15deg] border-r border-blue-700/20 bg-blue-300"
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-[36px] h-[37px] w-[27px] rounded-t-md bg-blue-800/70" />

        <div className="absolute bottom-[17px] left-[57px] size-1 rounded-full bg-blue-200" />
      </div>

      {/* Invoice */}
      <div className="absolute bottom-2 right-0 h-[72px] w-[49px] rotate-[4deg] rounded-md bg-card p-2 shadow-xl ring-1 ring-border">
        <div className="h-1.5 w-6 rounded bg-blue-500" />
        <div className="mt-3 h-1 w-7 rounded bg-muted" />
        <div className="mt-2 h-1 w-6 rounded bg-muted" />
        <div className="mt-2 h-1 w-4 rounded bg-muted" />
      </div>
    </div>
  );
}

function CustomerIllustration() {
  return (
    <div className="relative h-full w-full">
      {/* Shopping bag */}
      <div className="absolute bottom-0 right-[23px] h-[76px] w-[65px] rounded-b-xl rounded-t-md bg-violet-600 shadow-xl shadow-violet-500/20">
        <div className="absolute left-[13px] top-[-14px] h-[25px] w-[39px] rounded-t-full border-4 border-violet-400 border-b-0" />
      </div>

      {/* Invoice */}
      <div className="absolute bottom-0 right-[-2px] h-[64px] w-[46px] rotate-[5deg] rounded bg-card p-2 shadow-xl ring-1 ring-border">
        <div className="h-1.5 w-6 rounded bg-violet-500" />
        <div className="mt-3 h-1 w-7 rounded bg-muted" />
        <div className="mt-2 h-1 w-5 rounded bg-muted" />
      </div>

      {/* Warranty badge */}
      <div className="absolute bottom-[-2px] right-[-9px] flex size-8 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
        <ShieldCheck className="size-4" />
      </div>
    </div>
  );
}

function RoleCard({
  role,
  title,
  description,
  features,
  onClick,
}: RoleCardProps) {
  const isShopkeeper = role === "shopkeeper";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group block h-[300px] w-full text-left"
    >
      <div
        className={[
          "relative h-full overflow-hidden rounded-xl border p-4",
          "transition-all duration-300",
          "hover:-translate-y-1",
          isShopkeeper
            ? "border-blue-500/70 bg-blue-500/[0.025] shadow-[0_0_40px_rgba(37,99,235,0.04)] hover:shadow-[0_0_50px_rgba(37,99,235,0.12)] dark:bg-blue-950/20"
            : "border-violet-500/70 bg-violet-500/[0.025] shadow-[0_0_40px_rgba(124,58,237,0.04)] hover:shadow-[0_0_50px_rgba(124,58,237,0.12)] dark:bg-violet-950/20",
        ].join(" ")}
      >
        {/* Glow */}
        <div
          className={[
            "pointer-events-none absolute bottom-[-90px] right-[-50px] size-[230px] rounded-full blur-[80px]",
            isShopkeeper ? "bg-blue-500/10" : "bg-violet-500/10",
          ].join(" ")}
        />

        <div className="relative z-10 h-full">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div
              className={[
                "flex size-11 items-center justify-center rounded-xl text-white shadow-lg",
                isShopkeeper
                  ? "bg-blue-500 shadow-blue-500/20"
                  : "bg-violet-500 shadow-violet-500/20",
              ].join(" ")}
            >
              {isShopkeeper ? (
                <Store className="size-6" />
              ) : (
                <UserRound className="size-6" />
              )}
            </div>

            <span
              className={[
                "flex size-8 items-center justify-center rounded-full text-white",
                isShopkeeper ? "bg-blue-500" : "bg-violet-500",
              ].join(" ")}
            >
              <ArrowRight className="size-4" />
            </span>
          </div>

          {/* Label */}
          <p
            className={[
              "mt-3 text-[9px] font-bold uppercase tracking-[0.2em]",
              isShopkeeper ? "text-blue-500" : "text-violet-500",
            ].join(" ")}
          >
            {isShopkeeper ? "For businesses" : "For individuals"}
          </p>

          {/* Title */}
          <h2 className="mt-1 text-[17px] font-bold">
            {title}
          </h2>

          {/* Description */}
          <p className="mt-1 max-w-[310px] text-[11px] leading-5 text-muted-foreground">
            {description}
          </p>

          {/* Features */}
          <div className="mt-3 space-y-1.5">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-[10px]"
              >
                <span
                  className={[
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-white",
                    isShopkeeper ? "bg-blue-500" : "bg-violet-500",
                  ].join(" ")}
                >
                  <Check className="size-2.5" />
                </span>

                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Login button */}
          <div
            className={[
              "absolute bottom-0 left-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-semibold text-white shadow-lg",
              isShopkeeper
                ? "bg-blue-500 shadow-blue-500/15"
                : "bg-violet-500 shadow-violet-500/15",
            ].join(" ")}
          >
            {isShopkeeper
              ? "Sign in as Shopkeeper"
              : "Sign in as Customer"}

            <ArrowRight className="size-3" />
          </div>

          {/* Illustration */}
          <div className="absolute bottom-[-2px] right-[-2px] h-[105px] w-[150px]">
            {isShopkeeper ? (
              <ShopkeeperIllustration />
            ) : (
              <CustomerIllustration />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-[350px] rotate-[-3deg]">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-blue-500/10">
        {/* Browser bar */}
        <div className="flex h-7 items-center justify-between border-b border-border px-3">
          <div className="flex gap-1">
            <span className="size-1.5 rounded-full bg-red-400" />
            <span className="size-1.5 rounded-full bg-yellow-400" />
            <span className="size-1.5 rounded-full bg-green-400" />
          </div>

          <span className="text-[5px] text-muted-foreground">
            billnest.app/dashboard
          </span>
        </div>

        <div className="grid grid-cols-[65px_1fr]">
          {/* Sidebar */}
          <div className="border-r border-border bg-muted/30 p-2">
            <div className="mb-4 flex items-center gap-1">
              <span className="flex size-4 items-center justify-center rounded bg-blue-500 text-[7px] font-bold text-white">
                B
              </span>

              <span className="text-[5px] font-semibold">
                BillNest
              </span>
            </div>

            {[
              "Dashboard",
              "Invoices",
              "Customers",
              "Products",
              "Warranties",
            ].map((item, index) => (
              <div
                key={item}
                className={[
                  "mb-1 rounded px-1.5 py-1 text-[5px]",
                  index === 0
                    ? "bg-blue-500/10 text-blue-500"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="bg-background/70 p-2.5">
            <p className="text-[7px] font-bold">
              Dashboard
            </p>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                ["Total Invoices", "248"],
                ["Customers", "186"],
                ["Warranties", "94"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded border border-border bg-card p-1.5"
                >
                  <p className="text-[4px] text-muted-foreground">
                    {label}
                  </p>

                  <p className="mt-1 text-[9px] font-bold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2 rounded border border-border bg-card p-2">
              <p className="text-[5px] font-semibold">
                Recent Invoices
              </p>

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="mt-1 flex items-center justify-between border-b border-border pb-1 text-[4px] text-muted-foreground"
                >
                  <span>
                    INV-{1020 + item}
                  </span>

                  <span>
                    ₹{item * 2450}
                  </span>

                  <span className="rounded bg-green-500/10 px-1 text-green-600 dark:text-green-400">
                    Paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/[0.04] blur-[150px] dark:bg-blue-500/[0.08]" />

        <div className="absolute right-[-250px] top-[20%] size-[500px] rounded-full bg-blue-600/[0.025] blur-[140px] dark:bg-blue-600/[0.06]" />

        <div className="absolute bottom-[-200px] left-[-200px] size-[500px] rounded-full bg-violet-600/[0.025] blur-[140px] dark:bg-violet-600/[0.05]" />
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
        {/* HEADER */}
        <header className="flex h-[64px] items-center justify-between border-b border-border">
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-blue-500 text-[18px] font-bold text-slate-950 shadow-lg shadow-blue-500/20">
              B
            </div>

            <span className="text-[17px] font-bold tracking-tight">
              BillNest
            </span>
          </button>

          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-7 text-[12px] text-muted-foreground md:flex">
              <button
                type="button"
                onClick={() => scrollTo("features")}
                className="transition hover:text-foreground"
              >
                Features
              </button>

              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="transition hover:text-foreground"
              >
                How it works
              </button>

              <button
                type="button"
                onClick={() => scrollTo("about")}
                className="transition hover:text-foreground"
              >
                About
              </button>

              <button
                type="button"
                onClick={() => scrollTo("contact")}
                className="transition hover:text-foreground"
              >
                Contact
              </button>
            </nav>

            <div className="rounded-xl border border-border bg-card">
              <ThemeSelector />
            </div>
          </div>
        </header>

        {/* HERO */}
        <section id="top" className="relative pt-7">
          <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="pt-2">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500">
                <Sparkles className="size-3.5" />
                Every bill. One organized home.
              </div>

              <h1 className="max-w-[620px] text-[38px] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[45px]">
                Billing and warranty
                <br />
                management,
                <span className="text-blue-500">
                  {" "}
                  beautifully simple.
                </span>
              </h1>

              <p className="mt-4 max-w-[590px] text-[13px] leading-6 text-muted-foreground">
                BillNest helps businesses manage invoices and
                customers while giving customers one place to
                keep purchases, bills, and warranties.
              </p>
            </div>

            {/* Dashboard */}
            <div className="relative hidden h-[190px] lg:block">
              <div className="absolute left-2 top-4 rotate-[-6deg] text-center text-[11px] italic leading-4 text-blue-500">
                <span className="block">Organize today</span>
                <span className="block">for a worry-free</span>
                <span className="block">tomorrow.</span>

                <div className="absolute -bottom-6 left-1/2 h-8 w-14 -translate-x-1/2 rotate-[20deg] border-b border-l border-blue-500" />
              </div>

              <div className="absolute right-0 top-1">
                <DashboardMockup />
              </div>
            </div>
          </div>

          {/* ROLE CARDS */}
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <RoleCard
              role="shopkeeper"
              title="Shopkeeper"
              description="Manage your business, customers, invoices and warranties from one place."
              features={[
                "Create & manage invoices",
                "Manage customer records",
                "Track product warranties",
              ]}
              onClick={() =>
                navigate("/shopkeeper/login")
              }
            />

            <RoleCard
              role="customer"
              title="Customer"
              description="Keep your purchases, invoices and product warranties organized."
              features={[
                "Track your purchases",
                "Access digital invoices",
                "View warranty details",
              ]}
              onClick={() =>
                navigate("/customer/login")
              }
            />
          </div>
        </section>

        {/* FEATURE STRIP */}
        <section
          id="features"
          className="mt-6 border-y border-border py-3"
        >
          <div className="grid grid-cols-2 divide-x divide-border lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Smart Billing",
                text: "Create professional invoices in seconds.",
              },
              {
                icon: Users,
                title: "Customer Management",
                text: "Keep customer records well organized.",
              },
              {
                icon: ShieldCheck,
                title: "Warranty Tracking",
                text: "Store warranty details and get expiry reminders.",
              },
              {
                icon: Cloud,
                title: "Secure & Accessible",
                text: "Your important data, anytime, anywhere.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 px-3 py-2.5 lg:px-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Icon className="size-[19px]" />
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold">
                      {item.title}
                    </h3>

                    <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-7">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500">
                How it works
              </p>

              <h2 className="mt-2 text-[24px] font-bold leading-[1.1]">
                Get started in
                <br />
                just{" "}
                <span className="text-blue-500">
                  3 simple steps.
                </span>
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Choose your role",
                  text: "Sign in as Shopkeeper or Customer.",
                  icon: UserRound,
                },
                {
                  number: "02",
                  title: "Login securely",
                  text: "Access your personalized dashboard.",
                  icon: ShieldCheck,
                },
                {
                  number: "03",
                  title: "Start managing",
                  text: "Keep everything organized in one place.",
                  icon: Sparkles,
                },
              ].map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.number}>
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-full border border-blue-500 bg-blue-500/5 text-[13px] font-bold text-blue-500">
                        {step.number}
                      </div>

                      <div className="hidden h-px flex-1 border-t border-dashed border-blue-500/40 sm:block" />
                    </div>

                    <div className="mt-2 flex gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Icon className="size-4" />
                      </div>

                      <div>
                        <h3 className="text-[11px] font-semibold">
                          {step.title}
                        </h3>

                        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* DETAIL PANELS */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* SHOPKEEPER */}
          <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/[0.025] p-4 dark:bg-blue-950/15">
            <div className="absolute bottom-[-100px] right-[-70px] size-64 rounded-full bg-blue-500/10 blur-[70px]" />

            <div className="relative z-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500">
                For shopkeepers
              </p>

              <h2 className="mt-2 text-[22px] font-bold leading-[1.05]">
                Run your billing
                <br />
                without the clutter.
              </h2>

              <p className="mt-3 max-w-[270px] text-[10px] leading-5 text-muted-foreground">
                BillNest gives shopkeepers a central place to
                manage invoices, customers and warranties
                without keeping everything scattered across
                notebooks, files and messages.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  "Create professional invoices",
                  "Manage customer records",
                  "Track product warranties",
                  "Grow your business",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                      <Check className="size-3" />
                    </span>

                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/shopkeeper/learn-more")
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3.5 py-2 text-[10px] font-semibold text-blue-500 transition hover:bg-blue-500/15"
              >
                Learn more
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="absolute bottom-4 right-3 hidden rotate-[-7deg] md:block">
              <div className="relative h-[185px] w-[190px]">
                <div className="absolute left-0 top-7 h-[140px] w-[95px] rotate-[-5deg] rounded-lg bg-card p-3 shadow-2xl ring-1 ring-border">
                  <div className="h-2 w-8 rounded bg-blue-500" />

                  <div className="mt-4 h-1.5 w-14 rounded bg-muted" />
                  <div className="mt-2 h-1.5 w-16 rounded bg-muted" />
                  <div className="mt-2 h-1.5 w-11 rounded bg-muted" />

                  <div className="mt-5 space-y-1">
                    <div className="h-1 rounded bg-muted" />
                    <div className="h-1 rounded bg-muted" />
                    <div className="h-1 w-4/5 rounded bg-muted" />
                  </div>
                </div>

                <div className="absolute right-0 top-0 h-[165px] w-[145px] rounded-xl border border-blue-500/30 bg-card p-3 shadow-2xl">
                  <p className="text-[8px] font-medium">
                    Create Invoice
                  </p>

                  {[
                    "Customer Name",
                    "Product / Item",
                    "Quantity",
                    "Amount",
                  ].map((item) => (
                    <div
                      key={item}
                      className="mt-2 rounded bg-muted px-2 py-1.5 text-[7px] text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}

                  <div className="mt-3 rounded bg-blue-500 py-1.5 text-center text-[7px] font-semibold text-white">
                    Generate Invoice
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER */}
          <div className="relative min-h-[300px] overflow-hidden rounded-xl border border-violet-500/20 bg-violet-500/[0.025] p-4 dark:bg-violet-950/15">
            <div className="absolute bottom-[-100px] right-[-70px] size-64 rounded-full bg-violet-500/10 blur-[70px]" />

            <div className="relative z-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-500">
                For customers
              </p>

              <h2 className="mt-2 text-[22px] font-bold leading-[1.05]">
                Keep every purchase
                <br />
                within reach.
              </h2>

              <p className="mt-3 max-w-[270px] text-[10px] leading-5 text-muted-foreground">
                Instead of searching through old messages or
                paper bills, keep your purchase information
                and warranties organized in BillNest.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "Access digital invoices",
                  "View warranty details",
                  "Get expiry reminders",
                  "All your purchases in one place",
                  
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                      <Check className="size-3" />
                    </span>

                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer/learn-more")
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-500/10 px-3.5 py-2 text-[10px] font-semibold text-violet-500 transition hover:bg-violet-500/15"
              >
                Learn more
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="absolute bottom-3 right-2 hidden md:block">
              <div className="w-[165px] rotate-[-5deg] rounded-xl border border-violet-500/20 bg-card p-3 shadow-2xl">
                <div className="flex items-center gap-2 text-[8px] font-semibold">
                  <UserRound className="size-3 text-violet-500" />
                  My Purchases
                </div>

                {[
                  "iPhone 15",
                  "Dell Laptop",
                  "Samsung TV",
                ].map((item) => (
                  <div
                    key={item}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                  >
                    <div className="flex size-8 items-center justify-center rounded bg-violet-500/10 text-violet-500">
                      <Monitor className="size-3.5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-semibold">
                        {item}
                      </p>

                      <p className="text-[6px] text-muted-foreground">
                        Purchased recently
                      </p>

                      <p className="text-[6px] text-violet-500">
                        Warranty active
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY BILLNEST */}
        <section id="about" className="py-7">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500">
                Why BillNest
              </p>

              <h2 className="mt-2 text-[25px] font-bold">
                More than just billing.
              </h2>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Built to make everyday management simple,
                secure and stress-free.
              </p>
            </div>

            <div className="hidden rotate-[-5deg] text-right text-[15px] italic leading-4 text-blue-500 sm:block">
              <div>Small bills.</div>
              <div>Big peace of mind.</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: "Saves Time",
                text: "Get things done faster with a clean and simple interface.",
              },
              {
                icon: ShieldCheck,
                title: "Never Lose Track",
                text: "Keep all warranty information in one place.",
              },
              {
                icon: Monitor,
                title: "Access Anywhere",
                text: "Your data is available whenever you need it.",
              },
              {
                icon: Heart,
                title: "Built for Real People",
                text: "Simple, clean and easy to use.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon className="size-4" />
                  </div>

                  <h3 className="mt-3 text-[11px] font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-xl border border-blue-500/40 bg-blue-500/[0.06] px-4 py-4 dark:bg-blue-950/30">
          <div className="absolute right-[-60px] top-[-80px] h-[200px] w-[500px] rotate-[-15deg] border-t border-blue-500/20 bg-blue-500/[0.04]" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden size-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 sm:flex">
                <FileText className="size-6" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-500">
                  BillNest
                </p>

                <h2 className="mt-1 text-[17px] font-bold">
                  Ready to take control of your bills and warranties?
                </h2>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  Join now and experience a simpler, smarter way
                  to stay organized.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/get-started")}
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 sm:inline-flex"
            >
              Get started now
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="contact" className="mt-4">
          <div className="border-t border-border py-4">
            <div className="grid gap-6 sm:grid-cols-[1.3fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-slate-950">
                    B
                  </div>

                  <div>
                    <p className="text-[13px] font-bold">
                      BillNest
                    </p>

                    <p className="text-[8px] text-muted-foreground">
                      Every bill. One organized home.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[9px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => scrollTo("features")}
                  className="text-left hover:text-foreground"
                >
                  Features
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("how-it-works")}
                  className="text-left hover:text-foreground"
                >
                  How it works
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("about")}
                  className="text-left hover:text-foreground"
                >
                  About
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo("contact")}
                  className="text-left hover:text-foreground"
                >
                  Contact
                </button>
              </div>

              <div className="border-l border-border pl-5">
                <p className="text-[8px] text-muted-foreground">
                  Developed by
                </p>

                <p className="mt-1 text-[11px] font-semibold">
                  Meet Sharma
                </p>

                <a
                  href="mailto:itsmeetsharma@gmail.com"
                  className="mt-1 flex items-center gap-1.5 text-[8px] text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-3" />
                  itsmeetsharma@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border py-3 text-[8px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              © 2026 BillNest. All rights reserved.
            </span>

            <span>
              Built with ❤️ by Meet Sharma
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default App;