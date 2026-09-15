import {
  ArrowUpRight,
  CircleDollarSign,
  FileText,
  PackageCheck,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

const stats = [
  {
    label: "Total Revenue",
    value: "₹0",
    description: "This month",
    icon: CircleDollarSign,
  },
  {
    label: "Invoices",
    value: "0",
    description: "This month",
    icon: FileText,
  },
  {
    label: "Customers",
    value: "0",
    description: "Total customers",
    icon: Users,
  },
  {
    label: "Warranties",
    value: "0",
    description: "Active warranties",
    icon: PackageCheck,
  },
];

export function ShopkeeperDashboard() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section>
          <p className="text-sm font-medium text-primary">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Good evening 👋
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Here's what's happening with your business.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>

                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>

                <p className="mt-5 text-sm text-muted-foreground">
                  {stat.label}
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Recent invoices</h2>

            <div className="flex min-h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No invoices yet.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Warranty overview</h2>

            <div className="flex min-h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No warranty records yet.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}