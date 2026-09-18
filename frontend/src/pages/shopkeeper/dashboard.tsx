import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

type NotificationType =
  | "invoice_created"
  | "invoice_paid"
  | "warranty_expiring"
  | "warranty_expired"
  | "document_uploaded"
  | "system";

interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  issueDate?: string | null;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  amountDue: number;
  customer?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface DashboardActivity {
  id: string;
  type: "invoice" | "customer" | "warranty";
  action: "created";
  title: string;
  description: string;
  entityId: string;
  createdAt: string;
}

interface DashboardNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardResponse {
  success: boolean;
  data?: {
    shop?: {
      id: string;
      name: string;
    };

    period?: {
      startDate: string;
      endDate: string;
    };

    overview?: {
      totalInvoices: number;
      paidInvoices: number;
      partiallyPaidInvoices: number;
      draftInvoices: number;
      cancelledInvoices: number;
      totalSales: number;
      amountCollected: number;
      amountOutstanding: number;
      collectionRate: number;
      totalCustomers: number;
      activeCustomers: number;
    };

    warranties?: {
      total: number;
      active: number;
      expiringSoon: number;
      expired: number;
      noWarranty: number;
    };

    sales?: {
      totalSales: number;
      amountCollected: number;
      amountOutstanding: number;
      trend?: Array<{
        date: string;
        sales: number;
        invoiceCount: number;
      }>;
    };

    recentInvoices?: DashboardInvoice[];

    recentActivity?: DashboardActivity[];

    notifications?: {
      items?: DashboardNotification[];
      unreadCount?: number;
    };
  };

  message?: string;
}

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: typeof ShoppingCart;
}

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getStatusLabel(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "Paid";

    case "partially_paid":
      return "Partially Paid";

    case "cancelled":
      return "Cancelled";

    case "draft":
      return "Draft";

    default:
      return status;
  }
}

