import {
  BadgeCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  Users,
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

function App() {
  const navigate = useNavigate();

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
          <div className="max-w-3xl">
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
              BillNest helps businesses manage invoices and customers while
              giving customers one place to keep purchases, bills, and
              warranties.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                type="button"
                onClick={() => navigate("/register")}
              >
                Get started
              </Button>

              <Button
                size="lg"
                variant="outline"
                type="button"
                onClick={() => navigate("/login")}
              >
                Explore BillNest
              </Button>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>

              <CardTitle>Smart Billing</CardTitle>

              <CardDescription>
                Create professional invoices quickly and keep every
                transaction organized.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Badge variant="secondary">
                Shopkeepers
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>

              <CardTitle>Customer Records</CardTitle>

              <CardDescription>
                Keep customer information and purchase history connected to
                every invoice.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Badge variant="secondary">
                Organized
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <CardTitle>Warranty Tracking</CardTitle>

              <CardDescription>
                Keep warranty information attached to purchases and never
                lose track of expiry dates.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Badge variant="secondary">
                Secure
              </Badge>
            </CardContent>
          </Card>
        </section>

        {/* Design system status */}
        <section className="mt-10 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-primary" />

                <h2 className="font-semibold">
                  Design system ready
                </h2>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Theme, typography, colors and reusable components are now
                ready for the rest of BillNest.
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