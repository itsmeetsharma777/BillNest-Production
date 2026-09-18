import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  FolderOpen,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/common/theme-selector";

const features = [
  {
    icon: Receipt,
    title: "Invoice Management",
    description:
      "Create, manage, track and organize invoices from one central workspace.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Maintain customer records and connect customer information with their billing history.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty Tracking",
    description:
      "Keep warranty details connected to purchases and stay aware of warranty status and expiry dates.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed about important billing, warranty and account-related updates.",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Keep important business and customer documents organized and accessible.",
  },
  {
    icon: BarChart3,
    title: "Reports & Insights",
    description:
      "View useful business information through organized reports and dashboard summaries.",
  },
  {
    icon: WalletCards,
    title: "Payment Tracking",
    description:
      "Track invoice payments, collected amounts and outstanding balances.",
  },
  {
    icon: LockKeyhole,
    title: "Secure Authentication",
    description:
      "Protected accounts, sessions and password recovery help keep business data secure.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Set up your BillNest account and access your business workspace.",
  },
  {
    number: "02",
    title: "Add customers",
    description:
      "Create customer records so purchases and invoices stay connected.",
  },
  {
    number: "03",
    title: "Create invoices",
    description:
      "Generate digital invoices and keep track of payment information.",
  },
  {
    number: "04",
    title: "Track warranties",
    description:
      "Attach warranty information to purchases and keep expiry details organized.",
  },
  {
    number: "05",
    title: "Monitor your business",
    description:
      "Use the dashboard, notifications and reports to keep everything under control.",
  },
];

function ExplorePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex w-fit items-center gap-3"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <FileText className="size-5" />
            </div>

            <div className="text-left">
              <p className="text-lg font-bold tracking-tight">
                BillNest
              </p>

              <p className="text-xs text-muted-foreground">
                Billing made simple
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <ThemeSelector />

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </header>

        <Separator className="my-8" />

        {/* Hero */}
        <section className="py-10 text-center sm:py-14">
          <Badge variant="secondary">
            <Sparkles className="mr-1.5 size-3.5" />
            Explore BillNest
          </Badge>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Everything you need to keep your
            <span className="text-primary">
              {" "}
              billing organized.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            BillNest brings invoices, customers, payments, warranties,
            documents, notifications and business insights together in one
            organized platform.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              type="button"
              onClick={() => navigate("/login")}
            >
              Get started
              <ArrowRight className="size-4" />
            </Button>

            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={() => navigate("/register")}
            >
              Create account
            </Button>
          </div>
        </section>

        {/* What is BillNest */}
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Badge variant="secondary">
                About BillNest
              </Badge>

              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                One organized home for your business records.
              </h2>

              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                BillNest is designed to simplify the everyday work involved
                in billing and customer management. Instead of keeping
                invoices, customer details and warranty information
                scattered across different places, BillNest connects them
                inside one workspace.
              </p>

              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Shopkeepers can manage their business records while
                customers can have a connected place for their purchases,
                bills and warranties.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                "Digital invoice management",
                "Connected customer records",
                "Warranty lifecycle tracking",
                "Business dashboard and reports",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border bg-background p-4"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-primary" />

                  <span className="text-sm font-medium">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">
              Features
            </Badge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything connected in one place.
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              BillNest is built around the core records and workflows that
              businesses need to manage their billing operations.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>

                    <CardTitle className="text-base">
                      {feature.title}
                    </CardTitle>

                    <CardDescription className="leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary">
              How it works
            </Badge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              A simple workflow from bill to warranty.
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              BillNest keeps the important parts of your business workflow
              connected from the beginning.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {workflow.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <span className="text-sm font-bold text-primary">
                  {step.number}
                </span>

                <h3 className="mt-4 font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Shopkeeper + Customer */}
        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="p-6 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>

              <CardTitle className="mt-2 text-xl">
                For Shopkeepers
              </CardTitle>

              <CardDescription className="text-sm leading-6">
                Manage the business side of billing, customers, invoices,
                warranties and reports from one workspace.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="space-y-3">
                {[
                  "Manage customers",
                  "Create and track invoices",
                  "Track payments",
                  "Manage warranties",
                  "View business reports",
                  "Receive important notifications",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="size-4 text-primary" />

                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-6 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Receipt className="size-5" />
              </div>

              <CardTitle className="mt-2 text-xl">
                For Customers
              </CardTitle>

              <CardDescription className="text-sm leading-6">
                Keep purchases, invoices and warranty information connected
                and easier to access.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="space-y-3">
                {[
                  "Access purchase information",
                  "Keep bills organized",
                  "View warranty details",
                  "Stay informed about updates",
                  "Access connected documents",
                  "Keep records in one place",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="size-4 text-primary" />

                    <span className="text-sm text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security */}
        <section className="mt-16 rounded-3xl border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <LockKeyhole className="size-5 text-primary" />

                <p className="text-sm font-semibold text-primary">
                  Built with security in mind
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Your business records deserve a secure home.
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                BillNest uses authenticated access and protected application
                workflows to keep business and customer information separated
                and accessible according to the user's role.
              </p>
            </div>

            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-8" />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 rounded-3xl border bg-primary p-6 text-primary-foreground shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium opacity-80">
                Ready to get organized?
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Bring your billing, customers and warranties together.
              </h2>

              <p className="mt-3 text-sm leading-6 opacity-80 sm:text-base">
                Start using BillNest and keep your business records in one
                organized place.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={() => navigate("/register")}
              >
                Create account
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BillNest
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </button>
        </footer>
      </div>
    </main>
  );
}

export default ExplorePage;