function getStatusClass(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";

    case "partially_paid":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";

    case "draft":
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

function getActivityIcon(type: DashboardActivity["type"]) {
  switch (type) {
    case "invoice":
      return FileText;

    case "customer":
      return Users;

    case "warranty":
      return ShieldCheck;

    default:
      return FileText;
  }
}

function getActivityIconClass(type: DashboardActivity["type"]) {
  switch (type) {
    case "invoice":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "customer":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "warranty":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    default:
      return "bg-primary/10 text-primary";
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "invoice_created":
      return FileText;

    case "invoice_paid":
      return Wallet;

    case "warranty_expiring":
      return ShieldCheck;

    case "warranty_expired":
      return ShieldCheck;

    case "document_uploaded":
      return FileText;

    case "system":
    default:
      return Bell;
  }
}

function getNotificationIconClass(type: NotificationType) {
  switch (type) {
    case "invoice_created":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "invoice_paid":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "warranty_expiring":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "warranty_expired":
      return "bg-red-500/10 text-red-600 dark:text-red-400";

    case "document_uploaded":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400";

    case "system":
    default:
      return "bg-primary/10 text-primary";
  }
}

function normalizeInvoice(
  invoice: DashboardInvoice,
): DashboardInvoice {
  return {
    ...invoice,
    id: invoice.id ?? "",
    invoiceNumber:
      invoice.invoiceNumber ?? "Invoice",
    total: Number(invoice.total ?? 0),
    amountPaid: Number(invoice.amountPaid ?? 0),
    amountDue: Number(invoice.amountDue ?? 0),
  };
}

export function ShopkeeperDashboard() {
  const { user } = useAuth();

  const [data, setData] =
    useState<DashboardResponse["data"] | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_URL}/dashboard`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const result =
          (await response.json()) as DashboardResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Unable to load your dashboard.",
          );
        }

        setData(result.data ?? null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your dashboard.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const overview = data?.overview;

  const warranties = data?.warranties;

  const recentInvoices = useMemo(
    () =>
      (data?.recentInvoices ?? []).map(
        normalizeInvoice,
      ),
    [data?.recentInvoices],
  );

  const recentActivity =
    data?.recentActivity ?? [];

  const notifications =
    data?.notifications?.items ?? [];

  const unreadNotificationCount =
    data?.notifications?.unreadCount ?? 0;

  const stats: StatCard[] = [
    {
      title: "Total Sales",
      value: formatCurrency(
        Number(overview?.totalSales ?? 0),
      ),
      description:
        "Sales from completed billing activity",
      icon: ShoppingCart,
    },
    {
      title: "Invoices",
      value: String(
        overview?.totalInvoices ?? 0,
      ),
      description:
        `${overview?.paidInvoices ?? 0} paid · ${
          overview?.partiallyPaidInvoices ?? 0
        } partially paid`,
      icon: FileText,
    },
    {
      title: "Customers",
      value: String(
        overview?.totalCustomers ?? 0,
      ),
      description:
        `${overview?.activeCustomers ?? 0} active customers`,
      icon: Users,
    },
    {
      title: "Active Warranties",
      value: String(
        warranties?.active ?? 0,
      ),
      description:
        `${warranties?.expiringSoon ?? 0} expiring soon`,
      icon: ShieldCheck,
    },
  ];

  const collectionRate = Number(
    overview?.collectionRate ?? 0,
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />

            <p className="text-sm font-medium">
              Loading your dashboard...
            </p>

            <p className="text-xs text-muted-foreground">
              Fetching your latest business data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </div>

            <h1 className="mt-4 text-lg font-semibold">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const greeting = getGreeting();

  const firstName =
    user?.name?.split(" ")[0] || "there";

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
              Here's an overview of your BillNest
              business and your latest activity.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              disabled={isRefreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`size-4 ${
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {isRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              to="/shopkeeper/invoices/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Create Invoice
            </Link>
          </div>
        </section>

        {/* Non-blocking error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />

            <div>
              <p className="font-medium">
                Dashboard refresh failed
              </p>

              <p className="mt-1 opacity-90">
                {error}
              </p>
            </div>
          </div>
        )}

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
                    Live
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

        {/* Financial overview */}
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  Financial overview
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Sales & collections
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current dashboard period
                </p>
              </div>

              <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
                <p className="text-xs text-muted-foreground">
                  Collection rate
                </p>

                <p className="text-lg font-bold text-primary">
                  {collectionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total sales
                </p>

                <p className="mt-2 text-lg font-bold">
                  {formatCurrency(
                    Number(
                      overview?.totalSales ?? 0,
                    ),
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Collected
                </p>

                <p className="mt-2 text-lg font-bold">
                  {formatCurrency(
                    Number(
                      overview?.amountCollected ??
                        0,
                    ),
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Outstanding
                </p>

                <p className="mt-2 text-lg font-bold">
                  {formatCurrency(
                    Number(
                      overview?.amountOutstanding ??
                        0,
                    ),
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Collection progress
                </span>

                <span className="font-medium">
                  {collectionRate.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        collectionRate,
                        0,
                      ),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Warranty overview */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  Warranty overview
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Warranty status
                </h2>
              </div>

              <ShieldCheck className="size-6 text-primary" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                  Active
                </span>

                <span className="font-semibold">
                  {warranties?.active ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                  Expiring soon
                </span>

                <span className="font-semibold">
                  {warranties?.expiringSoon ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                  Expired
                </span>

                <span className="font-semibold">
                  {warranties?.expired ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4">
                <span className="text-sm text-muted-foreground">
                  Total warranties
                </span>

                <span className="font-semibold">
                  {warranties?.total ?? 0}
                </span>
              </div>
            </div>

            <Link
              to="/shopkeeper/warranties"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Manage warranties
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
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
            <Link
              to="/shopkeeper/invoices/new"
              className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>

                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>

              <h3 className="mt-5 font-semibold">
                Create Invoice
              </h3>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Create a new customer invoice.
              </p>
            </Link>

            <Link
              to="/shopkeeper/customers"
              className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <Users className="size-5 text-foreground" />
                </div>

                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>

              <h3 className="mt-5 font-semibold">
                Add Customer
              </h3>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Save and manage customer records.
              </p>
            </Link>

            <Link
              to="/shopkeeper/warranties"
              className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <ShieldCheck className="size-5 text-foreground" />
                </div>

                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>

              <h3 className="mt-5 font-semibold">
                Manage Warranties
              </h3>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Track customer warranty records.
              </p>
            </Link>
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold tracking-tight">
                Recent activity
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Latest customers, invoices, and warranty records.
              </p>
            </div>

            <RefreshCw className="size-5 text-muted-foreground" />
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">
                No recent activity
              </h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                New customers, invoices, and warranties will appear here
                automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentActivity
                .slice(0, 8)
                .map((activity) => {
                  const Icon = getActivityIcon(
                    activity.type,
                  );

                  const iconClass =
                    getActivityIconClass(
                      activity.type,
                    );

                  const content = (
                    <div className="flex gap-3 p-4 transition-colors hover:bg-muted/40 sm:p-5">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {activity.title}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                              {activity.description}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs text-muted-foreground">
                            {formatDateTime(
                              activity.createdAt,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );

                  if (activity.type === "invoice") {
                    return (
                      <Link
                        key={activity.id}
                        to={`/shopkeeper/invoices/${activity.entityId}`}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={activity.id}>
                      {content}
                    </div>
                  );
                })}
            </div>
          )}
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

            {recentInvoices.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-medium">
                  No invoices yet
                </h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create your first invoice and
                  your recent billing activity will
                  appear here.
                </p>

                <Link
                  to="/shopkeeper/invoices/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                  Create invoice
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/shopkeeper/invoices/${invoice.id}`}
                    className="block p-5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {invoice.invoiceNumber}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              invoice.status,
                            )}`}
                          >
                            {getStatusLabel(
                              invoice.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {invoice.customer?.name ??
                            "Customer"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(
                            invoice.issueDate,
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-semibold">
                          {formatCurrency(
                            invoice.total,
                          )}
                        </p>

                        {invoice.amountDue > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Due{" "}
                            {formatCurrency(
                              invoice.amountDue,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold tracking-tight">
                    Notifications
                  </h2>

                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unreadNotificationCount}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Important updates for your business.
                </p>
              </div>

              <Bell className="size-5 text-muted-foreground" />
            </div>

            {notifications.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-medium">
                  You're all caught up
                </h3>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  New warranty reminders, invoices,
                  and account updates will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications
                  .slice(0, 5)
                  .map((notification) => {
                    const Icon =
                      getNotificationIcon(
                        notification.type,
                      );

                    const content = (
                      <div
                        className={`flex gap-3 p-4 transition-colors ${
                          notification.isRead
                            ? "opacity-70"
                            : "bg-primary/[0.03]"
                        } ${
                          notification.link
                            ? "hover:bg-muted/40"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${getNotificationIconClass(
                            notification.type,
                          )}`}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>

                            {!notification.isRead && (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>

                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {formatDateTime(
                              notification.createdAt,
                            )}
                          </p>
                        </div>
                      </div>
                    );

                    if (notification.link) {
                      return (
                        <Link
                          key={notification._id}
                          to={notification.link}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={notification._id}
                      >
                        {content}
                      </div>
                    );
                  })}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="border-t p-4">
                <Link
                  to="/shopkeeper/notifications"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  View all notifications
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Getting started */}
        {(overview?.totalInvoices ?? 0) === 0 &&
          (overview?.totalCustomers ?? 0) === 0 && (
            <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-primary">
                  Getting started
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Set up your BillNest workspace
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Start building your digital billing
                  records by adding customers and
                  creating invoices. Your dashboard
                  will automatically become more useful
                  as your business data grows.
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
          )}
      </div>
    </main>
  );
}

export default ShopkeeperDashboard;