import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

interface ReportData {
  period: {
    startDate: string | null;
    endDate: string | null;
  };

  overview: {
    totalInvoices: number;
    totalSales: number;
    totalSubtotal: number;
    totalDiscount: number;
    totalTax: number;
    averageInvoice: number;
    amountCollected: number;
    amountOutstanding: number;
    collectionRate: number;
    customersWithInvoices: number;
  };

  invoices: {
    total: number;
    revenue: number;
    statusBreakdown: {
      draft: number;
      paid: number;
      partially_paid: number;
      cancelled: number;
    };
  };

  payments: Record<
    string,
    {
      count: number;
      amount: number;
    }
  >;

  warranties: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    noWarranty: number;
  };
}

interface ReportsResponse {
  success: boolean;
  data?: ReportData;
  message?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPaymentMethod(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getDefaultStartDate() {
  const date = new Date();

  date.setDate(1);

  return date.toISOString().slice(0, 10);
}

function getDefaultEndDate() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function ReportsPage() {
  const [report, setReport] =
    useState<ReportData | null>(null);

  const [startDate, setStartDate] = useState(
    getDefaultStartDate,
  );

  const [endDate, setEndDate] = useState(
    getDefaultEndDate,
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set(
          "endDate",
          `${endDate}T23:59:59.999`,
        );
      }

      const response = await fetch(
        `${API_URL}/reports?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as ReportsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Failed to load reports.",
        );
      }

      setReport(result.data ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentRows = useMemo(() => {
    if (!report) {
      return [];
    }

    return Object.entries(
      report.payments,
    ).sort(
      ([, first], [, second]) =>
        second.amount - first.amount,
    );
  }, [report]);

  function handleApplyFilter(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setError(
        "Start date cannot be after end date.",
      );
      return;
    }

    void loadReports();
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" />
            Business Analytics
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Reports
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Understand your sales, payments, customers
            and warranties.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Date filter */}
      <form
        onSubmit={handleApplyFilter}
        className="rounded-2xl border bg-card p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />

          <h2 className="text-sm font-semibold">
            Report Period
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Start date
            </label>

            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="report-end-date"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              End date
            </label>

            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(
                  event.target.value,
                )
              }
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-10 self-end rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadReports()}
            className="w-fit rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Generating your reports...
            </p>
          </div>
        </div>
      ) : !report ? (
        <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border bg-card text-center">
          <BarChart3 className="size-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold">
            No report data
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Try refreshing the report.
          </p>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Sales"
              value={formatCurrency(
                report.overview.totalSales,
              )}
              subtitle={`${report.overview.totalInvoices} revenue invoices`}
              icon={CircleDollarSign}
            />

            <MetricCard
              title="Amount Collected"
              value={formatCurrency(
                report.overview.amountCollected,
              )}
              subtitle={`${report.overview.collectionRate}% collection rate`}
              icon={TrendingUp}
            />

            <MetricCard
              title="Outstanding"
              value={formatCurrency(
                report.overview.amountOutstanding,
              )}
              subtitle="Amount still due"
              icon={CircleDollarSign}
            />

            <MetricCard
              title="Customers"
              value={String(
                report.overview
                  .customersWithInvoices,
              )}
              subtitle="Customers with invoices"
              icon={Users}
            />
          </div>

          {/* Sales details */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Sales Overview
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Revenue breakdown for the selected
                    period.
                  </p>
                </div>

                <CircleDollarSign className="size-5 text-primary" />
              </div>

              <div className="space-y-1">
                <ReportRow
                  label="Subtotal"
                  value={formatCurrency(
                    report.overview
                      .totalSubtotal,
                  )}
                />

                <ReportRow
                  label="Discount"
                  value={formatCurrency(
                    report.overview
                      .totalDiscount,
                  )}
                />

                <ReportRow
                  label="Tax"
                  value={formatCurrency(
                    report.overview.totalTax,
                  )}
                />

                <div className="my-3 border-t" />

                <ReportRow
                  label="Total Sales"
                  value={formatCurrency(
                    report.overview.totalSales,
                  )}
                  strong
                />

                <ReportRow
                  label="Average Invoice"
                  value={formatCurrency(
                    report.overview
                      .averageInvoice,
                  )}
                />
              </div>
            </section>

            {/* Invoice status */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Invoice Status
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Invoice count by status.
                  </p>
                </div>

                <FileText className="size-5 text-primary" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatusCard
                  label="Paid"
                  value={
                    report.invoices
                      .statusBreakdown
                      .paid
                  }
                />

                <StatusCard
                  label="Partially Paid"
                  value={
                    report.invoices
                      .statusBreakdown
                      .partially_paid
                  }
                />

                <StatusCard
                  label="Draft"
                  value={
                    report.invoices
                      .statusBreakdown
                      .draft
                  }
                />

                <StatusCard
                  label="Cancelled"
                  value={
                    report.invoices
                      .statusBreakdown
                      .cancelled
                  }
                />
              </div>
            </section>
          </div>

          {/* Payments + warranties */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Payments */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Payment Methods
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Collected amount by payment method.
                  </p>
                </div>

                <CircleDollarSign className="size-5 text-primary" />
              </div>

              {paymentRows.length === 0 ? (
                <EmptySection message="No payment data for this period." />
              ) : (
                <div className="space-y-3">
                  {paymentRows.map(
                    ([method, data]) => {
                      const percentage =
                        report.overview
                          .amountCollected >
                        0
                          ? Math.round(
                              (data.amount /
                                report
                                  .overview
                                  .amountCollected) *
                                100,
                            )
                          : 0;

                      return (
                        <div
                          key={method}
                          className="rounded-xl bg-muted/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {formatPaymentMethod(
                                  method,
                                )}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {data.count} invoice
                                {data.count === 1
                                  ? ""
                                  : "s"}
                              </p>
                            </div>

                            <p className="text-sm font-semibold">
                              {formatCurrency(
                                data.amount,
                              )}
                            </p>
                          </div>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            {/* Warranties */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Warranty Overview
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Current warranty status across your
                    shop.
                  </p>
                </div>

                <ShieldCheck className="size-5 text-primary" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatusCard
                  label="Total"
                  value={
                    report.warranties.total
                  }
                />

                <StatusCard
                  label="Active"
                  value={
                    report.warranties.active
                  }
                />

                <StatusCard
                  label="Expiring Soon"
                  value={
                    report.warranties
                      .expiringSoon
                  }
                />

                <StatusCard
                  label="Expired"
                  value={
                    report.warranties.expired
                  }
                />
              </div>

              <div className="mt-3 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    No Warranty
                  </span>

                  <span className="text-sm font-semibold">
                    {report.warranties
                      .noWarranty}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Collection summary */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold">
                Collection Summary
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Money collected compared with total
                revenue.
              </p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(
                      report.overview
                        .collectionRate,
                      0,
                    ),
                    100,
                  )}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">
                {formatCurrency(
                  report.overview
                    .amountCollected,
                )}{" "}
                collected
              </span>

              <span className="font-medium">
                {report.overview
                  .collectionRate}
                %
              </span>

              <span className="text-muted-foreground">
                {formatCurrency(
                  report.overview
                    .amountOutstanding,
                )}{" "}
                outstanding
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function ReportRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span
        className={
          strong
            ? "text-sm font-semibold"
            : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-sm font-bold"
            : "text-sm font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function EmptySection({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl bg-muted/40 px-4 text-center">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}