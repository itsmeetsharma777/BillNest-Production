import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

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
    paymentCount: number;
  };

  invoices: {
    total: number;
    draft: number;
    paid: number;
    partiallyPaid: number;
    cancelled: number;
  };

  payments: {
    totalCollected: number;
    paymentCount: number;
    byMethod: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  };

  trends: {
    sales: Array<{
      date: string;
      sales: number;
      invoices: number;
    }>;

    payments: Array<{
      date: string;
      amount: number;
      payments: number;
    }>;
  };

  topProducts: Array<{
    id: string | null;
    productName: string;
    sku: string | null;
    quantity: number;
    revenue: number;
  }>;

  topCustomers: Array<{
    id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    totalPurchases: number;
    invoiceCount: number;
    totalPaid: number;
    totalDue: number;
  }>;

  outstandingInvoices: Array<{
    id: string | null;
    invoiceNumber: string;
    customerName: string;
    issueDate: string | null;
    dueDate: string | null;
    status: string;
    total: number;
    amountPaid: number;
    amountDue: number;
  }>;

  warranties: {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    noWarranty: number;
  };

  inventory: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalStockUnits: number;
    lowStockProducts: number;
    outOfStockProducts: number;
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
  }).format(Number(value) || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value) || 0,
  );
}

function formatPaymentMethod(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string | null) {
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

function formatShortDate(value: string) {
  const date = new Date(
    `${value}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
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

function getStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
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

      const params =
        new URLSearchParams();

      if (startDate) {
        params.set(
          "startDate",
          startDate,
        );
      }

      if (endDate) {
        params.set(
          "endDate",
          `${endDate}T23:59:59.999`,
        );
      }

      const response =
        await fetch(
          `${API_URL}/reports?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

      let result:
        | ReportsResponse
        | null = null;

      try {
        result =
          (await response.json()) as ReportsResponse;
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success ||
        !result.data
      ) {
        throw new Error(
          result?.message ??
            `Failed to load reports (${response.status}).`,
        );
      }

      setReport(result.data);
    } catch (requestError) {
      setReport(null);

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

    // Initial load only.
    // Filters are applied manually with the Apply button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const maxSales = useMemo(() => {
    if (
      !report ||
      report.trends.sales.length === 0
    ) {
      return 1;
    }

    return Math.max(
      ...report.trends.sales.map(
        (item) => item.sales,
      ),
      1,
    );
  }, [report]);

  const maxPayment = useMemo(() => {
    if (
      !report ||
      report.trends.payments.length === 0
    ) {
      return 1;
    }

    return Math.max(
      ...report.trends.payments.map(
        (item) => item.amount,
      ),
      1,
    );
  }, [report]);

  const maxProductRevenue =
    useMemo(() => {
      if (
        !report ||
        report.topProducts.length === 0
      ) {
        return 1;
      }

      return Math.max(
        ...report.topProducts.map(
          (item) => item.revenue,
        ),
        1,
      );
    }, [report]);

  const maxCustomerPurchases =
    useMemo(() => {
      if (
        !report ||
        report.topCustomers.length === 0
      ) {
        return 1;
      }

      return Math.max(
        ...report.topCustomers.map(
          (item) =>
            item.totalPurchases,
        ),
        1,
      );
    }, [report]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ===================================================== */}
      {/* HEADER                                                */}
      {/* ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" />

            Business Analytics
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Reports & Analytics
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Understand your sales, collections,
            customers, products, inventory and
            warranties.
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
              isLoading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ===================================================== */}
      {/* DATE FILTER                                            */}
      {/* ===================================================== */}

      <form
        onSubmit={handleApplyFilter}
        className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />

          <div>
            <h2 className="text-sm font-semibold">
              Report Period
            </h2>

            <p className="text-xs text-muted-foreground">
              Select the period you want to analyze.
            </p>
          </div>
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
            {isLoading
              ? "Loading..."
              : "Apply"}
          </button>
        </div>
      </form>

      {/* ===================================================== */}
      {/* ERROR                                                  */}
      {/* ===================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-destructive">
              Unable to load reports
            </p>

            <p className="mt-1 text-xs text-destructive/80">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReports()}
            className="w-fit rounded-lg border border-destructive/20 px-3 py-2 text-sm font-medium hover:bg-destructive/10"
          >
            Try again
          </button>
        </div>
      )}

      {/* ===================================================== */}
      {/* LOADING                                                */}
      {/* ===================================================== */}

      {isLoading ? (
        <div className="flex min-h-[500px] items-center justify-center rounded-2xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Generating your reports...
            </p>
          </div>
        </div>
      ) : !report ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border bg-card text-center">
          <BarChart3 className="size-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold">
            No report data
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing the date range or refreshing
            the report.
          </p>
        </div>
      ) : (
        <>
          {/* ================================================= */}
          {/* KPI CARDS                                          */}
          {/* ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Sales"
              value={formatCurrency(
                report.overview.totalSales,
              )}
              subtitle={`${formatNumber(
                report.overview.totalInvoices,
              )} invoices`}
              icon={CircleDollarSign}
            />

            <MetricCard
              title="Collected"
              value={formatCurrency(
                report.overview.amountCollected,
              )}
              subtitle={`${report.overview.collectionRate}% collection rate`}
              icon={WalletCards}
            />

            <MetricCard
              title="Outstanding"
              value={formatCurrency(
                report.overview.amountOutstanding,
              )}
              subtitle="Amount still due"
              icon={TrendingUp}
            />

            <MetricCard
              title="Payments"
              value={formatNumber(
                report.overview.paymentCount,
              )}
              subtitle={`${formatCurrency(
                report.overview.amountCollected,
              )} collected`}
              icon={BarChart3}
            />
          </div>

          {/* ================================================= */}
          {/* SALES + COLLECTION                                  */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
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
                    report.overview
                      .totalTax,
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

            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    Collection Summary
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Collected money versus outstanding
                    balance.
                  </p>
                </div>

                <TrendingUp className="size-5 text-primary" />
              </div>

              <div className="mb-6 flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold">
                    {
                      report.overview
                        .collectionRate
                    }
                    %
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Collection rate
                  </p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label="Collected"
                  value={formatCurrency(
                    report.overview
                      .amountCollected,
                  )}
                />

                <MiniMetric
                  label="Outstanding"
                  value={formatCurrency(
                    report.overview
                      .amountOutstanding,
                  )}
                />
              </div>
            </section>
          </div>

          {/* ================================================= */}
          {/* SALES TREND                                         */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="font-semibold">
                Sales Trend
              </h2>

              <p className="text-xs text-muted-foreground">
                Daily sales performance during the selected
                period.
              </p>
            </div>

            {report.trends.sales.length === 0 ? (
              <EmptySection message="No sales recorded during this period." />
            ) : (
              <div className="overflow-x-auto pb-2">
                <div
                  className="flex min-w-max items-end gap-3"
                  style={{
                    height: 260,
                  }}
                >
                  {report.trends.sales.map(
                    (item) => {
                      const height =
                        Math.max(
                          8,
                          (item.sales /
                            maxSales) *
                            210,
                        );

                      return (
                        <div
                          key={item.date}
                          className="flex h-full w-12 flex-col items-center justify-end gap-2 sm:w-14"
                        >
                          <span className="max-w-20 truncate text-[10px] font-medium">
                            {formatCurrency(
                              item.sales,
                            )}
                          </span>

                          <div
                            className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                            style={{
                              height,
                            }}
                            title={`${formatShortDate(
                              item.date,
                            )}: ${formatCurrency(
                              item.sales,
                            )}`}
                          />

                          <span className="text-[10px] text-muted-foreground">
                            {formatShortDate(
                              item.date,
                            )}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* PAYMENT TREND + PAYMENT METHODS                    */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="font-semibold">
                  Payment Trend
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Daily payments received.
                </p>
              </div>

              {report.trends.payments.length ===
              0 ? (
                <EmptySection message="No payments recorded during this period." />
              ) : (
                <div className="space-y-3">
                  {report.trends.payments.map(
                    (item) => {
                      const percentage =
                        Math.max(
                          3,
                          (item.amount /
                            maxPayment) *
                            100,
                        );

                      return (
                        <div
                          key={item.date}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                              {formatShortDate(
                                item.date,
                              )}
                            </span>

                            <span className="text-xs font-semibold">
                              {formatCurrency(
                                item.amount,
                              )}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
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

            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="font-semibold">
                  Payment Methods
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  How customers are paying.
                </p>
              </div>

              {report.payments.byMethod
                .length === 0 ? (
                <EmptySection message="No payment data for this period." />
              ) : (
                <div className="space-y-4">
                  {report.payments.byMethod.map(
                    (item) => {
                      const percentage =
                        report.payments
                          .totalCollected >
                        0
                          ? (
                              (item.amount /
                                report
                                  .payments
                                  .totalCollected) *
                              100
                            )
                          : 0;

                      return (
                        <div
                          key={item.method}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {formatPaymentMethod(
                                  item.method,
                                )}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {item.count} payment
                                {item.count === 1
                                  ? ""
                                  : "s"}
                              </p>
                            </div>

                            <p className="text-sm font-semibold">
                              {formatCurrency(
                                item.amount,
                              )}
                            </p>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
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
          </div>

          {/* ================================================= */}
          {/* INVOICE STATUS                                      */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Invoice Status
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Current invoice distribution for the
                  selected period.
                </p>
              </div>

              <FileText className="size-5 text-primary" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                label="Paid"
                value={report.invoices.paid}
              />

              <StatusCard
                label="Partially Paid"
                value={
                  report.invoices
                    .partiallyPaid
                }
              />

              <StatusCard
                label="Draft"
                value={report.invoices.draft}
              />

              <StatusCard
                label="Cancelled"
                value={
                  report.invoices.cancelled
                }
              />
            </div>
          </section>

          {/* ================================================= */}
          {/* TOP PRODUCTS                                       */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Top Products
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Products generating the most revenue.
                </p>
              </div>

              <Package className="size-5 text-primary" />
            </div>

            {report.topProducts.length ===
            0 ? (
              <EmptySection message="No product sales recorded during this period." />
            ) : (
              <div className="space-y-4">
                {report.topProducts.map(
                  (product, index) => {
                    const percentage =
                      Math.max(
                        4,
                        (product.revenue /
                          maxProductRevenue) *
                          100,
                      );

                    return (
                      <div
                        key={
                          product.id ??
                          `${product.productName}-${index}`
                        }
                        className="rounded-xl bg-muted/30 p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {
                                    product.productName
                                  }
                                </p>

                                {product.sku && (
                                  <p className="text-xs text-muted-foreground">
                                    SKU:{" "}
                                    {
                                      product.sku
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 text-left sm:text-right">
                                <p className="text-sm font-bold">
                                  {formatCurrency(
                                    product.revenue,
                                  )}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {formatNumber(
                                    product.quantity,
                                  )}{" "}
                                  sold
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* TOP CUSTOMERS                                      */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Top Customers
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Customers with the highest purchase value.
                </p>
              </div>

              <Users className="size-5 text-primary" />
            </div>

            {report.topCustomers.length ===
            0 ? (
              <EmptySection message="No customer purchases recorded during this period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">
                        Customer
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Invoices
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Purchases
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Paid
                      </th>

                      <th className="pb-3 pl-4 text-right font-medium">
                        Due
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.topCustomers.map(
                      (customer) => {
                        const percentage =
                          Math.max(
                            3,
                            (customer.totalPurchases /
                              maxCustomerPurchases) *
                              100,
                          );

                        return (
                          <tr
                            key={
                              customer.id ??
                              customer.name
                            }
                            className="border-b last:border-0"
                          >
                            <td className="py-4 pr-4">
                              <p className="text-sm font-semibold">
                                {
                                  customer.name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {customer.email ??
                                  customer.phone ??
                                  "No contact information"}
                              </p>

                              <div className="mt-2 h-1.5 max-w-48 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm">
                              {
                                customer.invoiceCount
                              }
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold">
                              {formatCurrency(
                                customer.totalPurchases,
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm">
                              {formatCurrency(
                                customer.totalPaid,
                              )}
                            </td>

                            <td className="py-4 pl-4 text-right text-sm font-semibold">
                              {formatCurrency(
                                customer.totalDue,
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* OUTSTANDING INVOICES                               */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="font-semibold">
                Outstanding Invoices
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Invoices with an unpaid balance.
              </p>
            </div>

            {report.outstandingInvoices
              .length === 0 ? (
              <EmptySection message="There are no outstanding invoices for this period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">
                        Invoice
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Customer
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Due Date
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Status
                      </th>

                      <th className="pb-3 px-4 font-medium">
                        Total
                      </th>

                      <th className="pb-3 pl-4 text-right font-medium">
                        Outstanding
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.outstandingInvoices.map(
                      (invoice) => (
                        <tr
                          key={
                            invoice.id ??
                            invoice.invoiceNumber
                          }
                          className="border-b last:border-0"
                        >
                          <td className="py-4 pr-4">
                            <p className="text-sm font-semibold">
                              {
                                invoice.invoiceNumber
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Issued{" "}
                              {formatDate(
                                invoice.issueDate,
                              )}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {
                              invoice.customerName
                            }
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {formatDate(
                              invoice.dueDate,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                              {getStatusLabel(
                                invoice.status,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {formatCurrency(
                              invoice.total,
                            )}
                          </td>

                          <td className="py-4 pl-4 text-right text-sm font-bold">
                            {formatCurrency(
                              invoice.amountDue,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* INVENTORY + WARRANTY                               */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">
                    Inventory Overview
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Current product catalog health.
                  </p>
                </div>

                <Package className="size-5 text-primary" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatusCard
                  label="Total Products"
                  value={
                    report.inventory
                      .totalProducts
                  }
                />

                <StatusCard
                  label="Active Products"
                  value={
                    report.inventory
                      .activeProducts
                  }
                />

                <StatusCard
                  label="Low Stock"
                  value={
                    report.inventory
                      .lowStockProducts
                  }
                />

                <StatusCard
                  label="Out of Stock"
                  value={
                    report.inventory
                      .outOfStockProducts
                  }
                />
              </div>

              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total stock units
                  </span>

                  <span className="text-sm font-bold">
                    {formatNumber(
                      report.inventory
                        .totalStockUnits,
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">
                    Warranty Overview
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Current warranty status across your shop.
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

              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    No warranty
                  </span>

                  <span className="text-sm font-bold">
                    {
                      report.warranties
                        .noWarranty
                    }
                  </span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* ========================================================= */
/* COMPONENTS                                                */
/* ========================================================= */

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

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-base font-bold">
        {value}
      </p>
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
        {formatStatusValue(value)}
      </p>
    </div>
  );
}

function formatStatusValue(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(Number(value) || 0);
}

function EmptySection({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl bg-muted/40 px-4 text-center">
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}