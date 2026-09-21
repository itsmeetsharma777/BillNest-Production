import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Download,
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

function formatCompactCurrency(value: number) {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return `₹${Math.round(amount)}`;
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
  const date = new Date(`${value}T00:00:00`);

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
  return new Date().toISOString().slice(0, 10);
}

function getStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

/* ========================================================= */
/* CSV EXPORT — FEATURE 19.4.1                              */
/* ========================================================= */

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function csvRow(values: unknown[]) {
  return values.map(escapeCsvValue).join(",");
}

function downloadCsvFile(
  filename: string,
  rows: unknown[][],
) {
  const csv = rows.map(csvRow).join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function buildReportCsv(report: ReportData) {
  const rows: unknown[][] = [];

  /* ------------------------------------------------------- */
  /* REPORT HEADER                                           */
  /* ------------------------------------------------------- */

  rows.push(["BillNest Reports & Analytics"]);

  rows.push([
    "Report Period",
    report.period.startDate ?? "",
    report.period.endDate ?? "",
  ]);

  rows.push([]);

  /* ------------------------------------------------------- */
  /* SUMMARY                                                 */
  /* ------------------------------------------------------- */

  rows.push(["Summary"]);

  rows.push([
    "Metric",
    "Value",
  ]);

  rows.push([
    "Total Invoices",
    report.overview.totalInvoices,
  ]);

  rows.push([
    "Total Sales",
    report.overview.totalSales,
  ]);

  rows.push([
    "Total Subtotal",
    report.overview.totalSubtotal,
  ]);

  rows.push([
    "Total Discount",
    report.overview.totalDiscount,
  ]);

  rows.push([
    "Total Tax",
    report.overview.totalTax,
  ]);

  rows.push([
    "Average Invoice",
    report.overview.averageInvoice,
  ]);

  rows.push([
    "Amount Collected",
    report.overview.amountCollected,
  ]);

  rows.push([
    "Amount Outstanding",
    report.overview.amountOutstanding,
  ]);

  rows.push([
    "Collection Rate (%)",
    report.overview.collectionRate,
  ]);

  rows.push([
    "Payment Count",
    report.overview.paymentCount,
  ]);

  rows.push([]);

  /* ------------------------------------------------------- */
  /* INVOICE STATUS                                          */
  /* ------------------------------------------------------- */

  rows.push(["Invoice Status"]);

  rows.push([
    "Status",
    "Count",
  ]);

  rows.push([
    "Paid",
    report.invoices.paid,
  ]);

  rows.push([
    "Partially Paid",
    report.invoices.partiallyPaid,
  ]);

  rows.push([
    "Draft",
    report.invoices.draft,
  ]);

  rows.push([
    "Cancelled",
    report.invoices.cancelled,
  ]);

  rows.push([
    "Total",
    report.invoices.total,
  ]);

  rows.push([]);

  /* ------------------------------------------------------- */
  /* PAYMENT METHODS                                         */
  /* ------------------------------------------------------- */

  rows.push(["Payment Methods"]);

  rows.push([
    "Payment Method",
    "Count",
    "Amount",
  ]);

  report.payments.byMethod.forEach((item) => {
    rows.push([
      formatPaymentMethod(item.method),
      item.count,
      item.amount,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* SALES TREND                                             */
  /* ------------------------------------------------------- */

  rows.push(["Sales Trend"]);

  rows.push([
    "Date",
    "Sales",
    "Invoices",
  ]);

  report.trends.sales.forEach((item) => {
    rows.push([
      item.date,
      item.sales,
      item.invoices,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* PAYMENT TREND                                           */
  /* ------------------------------------------------------- */

  rows.push(["Payment Trend"]);

  rows.push([
    "Date",
    "Amount",
    "Payments",
  ]);

  report.trends.payments.forEach((item) => {
    rows.push([
      item.date,
      item.amount,
      item.payments,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* TOP PRODUCTS                                            */
  /* ------------------------------------------------------- */

  rows.push(["Top Products"]);

  rows.push([
    "Product",
    "SKU",
    "Quantity",
    "Revenue",
  ]);

  report.topProducts.forEach((item) => {
    rows.push([
      item.productName,
      item.sku ?? "",
      item.quantity,
      item.revenue,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* TOP CUSTOMERS                                           */
  /* ------------------------------------------------------- */

  rows.push(["Top Customers"]);

  rows.push([
    "Customer",
    "Email",
    "Phone",
    "Total Purchases",
    "Invoice Count",
    "Total Paid",
    "Total Due",
  ]);

  report.topCustomers.forEach((item) => {
    rows.push([
      item.name,
      item.email ?? "",
      item.phone ?? "",
      item.totalPurchases,
      item.invoiceCount,
      item.totalPaid,
      item.totalDue,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* OUTSTANDING INVOICES                                    */
  /* ------------------------------------------------------- */

  rows.push(["Outstanding Invoices"]);

  rows.push([
    "Invoice",
    "Customer",
    "Issue Date",
    "Due Date",
    "Status",
    "Total",
    "Amount Paid",
    "Amount Due",
  ]);

  report.outstandingInvoices.forEach((item) => {
    rows.push([
      item.invoiceNumber,
      item.customerName,
      item.issueDate ?? "",
      item.dueDate ?? "",
      getStatusLabel(item.status),
      item.total,
      item.amountPaid,
      item.amountDue,
    ]);
  });

  rows.push([]);

  /* ------------------------------------------------------- */
  /* INVENTORY                                               */
  /* ------------------------------------------------------- */

  rows.push(["Inventory Overview"]);

  rows.push([
    "Metric",
    "Value",
  ]);

  rows.push([
    "Total Products",
    report.inventory.totalProducts,
  ]);

  rows.push([
    "Active Products",
    report.inventory.activeProducts,
  ]);

  rows.push([
    "Inactive Products",
    report.inventory.inactiveProducts,
  ]);

  rows.push([
    "Total Stock Units",
    report.inventory.totalStockUnits,
  ]);

  rows.push([
    "Low Stock Products",
    report.inventory.lowStockProducts,
  ]);

  rows.push([
    "Out of Stock Products",
    report.inventory.outOfStockProducts,
  ]);

  rows.push([]);

  /* ------------------------------------------------------- */
  /* WARRANTY                                                */
  /* ------------------------------------------------------- */

  rows.push(["Warranty Overview"]);

  rows.push([
    "Metric",
    "Value",
  ]);

  rows.push([
    "Total",
    report.warranties.total,
  ]);

  rows.push([
    "Active",
    report.warranties.active,
  ]);

  rows.push([
    "Expiring Soon",
    report.warranties.expiringSoon,
  ]);

  rows.push([
    "Expired",
    report.warranties.expired,
  ]);

  rows.push([
    "No Warranty",
    report.warranties.noWarranty,
  ]);

  return rows;
}

/* ========================================================= */
/* MAIN PAGE                                                 */
/* ========================================================= */

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

      const response = await fetch(
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
    // Filters are applied manually with Apply.
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

  const maxProductRevenue = useMemo(() => {
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

  function handleExportCsv() {
    if (!report) {
      return;
    }

    const periodStart =
      report.period.startDate ??
      startDate ??
      "report";

    const periodEnd =
      report.period.endDate ??
      endDate ??
      "report";

    const filename =
      `billnest-report-${periodStart.slice(
        0,
        10,
      )}-to-${periodEnd.slice(
        0,
        10,
      )}.csv`;

    downloadCsvFile(
      filename,
      buildReportCsv(report),
    );
  }

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

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* ================================================= */}
          {/* CSV EXPORT                                        */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={
              isLoading ||
              !report
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium shadow-sm transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Download className="size-4" />

            Export CSV
          </button>

          {/* ================================================= */}
          {/* REFRESH                                            */}
          {/* ================================================= */}

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
      {/* LOADING / EMPTY                                       */}
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
          {/* SALES PERFORMANCE                                 */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="font-semibold">
                Sales Performance
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
                <SalesLineChart
                  data={report.trends.sales}
                  maxValue={maxSales}
                />
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* SALES + COLLECTION                                */}
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
                    report.overview.totalSubtotal,
                  )}
                />

                <ReportRow
                  label="Discount"
                  value={formatCurrency(
                    report.overview.totalDiscount,
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
                    report.overview.averageInvoice,
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
                    {report.overview.collectionRate}%
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
                      100,
                      Math.max(
                        0,
                        report.overview.collectionRate,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label="Collected"
                  value={formatCurrency(
                    report.overview.amountCollected,
                  )}
                />

                <MiniMetric
                  label="Outstanding"
                  value={formatCurrency(
                    report.overview.amountOutstanding,
                  )}
                />
              </div>
            </section>
          </div>

          {/* ================================================= */}
          {/* PAYMENT TREND + METHODS                           */}
          {/* ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    Payment Trend
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Daily collection activity.
                  </p>
                </div>

                <WalletCards className="size-5 text-primary" />
              </div>

              {report.trends.payments.length === 0 ? (
                <EmptySection message="No payments recorded during this period." />
              ) : (
                <PaymentBarChart
                  data={report.trends.payments}
                  maxValue={maxPayment}
                />
              )}
            </section>

            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">
                    Payment Methods
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    How customers are paying you.
                  </p>
                </div>

                <WalletCards className="size-5 text-primary" />
              </div>

              {report.payments.byMethod.length === 0 ? (
                <EmptySection message="No payment method data available." />
              ) : (
                <PaymentMethodChart
                  data={report.payments.byMethod}
                  total={report.payments.totalCollected}
                />
              )}
            </section>
          </div>

          {/* ================================================= */}
          {/* INVOICE STATUS                                    */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Invoice Status
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Current invoice distribution for the selected
                  period.
                </p>
              </div>

              <FileText className="size-5 text-primary" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatusCard
                label="Total"
                value={report.invoices.total}
              />

              <StatusCard
                label="Paid"
                value={report.invoices.paid}
              />

              <StatusCard
                label="Partially Paid"
                value={report.invoices.partiallyPaid}
              />

              <StatusCard
                label="Draft"
                value={report.invoices.draft}
              />

              <StatusCard
                label="Cancelled"
                value={report.invoices.cancelled}
              />
            </div>
          </section>

          {/* ================================================= */}
          {/* TOP PRODUCTS                                     */}
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

            {report.topProducts.length === 0 ? (
              <EmptySection message="No product sales recorded during this period." />
            ) : (
              <div className="space-y-4">
                {report.topProducts.map(
                  (product, index) => {
                    const percentage =
                      Math.max(
                        3,
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
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </span>

                              <span className="truncate text-sm font-medium">
                                {product.productName}
                              </span>
                            </div>

                            <div className="mt-1 pl-9 text-xs text-muted-foreground">
                              {product.sku
                                ? `SKU: ${product.sku} • `
                                : ""}
                              {formatNumber(
                                product.quantity,
                              )}{" "}
                              units
                            </div>
                          </div>

                          <span className="shrink-0 text-sm font-bold">
                            {formatCurrency(
                              product.revenue,
                            )}
                          </span>
                        </div>

                        <div className="ml-9 h-2 overflow-hidden rounded-full bg-muted">
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

          {/* ================================================= */}
          {/* TOP CUSTOMERS                                    */}
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

            {report.topCustomers.length === 0 ? (
              <EmptySection message="No customer purchase data available." />
            ) : (
              <div className="space-y-4">
                {report.topCustomers.map(
                  (customer, index) => {
                    const percentage =
                      Math.max(
                        3,
                        (customer.totalPurchases /
                          maxCustomerPurchases) *
                          100,
                      );

                    return (
                      <div
                        key={
                          customer.id ??
                          `${customer.name}-${index}`
                        }
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </span>

                              <span className="truncate text-sm font-medium">
                                {customer.name}
                              </span>
                            </div>

                            <div className="mt-1 pl-9 text-xs text-muted-foreground">
                              {customer.email ??
                                customer.phone ??
                                "No contact information"}
                              {" • "}
                              {formatNumber(
                                customer.invoiceCount,
                              )}{" "}
                              invoice
                              {customer.invoiceCount ===
                              1
                                ? ""
                                : "s"}
                            </div>
                          </div>

                          <span className="shrink-0 text-sm font-bold">
                            {formatCurrency(
                              customer.totalPurchases,
                            )}
                          </span>
                        </div>

                        <div className="ml-9 h-2 overflow-hidden rounded-full bg-muted">
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

          {/* ================================================= */}
          {/* OUTSTANDING INVOICES                             */}
          {/* ================================================= */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Outstanding Invoices
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Invoices with an unpaid balance.
                </p>
              </div>

              <CircleDollarSign className="size-5 text-primary" />
            </div>

            {report.outstandingInvoices.length === 0 ? (
              <EmptySection message="No outstanding invoices for this period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Invoice
                      </th>

                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Customer
                      </th>

                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Issue Date
                      </th>

                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Due Date
                      </th>

                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Status
                      </th>

                      <th className="px-4 pb-3 text-xs font-semibold text-muted-foreground">
                        Total
                      </th>

                      <th className="px-4 pb-3 text-right text-xs font-semibold text-muted-foreground">
                        Amount Due
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
                          <td className="px-4 py-4 text-sm font-semibold">
                            {invoice.invoiceNumber}
                          </td>

                          <td className="px-4 py-4 text-sm">
                            {invoice.customerName}
                          </td>

                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {formatDate(
                              invoice.issueDate,
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-muted-foreground">
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
          {/* INVENTORY + WARRANTY                              */}
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
                    report.warranties.expiringSoon
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
/* SALES LINE CHART                                          */
/* ========================================================= */

function SalesLineChart({
  data,
  maxValue,
}: {
  data: ReportData["trends"]["sales"];
  maxValue: number;
}) {
  const width = 1000;
  const height = 350;

  const paddingLeft = 72;
  const paddingRight = 24;
  const paddingTop = 30;
  const paddingBottom = 55;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const getX = (index: number) => {
    if (data.length === 1) {
      return (
        paddingLeft +
        chartWidth / 2
      );
    }

    return (
      paddingLeft +
      (index /
        (data.length - 1)) *
        chartWidth
    );
  };

  const getY = (value: number) => {
    return (
      paddingTop +
      chartHeight -
      (value /
        Math.max(maxValue, 1)) *
        chartHeight
    );
  };

  const points = data.map(
    (item, index) => ({
      ...item,
      x: getX(index),
      y: getY(item.sales),
    }),
  );

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${
          point.x
        } ${point.y}`,
    )
    .join(" ");

  const areaPath =
    points.length > 0
      ? [
          `M ${points[0].x} ${
            paddingTop +
            chartHeight
          }`,
          ...points.map(
            (point) =>
              `L ${point.x} ${point.y}`,
          ),
          `L ${
            points[points.length - 1].x
          } ${
            paddingTop +
            chartHeight
          }`,
          "Z",
        ].join(" ")
      : "";

  const gridValues = [
    1,
    0.75,
    0.5,
    0.25,
    0,
  ];

  return (
    <div className="min-w-[680px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[350px] w-full"
        role="img"
        aria-label="Sales performance chart"
      >
        <defs>
          <linearGradient
            id="billnest-sales-gradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              className="stop-primary"
              stopOpacity="0.25"
            />

            <stop
              offset="100%"
              className="stop-primary"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {gridValues.map(
          (ratio) => {
            const y =
              paddingTop +
              chartHeight -
              ratio *
                chartHeight;

            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  x2={
                    width -
                    paddingRight
                  }
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeWidth="1"
                  strokeDasharray="5 6"
                />

                <text
                  x={
                    paddingLeft - 12
                  }
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  {formatCompactCurrency(
                    maxValue * ratio,
                  )}
                </text>
              </g>
            );
          },
        )}

        <path
          d={areaPath}
          fill="url(#billnest-sales-gradient)"
        />

        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(
          (point, index) => (
            <g
              key={`${point.date}-${index}`}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="fill-background stroke-primary"
                strokeWidth="3"
              />

              <title>
                {`${formatShortDate(
                  point.date,
                )}: ${formatCurrency(
                  point.sales,
                )} • ${
                  point.invoices
                } invoice${
                  point.invoices === 1
                    ? ""
                    : "s"
                }`}
              </title>

              {(data.length <= 12 ||
                index === 0 ||
                index ===
                  data.length - 1 ||
                index %
                  Math.ceil(
                    data.length / 8,
                  ) ===
                  0) && (
                <text
                  x={point.x}
                  y={height - 18}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  {formatShortDate(
                    point.date,
                  )}
                </text>
              )}
            </g>
          ),
        )}
      </svg>
    </div>
  );
}

/* ========================================================= */
/* PAYMENT BAR CHART                                         */
/* ========================================================= */

function PaymentBarChart({
  data,
  maxValue,
}: {
  data: ReportData["trends"]["payments"];
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const percentage =
          Math.max(
            3,
            (item.amount /
              Math.max(
                maxValue,
                1,
              )) *
              100,
          );

        return (
          <div
            key={item.date}
            className="group"
          >
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {formatShortDate(
                  item.date,
                )}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground">
                  {item.payments} payment
                  {item.payments === 1
                    ? ""
                    : "s"}
                </span>

                <span className="text-xs font-semibold">
                  {formatCurrency(
                    item.amount,
                  )}
                </span>
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 group-hover:opacity-80"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================= */
/* PAYMENT METHOD DONUT                                     */
/* ========================================================= */

function PaymentMethodChart({
  data,
  total,
}: {
  data: ReportData["payments"]["byMethod"];
  total: number;
}) {
  const radius = 76;

  const circumference =
    2 * Math.PI * radius;

  let currentOffset = 0;

  const segments = data.map(
    (item) => {
      const ratio =
        total > 0
          ? item.amount / total
          : 0;

      const dash =
        ratio * circumference;

      const result = {
        ...item,
        ratio,
        dash,
        offset: currentOffset,
      };

      currentOffset += dash;

      return result;
    },
  );

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[190px_1fr]">
      <div className="relative mx-auto size-[190px]">
        <svg
          viewBox="0 0 190 190"
          className="size-full -rotate-90"
          role="img"
          aria-label="Payment method distribution"
        >
          <circle
            cx="95"
            cy="95"
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth="20"
          />

          {segments.map(
            (segment, index) => (
              <circle
                key={
                  segment.method
                }
                cx="95"
                cy="95"
                r={radius}
                fill="none"
                className={
                  index % 4 === 0
                    ? "stroke-primary"
                    : index % 4 === 1
                      ? "stroke-primary/70"
                      : index % 4 === 2
                        ? "stroke-primary/45"
                        : "stroke-primary/25"
                }
                strokeWidth="20"
                strokeDasharray={`${segment.dash} ${
                  circumference -
                  segment.dash
                }`}
                strokeDashoffset={
                  -segment.offset
                }
              >
                <title>
                  {`${formatPaymentMethod(
                    segment.method,
                  )}: ${formatCurrency(
                    segment.amount,
                  )}`}
                </title>
              </circle>
            ),
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">
            {formatCompactCurrency(
              total,
            )}
          </span>

          <span className="text-[11px] text-muted-foreground">
            collected
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map(
          (segment, index) => (
            <div
              key={
                segment.method
              }
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    index % 4 === 0
                      ? "bg-primary"
                      : index % 4 === 1
                        ? "bg-primary/70"
                        : index % 4 === 2
                          ? "bg-primary/45"
                          : "bg-primary/25"
                  }`}
                />

                <span className="truncate text-sm">
                  {formatPaymentMethod(
                    segment.method,
                  )}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(
                    segment.amount,
                  )}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {(
                    segment.ratio *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/* ========================================================= */
/* METRIC CARD                                               */
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
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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

/* ========================================================= */
/* MINI METRIC                                               */
/* ========================================================= */

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

/* ========================================================= */
/* REPORT ROW                                                */
/* ========================================================= */

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

/* ========================================================= */
/* STATUS CARD                                               */
/* ========================================================= */

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4 transition hover:bg-muted/60">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {formatNumber(value)}
      </p>
    </div>
  );
}

/* ========================================================= */
/* EMPTY SECTION                                             */
/* ========================================================= */

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