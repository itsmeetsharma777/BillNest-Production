import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  FileText,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
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
    icon: FileText,
    title: "Invoice Management",
    description:
      "Create and manage professional invoices while keeping every transaction connected to the right customer.",
  },
  {
    icon: Users,
    title: "Customer Records",
    description:
      "Maintain customer information and connect it with their purchase and billing history.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty Tracking",
    description:
      "Attach warranty information to purchases so important warranty details are easier to find.",
  },
  {
    icon: WalletCards,
    title: "Payment Tracking",
    description:
      "Keep track of invoice payment information and outstanding amounts.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Stay informed about important billing, warranty and account-related activity.",
  },
  {
    icon: BarChart3,
    title: "Business Insights",
    description:
      "Use organized dashboard information and reports to understand your business records.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Set up your Shopkeeper account and enter your business workspace.",
  },
  {
    number: "02",
    title: "Add customers",
    description:
      "Create customer records so their information can stay connected to purchases.",
  },
  {
    number: "03",
    title: "Create invoices",
    description:
      "Generate and manage invoices for your customers.",
  },
  {
    number: "04",
    title: "Add warranty details",
    description:
      "Connect warranty information with the appropriate purchase.",
  },
  {
    number: "05",
    title: "Manage everything",
    description:
      "Use your workspace to keep billing and customer records organized.",
  },
];

export default function ShopkeeperLearnMorePage() {
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
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
                href="#workflow"
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

          <div className="pointer-events-none absolute -right-20 top-0 size-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">

            <div>

              <Badge>
                <Store className="mr-1.5 size-3.5" />
                For Shopkeepers
              </Badge>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Run your billing
                <br />
                without the{" "}
                <span className="text-primary">
                  clutter.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                BillNest gives shopkeepers one organized
                workspace for invoices, customers,
                payments and warranties.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/shopkeeper/login")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
                >
                  Sign in as Shopkeeper
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

            {/* DASHBOARD */}

            <div className="relative">

              <div className="rounded-2xl border bg-[#07101f] p-3 shadow-2xl shadow-primary/20">

                <div className="rounded-xl border border-white/10 bg-[#0b1425] p-5 text-white">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs text-white/50">
                        Shopkeeper workspace
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        Business Dashboard
                      </h2>
                    </div>

                    <Store className="size-6 text-primary" />

                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">

                    {[
                      "Invoices",
                      "Customers",
                      "Warranties",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="text-[10px] text-white/50">
                          {item}
                        </p>

                        <p className="mt-2 text-xl font-bold">
                          —
                        </p>
                      </div>
                    ))}

                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">

                    <p className="text-xs font-semibold">
                      Business activity
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="h-2 rounded bg-white/10" />
                      <div className="h-2 w-4/5 rounded bg-white/10" />
                      <div className="h-2 w-3/5 rounded bg-white/10" />
                    </div>

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

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              What you can manage
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Your business,
              <br />
              organized in one place.
            </h2>

            <p className="mt-4 text-muted-foreground">
              BillNest brings the important parts of everyday
              billing management together.
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

                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

        {/* WORKFLOW */}

        <section
          id="workflow"
          className="border-y py-16"
        >

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From customer to warranty,
              <br />
              keep everything connected.
            </h2>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-5">

            {workflow.map((step) => (
              <Card key={step.number}>

                <CardContent className="p-5">

                  <span className="text-sm font-bold text-primary">
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

        {/* CTA */}

        <section className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                BillNest for business
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Ready to organize your business?
              </h2>

              <p className="mt-2 text-muted-foreground">
                Start managing your billing and warranties
                from one place.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/shopkeeper/login")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
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