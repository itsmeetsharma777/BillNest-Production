import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  FileText,
  FolderOpen,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/common/theme-selector";

const features = [
  {
    icon: Receipt,
    title: "Purchase Records",
    description:
      "Keep your purchase information organized instead of searching through old bills and messages.",
  },
  {
    icon: FileText,
    title: "Digital Invoices",
    description:
      "Keep your invoices connected to the purchases they belong to.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty Details",
    description:
      "Keep warranty information connected to your products and purchases.",
  },
  {
    icon: Bell,
    title: "Important Updates",
    description:
      "Stay informed about relevant billing, warranty and account activity.",
  },
  {
    icon: FolderOpen,
    title: "Documents",
    description:
      "Keep important purchase-related documents organized in one place.",
  },
  {
    icon: UserRound,
    title: "Personal Workspace",
    description:
      "Access your customer information through your own BillNest account.",
  },
];

const journey = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Create your personal BillNest account.",
  },
  {
    number: "02",
    title: "Connect purchases",
    description:
      "Keep your purchase information organized.",
  },
  {
    number: "03",
    title: "Access invoices",
    description:
      "Find your digital billing information when needed.",
  },
  {
    number: "04",
    title: "Track warranties",
    description:
      "Keep warranty information connected to purchases.",
  },
];

export default function CustomerLearnMorePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">

      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-7 lg:px-10">

        {/* HEADER */}

        <header className="flex items-center justify-between">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-3"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <FileText className="size-5" />
            </div>

            <span className="text-xl font-bold">
              BillNest
            </span>
          </button>

          <div className="flex items-center gap-5">

            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">

              <a
                href="#features"
                className="hover:text-foreground"
              >
                Features
              </a>

              <a
                href="#journey"
                className="hover:text-foreground"
              >
                How it works
              </a>

            </nav>

            <ThemeSelector />

          </div>

        </header>

        <Separator className="mt-5" />

        {/* HERO */}

        <section className="relative overflow-hidden py-16 lg:py-20">

          <div className="pointer-events-none absolute -left-20 top-0 size-96 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">

            <div>

              <Badge className="bg-violet-600 text-white hover:bg-violet-600">
                <UserRound className="mr-1.5 size-3.5" />
                For Customers
              </Badge>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Keep every purchase
                <br />
                within{" "}
                <span className="text-violet-500">
                  reach.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                BillNest gives customers one organized
                place to keep purchase information,
                invoices and product warranties.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/customer/login")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5"
                >
                  Sign in as Customer
                  <ArrowRight className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-muted"
                >
                  <ArrowLeft className="size-4" />
                  Back to BillNest
                </button>

              </div>

            </div>

            {/* CUSTOMER PREVIEW */}

            <div>

              <div className="rounded-2xl border bg-[#0c0920] p-3 shadow-2xl shadow-violet-500/20">

                <div className="rounded-xl border border-white/10 bg-[#120e25] p-5 text-white">

                  <div className="flex items-center gap-4">

                    <div className="flex size-12 items-center justify-center rounded-xl bg-violet-600">
                      <UserRound className="size-6" />
                    </div>

                    <div>

                      <p className="text-xs text-white/50">
                        Customer workspace
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        My Purchases
                      </h2>

                    </div>

                  </div>

                  <div className="mt-6 space-y-3">

                    {[
                      "Purchase information",
                      "Digital invoice",
                      "Warranty details",
                    ].map((item) => (

                      <div
                        key={item}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                            <Check className="size-4" />
                          </div>

                          <span className="text-sm">
                            {item}
                          </span>

                        </div>

                        <ArrowRight className="size-4 text-white/40" />

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* FEATURES */}

        <section
          id="features"
          className="py-16"
        >

          <div className="max-w-2xl">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
              Your personal workspace
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Your purchases,
              <br />
              <span className="text-violet-500">
                organized.
              </span>
            </h2>

            <p className="mt-4 text-muted-foreground">
              BillNest helps turn scattered purchase
              information into an organized digital record.
            </p>

          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="transition-all hover:-translate-y-1 hover:shadow-lg"
                >

                  <CardHeader>

                    <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                      <Icon className="size-5" />
                    </div>

                    <CardTitle className="mt-2">
                      {feature.title}
                    </CardTitle>

                  </CardHeader>

                  <CardContent>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>

                  </CardContent>

                </Card>
              );
            })}

          </div>

        </section>

        {/* JOURNEY */}

        <section
          id="journey"
          className="border-y py-16"
        >

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
              Your BillNest journey
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Keep your records
              <br />
              simple and accessible.
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">

            {journey.map((step) => (

              <Card key={step.number}>

                <CardContent className="p-5">

                  <span className="text-sm font-bold text-violet-500">
                    {step.number}
                  </span>

                  <h3 className="mt-4 font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>

                </CardContent>

              </Card>

            ))}

          </div>

        </section>

        {/* WHAT YOU GET */}

        <section className="py-16">

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                Less searching
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Know where your important
                <br />
                purchase information is.
              </h2>

              <p className="mt-5 leading-7 text-muted-foreground">
                Instead of relying on paper receipts,
                old messages or scattered files, BillNest
                gives you a focused place for information
                connected to your purchases.
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {[
                "Purchase history",
                "Digital invoices",
                "Warranty information",
                "Product records",
                "Important updates",
                "Organized documents",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border p-4"
                >

                  <div className="flex size-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                    <Check className="size-4" />
                  </div>

                  <span className="text-sm font-medium">
                    {item}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* CTA */}

        <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card p-8 sm:p-10">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                BillNest for customers
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Keep your purchases close.
              </h2>

              <p className="mt-2 text-muted-foreground">
                Your bills and warranty information,
                organized in one place.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/customer/login")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/20"
            >
              Get started
              <ArrowRight className="size-4" />
            </button>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="mt-10 border-t py-6 text-sm text-muted-foreground">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <span>
              © 2026 BillNest
            </span>

            <span>
              Developed by Meet Sharma
            </span>

          </div>

        </footer>

      </div>

    </main>
  );
}