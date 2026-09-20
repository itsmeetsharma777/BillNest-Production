import {
  BadgeCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/common/theme-selector";

function App() {
  const navigate = useNavigate();

  function scrollToAccountType() {
    document
      .getElementById("account-type")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <FileText className="size-5" />
              </div>

              <span className="text-xl font-bold tracking-tight">
                BillNest
              </span>
            </div>

            <Badge variant="secondary">
              Production UI Foundation
            </Badge>
          </div>

          <ThemeSelector />
        </header>

        <Separator className="my-8" />

        {/* Hero */}
        <section className="py-10">
          <div className="max-w-4xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Every bill. One organized home.
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Billing and warranty management,
              <span className="text-primary">
                {" "}
                beautifully simple.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              BillNest helps businesses manage invoices and
              customers while giving customers one place to
              keep purchases, bills, and warranties.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                type="button"
                onClick={scrollToAccountType}
              >
                Get started
              </Button>

              <Button
                size="lg"
                variant="outline"
                type="button"
                onClick={() => navigate("/explore")}
              >
                Explore BillNest
              </Button>
            </div>
          </div>
        </section>

        {/* Account type */}
        <section
          id="account-type"
          className="scroll-mt-10 py-8"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight">
              Choose your account type
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select how you want to use BillNest.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Shopkeeper */}
            <button
              type="button"
              onClick={() =>
                navigate("/shopkeeper/login")
              }
              className="group text-left"
            >
              <Card className="h-full border-2 border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary group-hover:bg-primary/5 group-hover:shadow-lg">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                      <Store className="size-7" />
                    </div>

                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  <CardTitle className="mt-5 text-2xl">
                    Shopkeeper
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <p className="max-w-md leading-7 text-muted-foreground">
                    Manage your business, customers,
                    invoices and warranties.
                  </p>

                  <div className="mt-5 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    Business account
                  </div>
                </CardContent>
              </Card>
            </button>

            {/* Customer */}
            <button
              type="button"
              onClick={() =>
                navigate("/customer/login")
              }
              className="group text-left"
            >
              <Card className="h-full border-2 border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary group-hover:bg-primary/5 group-hover:shadow-lg">
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UserRound className="size-7" />
                    </div>

                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>

                  <CardTitle className="mt-5 text-2xl">
                    Customer
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <p className="max-w-md leading-7 text-muted-foreground">
                    Track your purchases, invoices and
                    product warranties.
                  </p>

                  <div className="mt-5 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    Personal account
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-5 py-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>

              <CardTitle>Smart Billing</CardTitle>

              <p className="text-sm leading-6 text-muted-foreground">
                Create professional invoices quickly and
                keep every transaction organized.
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>

              <CardTitle>Customer Records</CardTitle>

              <p className="text-sm leading-6 text-muted-foreground">
                Keep customer information and purchase
                history connected to every invoice.
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <CardTitle>Warranty Tracking</CardTitle>

              <p className="text-sm leading-6 text-muted-foreground">
                Keep warranty information attached to
                purchases and never lose track of expiry
                dates.
              </p>
            </CardHeader>
          </Card>
        </section>

        {/* Design system status */}
        <section className="mt-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-primary" />

                <h2 className="font-semibold">
                  Design system ready
                </h2>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Theme, typography, colors and reusable
                components are now ready for BillNest.
              </p>
            </div>

            <Badge>
              Foundation v1
            </Badge>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;