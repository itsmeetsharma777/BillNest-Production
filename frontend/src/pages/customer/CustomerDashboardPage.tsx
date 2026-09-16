import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  IndianRupee,
  Receipt,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

interface DashboardInvoice {
  _id: string;
  invoiceNumber: string;
  issueDate: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
}

interface DashboardWarranty {
  _id: string;
  productName: string;
  expiryDate: string;
  status: string;
  warrantyPeriodMonths: number;
}

interface DashboardResponse {
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  shop?: {
    name?: string;
    phone?: string;
    email?: string;
  } | null;
  summary: {
    invoices: {
      total: number;
      totalSpent: number;
      totalPaid: number;
      totalDue: number;
    };
    warranties: {
      total: number;
      active: number;
      expiringSoon: number;
      expired: number;
    };
  };
  recentInvoices: DashboardInvoice[];
  upcomingWarranties: DashboardWarranty[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "partially_paid":
      return "Partially Paid";
    case "cancelled":
      return "Cancelled";
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "expiring_soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    case "no_warranty":
      return "No Warranty";
    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "paid":
    case "active":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400";

    case "expiring_soon":
    case "partially_paid":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400";

    case "expired":
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400";

    default:
      return "";
  }
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/customer/dashboard`, {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ?? "Unable to load your dashboard.",
          );
        }

        if (mounted) {
          setData(result?.data ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your dashboard.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card className="border-destructive/30">
          <CardContent className="p-6">
            <p className="font-medium">Unable to load dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const invoiceSummary = data.summary.invoices;
  const warrantySummary = data.summary.warranties;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-4">
              Customer Portal
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {data.customer.name.split(" ")[0]} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Keep track of your purchases, invoices and warranties in one
              place.
            </p>
          </div>

          {data.shop?.name && (
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="size-5" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Your store
                </p>
                <p className="font-semibold">{data.shop.name}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>

            <p className="mt-5 text-2xl font-bold">
              {invoiceSummary.total}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Total invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IndianRupee className="size-5" />
            </div>

            <p className="mt-5 text-2xl font-bold">
              {formatCurrency(invoiceSummary.totalSpent)}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Total purchase value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>

            <p className="mt-5 text-2xl font-bold">
              {formatCurrency(invoiceSummary.totalDue)}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Amount still due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <p className="mt-5 text-2xl font-bold">
              {warrantySummary.active}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Active warranties
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent purchases</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest invoices and transactions.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = "/customer/invoices";
              }}
            >
              View all
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardHeader>

          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No purchases yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your invoices will appear here when you make a purchase.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.recentInvoices.map((invoice, index) => (
                  <div key={invoice._id}>
                    <Link
                      to={`/customer/invoices/${invoice._id}`}
                      className="flex flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Receipt className="size-4" />
                        </div>

                        <div>
                          <p className="font-medium">
                            {invoice.invoiceNumber}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatDate(invoice.issueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <p className="font-semibold">
                          {formatCurrency(invoice.total)}
                        </p>

                        <Badge
                          variant="outline"
                          className={getStatusClass(invoice.status)}
                        >
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </div>
                    </Link>

                    {index < data.recentInvoices.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Warranty overview</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep an eye on your product coverage.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.location.href = "/customer/warranties";
              }}
            >
              View all
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <CheckCircle2 className="mx-auto size-5 text-primary" />

                <p className="mt-2 text-xl font-bold">
                  {warrantySummary.active}
                </p>

                <p className="text-xs text-muted-foreground">
                  Active
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <CalendarClock className="mx-auto size-5 text-primary" />

                <p className="mt-2 text-xl font-bold">
                  {warrantySummary.expiringSoon}
                </p>

                <p className="text-xs text-muted-foreground">
                  Expiring
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <ShieldCheck className="mx-auto size-5 text-primary" />

                <p className="mt-2 text-xl font-bold">
                  {warrantySummary.expired}
                </p>

                <p className="text-xs text-muted-foreground">
                  Expired
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            {data.upcomingWarranties.length === 0 ? (
              <div className="py-5 text-center">
                <ShieldCheck className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-2 text-sm font-medium">
                  No upcoming warranties
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingWarranties.slice(0, 4).map((warranty) => (
                  <Link
                    key={warranty._id}
                    to={`/customer/warranties/${warranty._id}`}
                    className="block rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {warranty.productName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Expires {formatDate(warranty.expiryDate)}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={getStatusClass(warranty.status)}
                      >
                        {getStatusLabel(warranty.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}