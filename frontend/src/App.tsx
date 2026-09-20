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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[600px] w-[850px] -translate-x-1/2 rounded-full bg-blue-500/[0.025] blur-[150px] dark:bg-blue-500/[0.08]" />

        <div className="absolute right-[-180px] top-[500px] h-[500px] w-[500px] rounded-full bg-violet-500/[0.02] blur-[150px] dark:bg-violet-500/[0.06]" />
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="flex h-[64px] items-center justify-between border-b border-border">
          <button
            type="button"
            onClick={() => scrollTo("top")}
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20">
              <span className="text-[18px] font-bold">B</span>
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

        {/* =====================================================
            HERO
        ===================================================== */}

        <section id="top" className="relative pt-7">
          <div className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-blue-600/[0.04] blur-[120px] dark:bg-blue-600/[0.10]" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-500">
              <Sparkles className="size-[14px]" />
              Every bill. One organized home.
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1.02fr_.98fr]">
              <div>
                <h1 className="max-w-[650px] text-[39px] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[46px]">
                  Billing and warranty
                  <br />
                  management,
                  <span className="text-blue-500">
                    {" "}beautifully simple.
                  </span>
                </h1>

                <p className="mt-4 max-w-[620px] text-[14px] leading-6 text-muted-foreground">
                  BillNest helps businesses manage invoices and
                  customers while giving customers one place to
                  keep purchases, bills, and warranties.
                </p>
              </div>

              <div className="hidden justify-end lg:flex">
                <div className="relative mr-8 mt-0 rotate-[-5deg] text-center text-[13px] font-medium italic leading-4 text-blue-500">
                  <span className="block">Organize today</span>
                  <span className="block">for a worry-free</span>
                  <span className="block">tomorrow.</span>

                  <div className="absolute -bottom-7 left-1/2 h-10 w-20 -translate-x-1/2 rotate-[20deg] border-b border-l border-blue-500" />
                </div>
              </div>
            </div>

            {/* =================================================
                ACCOUNT CARDS
            ================================================= */}

            <div
              id="account-type"
              className="mt-4 grid gap-4 lg:grid-cols-2"
            >
              {/* SHOPKEEPER */}

              <div className="group relative overflow-hidden rounded-xl border border-blue-500/80 bg-blue-50 p-4 shadow-[0_0_45px_rgba(0,109,255,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(0,109,255,0.12)] dark:bg-[#061526]">
                <div className="pointer-events-none absolute -bottom-24 right-4 h-56 w-56 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/15" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                      <Store className="size-[22px]" />
                    </div>

                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-white">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                    For businesses
                  </p>

                  <h2 className="mt-1 text-[17px] font-bold">
                    Shopkeeper
                  </h2>

                  <p className="mt-1 max-w-[310px] text-[11px] leading-5 text-muted-foreground">
                    Manage your business, customers, invoices and
                    warranties from one place.
                  </p>

                  <div className="mt-3 space-y-1.5">
                    {[
                      "Create & manage invoices",
                      "Manage customer records",
                      "Track product warranties",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <span className="flex size-[16px] items-center justify-center rounded-full bg-blue-500 text-white">
                          <Check className="size-[9px]" />
                        </span>

                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/shopkeeper/login")}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[11px] font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:bg-blue-600"
                  >
                    Sign in as Shopkeeper
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* CUSTOMER */}

              <div className="group relative overflow-hidden rounded-xl border border-violet-500/80 bg-violet-50 p-4 shadow-[0_0_45px_rgba(124,40,255,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_55px_rgba(124,40,255,0.12)] dark:bg-[#11091f]">
                <div className="pointer-events-none absolute -bottom-24 right-4 h-56 w-56 rounded-full bg-violet-500/10 blur-[70px] dark:bg-violet-500/15" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
                      <UserRound className="size-[22px]" />
                    </div>

                    <div className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-white">
                      <ArrowRight className="size-4" />
                    </div>
                  </div>

                  <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                    For individuals
                  </p>

                  <h2 className="mt-1 text-[17px] font-bold">
                    Customer
                  </h2>

                  <p className="mt-1 max-w-[310px] text-[11px] leading-5 text-muted-foreground">
                    Keep your purchases, invoices and product
                    warranties organized.
                  </p>

                  <div className="mt-3 space-y-1.5">
                    {[
                      "Track your purchases",
                      "Access digital invoices",
                      "View warranty details",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <span className="flex size-[16px] items-center justify-center rounded-full bg-violet-500 text-white">
                          <Check className="size-[9px]" />
                        </span>

                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/customer/login")}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-[11px] font-semibold text-white shadow-lg shadow-violet-500/15 transition hover:bg-violet-600"
                  >
                    Sign in as Customer
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ===================================================== */}

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
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-500 dark:bg-blue-500/10">
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

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

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
                  <div key={step.number} className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-full border border-blue-500 bg-blue-50 text-[13px] font-bold dark:bg-blue-500/10">
                        {step.number}
                      </div>

                      <div className="hidden h-px flex-1 border-t border-dashed border-blue-500/40 sm:block" />
                    </div>

                    <div className="mt-2 flex gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500 dark:bg-blue-500/10">
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

        {/* =====================================================
            DETAIL CARDS
            FIXED HEIGHT
            ===================================================== */}

        <section className="grid gap-4 lg:grid-cols-2">

          {/* ===================================================
              SHOPKEEPER DETAIL CARD
          =================================================== */}

          <div className="relative h-[365px] overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-50 dark:border-blue-400/20 dark:bg-[#071525]">

            <div className="pointer-events-none absolute bottom-[-70px] right-[-60px] h-56 w-56 rounded-full bg-blue-500/10 blur-[70px] dark:bg-blue-500/15" />

            <div className="relative h-full px-7 pt-6">

              {/* LABEL */}

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500 dark:text-blue-400">
                For shopkeepers
              </p>

              {/* TITLE */}

              <h2 className="mt-2 max-w-[390px] text-[27px] font-bold leading-[1.02] tracking-[-0.025em] text-slate-950 dark:text-white">
                Run your billing
                <br />
                without the clutter.
              </h2>

              {/* DESCRIPTION */}

              <p className="mt-3 max-w-[510px] text-[11px] leading-[1.65] text-slate-600 dark:text-slate-400">
                BillNest gives shopkeepers a central place to manage
                invoices, customers and warranties without keeping
                everything scattered across notebooks, files and
                messages.
              </p>

              {/* =================================================
                  CHECKLIST
                  IMPORTANT:
                  compact spacing so all 4 stay above button
              ================================================= */}

              <div className="mt-3 space-y-1">
                {[
                  "Create professional invoices",
                  "Manage customer records",
                  "Track product warranties",
                  "Grow your business",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex h-[27px] items-center gap-3 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400">
                      <Check className="size-3.5" />
                    </span>

                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* =================================================
                  LEARN MORE
                  FIXED BOTTOM POSITION
                  DOES NOT OVERLAP CHECKLIST
              ================================================= */}

              <button
                type="button"
                onClick={() => navigate("/shopkeeper/learn-more")}
                className="absolute bottom-5 left-7 z-30 inline-flex h-[46px] items-center gap-3 rounded-xl bg-blue-100 px-5 text-[14px] font-medium text-blue-500 transition hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25"
              >
                Learn more
                <ArrowRight className="size-4" />
              </button>

              {/* =================================================
                  INVOICE IMAGE
                  COMPLETELY INSIDE CARD
              ================================================= */}

              <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden h-[105px] w-[170px] sm:block">

                {/* BACK PAPER */}

                <div className="absolute bottom-0 left-0 h-[78px] w-[60px] rotate-[-10deg] rounded-lg border border-slate-300 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">

                  <div className="h-1.5 w-7 rounded-full bg-blue-500" />

                  <div className="mt-3 space-y-1.5">
                    <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-1 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-1 w-3/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-1 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>

                {/* MAIN INVOICE */}

                <div className="absolute bottom-0 right-0 h-[105px] w-[112px] rotate-[-6deg] rounded-lg border border-slate-300 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-950">

                  <p className="text-[7px] font-bold text-slate-800 dark:text-white">
                    Create Invoice
                  </p>

                  <div className="mt-2 space-y-1">
                    {[
                      "Customer Name",
                      "Product / Item",
                      "Quantity",
                      "Amount",
                    ].map((field) => (
                      <div
                        key={field}
                        className="rounded bg-slate-100 px-1.5 py-1 text-[5px] text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      >
                        {field}
                      </div>
                    ))}
                  </div>

                  <div className="mt-1.5 rounded bg-blue-500 py-1 text-center text-[5px] font-bold text-white">
                    Generate Invoice
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              CUSTOMER DETAIL CARD
          =================================================== */}

          <div className="relative h-[365px] overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-50 dark:border-violet-400/20 dark:bg-[#130b24]">

            <div className="pointer-events-none absolute bottom-[-70px] right-[-60px] h-56 w-56 rounded-full bg-violet-500/10 blur-[70px] dark:bg-violet-500/15" />

            <div className="relative h-full px-7 pt-6">

              {/* LABEL */}

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500 dark:text-violet-400">
                For customers
              </p>

              {/* TITLE */}

              <h2 className="mt-2 max-w-[420px] text-[27px] font-bold leading-[1.02] tracking-[-0.025em] text-slate-950 dark:text-white">
                Keep every purchase
                <br />
                within reach.
              </h2>

              {/* DESCRIPTION */}

              <p className="mt-3 max-w-[510px] text-[11px] leading-[1.65] text-slate-600 dark:text-slate-400">
                Instead of searching through old messages or paper
                bills, keep your purchase information and warranties
                organized in BillNest.
              </p>

              {/* CHECKLIST */}

              <div className="mt-3 space-y-1">
                {[
                  "Access digital invoices",
                  "View warranty details",
                  "Get expiry reminders",
                  "All your purchases in one place",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex h-[27px] items-center gap-3 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400">
                      <Check className="size-3.5" />
                    </span>

                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* LEARN MORE */}

              <button
                type="button"
                onClick={() => navigate("/customer/learn-more")}
                className="absolute bottom-5 left-7 z-30 inline-flex h-[46px] items-center gap-3 rounded-xl bg-violet-100 px-5 text-[14px] font-medium text-violet-500 transition hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:hover:bg-violet-500/25"
              >
                Learn more
                <ArrowRight className="size-4" />
              </button>

              {/* =================================================
                  PURCHASE IMAGE
                  COMPLETELY INSIDE CARD
              ================================================= */}

              <div className="pointer-events-none absolute bottom-4 right-5 z-10 hidden h-[108px] w-[170px] sm:block">

                <div className="absolute bottom-0 right-0 h-[108px] w-[135px] rotate-[-6deg] rounded-lg border border-violet-200 bg-white p-2.5 shadow-xl dark:border-violet-900 dark:bg-slate-950">

                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3 text-violet-500" />

                    <span className="text-[7px] font-bold text-slate-800 dark:text-white">
                      My Purchases
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {[
                      "iPhone 15",
                      "Dell Laptop",
                      "Samsung TV",
                    ].map((product) => (
                      <div
                        key={product}
                        className="flex items-center gap-1.5 rounded-md bg-violet-50 p-1 dark:bg-violet-500/[0.08]"
                      >
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-violet-100 text-violet-500 dark:bg-violet-500/15">
                          <Monitor className="size-3" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[6px] font-bold text-slate-800 dark:text-white">
                            {product}
                          </p>

                          <p className="text-[4.5px] text-slate-400">
                            Purchased recently
                          </p>

                          <p className="text-[4.5px] text-violet-500">
                            Warranty active
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            WHY BILLNEST
        ===================================================== */}

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
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-500 dark:bg-blue-500/10">
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

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="relative overflow-hidden rounded-xl border border-blue-500/40 bg-blue-50 px-4 py-4 dark:bg-[#06204b]">
          <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-96 rotate-[-15deg] border-t border-blue-400/30 bg-blue-500/5" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden size-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30 sm:flex">
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
              onClick={() => scrollTo("account-type")}
              className="hidden shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-[10px] font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 sm:inline-flex"
            >
              Get started now
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer id="contact" className="mt-4">
          <div className="border-t border-border py-4">
            <div className="grid gap-6 sm:grid-cols-[1.3fr_1fr_1fr]">

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500 text-slate-950">
                    <span className="text-[18px] font-bold">
                      B
                    </span>
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
            <span>© 2026 BillNest. All rights reserved.</span>

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