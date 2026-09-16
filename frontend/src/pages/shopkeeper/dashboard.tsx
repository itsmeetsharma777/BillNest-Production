import {
  ArrowUpRight,
  Bell,
  FileText,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

const stats = [
  {
    title: "Total Sales",
    value: "₹0",
    description: "No sales recorded yet",
    icon: ShoppingCart,
  },
  {
    title: "Invoices",
    value: "0",
    description: "Create your first invoice",
    icon: FileText,
  },
  {
    title: "Customers",
    value: "0",
    description: "Add your first customer",
    icon: Users,
  },
  {
    title: "Active Warranties",
    value: "0",
    description: "No active warranties",
    icon: ShieldCheck,
  },
];

const quickActions = [
  {
    title: "Create Invoice",
    description: "Create a new customer invoice",
    href: "/shopkeeper/invoices/new",
    icon: FileText,
  },
  {
    title: "Add Customer",
    description: "Save a new customer record",
    href: "/shopkeeper/customers",
    icon: Users,
  },
  {
    title: "Manage Warranties",
    description: "Track customer warranties",
    href: "/shopkeeper/warranties",
    icon: ShieldCheck,
  },
];

export function ShopkeeperDashboard() {
  const { user } = useAuth();

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Shopkeeper Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}, {firstName} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Here's an overview of your BillNest business. Start by
              creating an invoice or adding a customer.
            </p>
          </div>

          <Link
            to="/shopkeeper/invoices/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Create Invoice
          </Link>
        </section>

        {/* Statistics */}
        <section
          aria-label="Business statistics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>

                  <span className="text-xs font-medium text-muted-foreground">
                    Overview
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Common tasks to manage your business.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5 text-foreground" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>

                  <h3 className="mt-5 font-semibold">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent invoices + notifications */}
        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Recent invoices */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Recent invoices
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest billing activity.
                </p>
              </div>

              <Link
                to="/shopkeeper/invoices"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                No invoices yet
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first invoice and your recent billing
                activity will appear here.
              </p>

              <Link
                to="/shopkeeper/invoices/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Plus className="size-4" />
                Create invoice
              </Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-semibold tracking-tight">
                  Notifications
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Important updates for your business.
                </p>
              </div>

              <Bell className="size-5 text-muted-foreground" />
            </div>

            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Bell className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                You're all caught up
              </h3>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                New warranty reminders, invoices, and account updates
                will appear here.
              </p>
            </div>
          </div>
        </section>

        {/* Getting started */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">
              Getting started
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Set up your BillNest workspace
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start building your digital billing records by adding
              customers and creating invoices. Your dashboard will
              automatically become more useful as your business data
              grows.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/shopkeeper/customers"
              className="rounded-xl border p-4 transition-colors hover:bg-muted"
            >
              <Users className="size-5 text-primary" />

              <p className="mt-3 text-sm font-semibold">
                Add customers
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Keep customer information organized.
              </p>
            </Link>

            <Link
              to="/shopkeeper/invoices/new"
              className="rounded-xl border p-4 transition-colors hover:bg-muted"
            >
              <FileText className="size-5 text-primary" />

              <p className="mt-3 text-sm font-semibold">
                Create an invoice
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Generate your first digital bill.
              </p>
            </Link>

            <Link
              to="/shopkeeper/warranties"
              className="rounded-xl border p-4 transition-colors hover:bg-muted"
            >
              <ShieldCheck className="size-5 text-primary" />

              <p className="mt-3 text-sm font-semibold">
                Track warranties
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Keep warranty information accessible.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ShopkeeperDashboard;