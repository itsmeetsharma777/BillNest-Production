import {
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

interface Invoice {
  id: string;
  invoiceNo: string;
  productNames: string[];
  customerName: string;
  customerId?: string;
  issueDate?: string;
  dueDate?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod?: string;
  status: InvoiceStatus;
  notes?: string;
}

interface InvoicesResponse {
  success: boolean;
  data?: {
    invoices?: Array<{
      _id?: string;
      id?: string;
      invoiceNumber?: string;
      invoiceNo?: string;
      issueDate?: string;
      invoiceDate?: string;
      dueDate?: string;
      subtotal?: number;
      discount?: number;
      tax?: number;
      total?: number;
      amountPaid?: number;
      amountDue?: number;
      paymentMethod?: string;
      status?: string;
      notes?: string;

      customer?: {
        _id?: string;
        id?: string;
        name?: string;
      };

      customerName?: string;
      customerId?: string;

      productNames?: string[];
    }>;

    total?: number;
  };

  message?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
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

function normalizeStatus(
  status?: string,
): InvoiceStatus {
  switch (status?.toLowerCase()) {
    case "paid":
      return "paid";

    case "partially_paid":
      return "partially_paid";

    case "cancelled":
      return "cancelled";

    case "draft":
    default:
      return "draft";
  }
}

function getStatusLabel(
  status: InvoiceStatus,
) {
  switch (status) {
    case "paid":
      return "Paid";

    case "partially_paid":
      return "Partially Paid";

    case "cancelled":
      return "Cancelled";

    case "draft":
    default:
      return "Draft";
  }
}

function getStatusClass(
  status: InvoiceStatus,
) {
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

function getPaymentMethodLabel(
  method?: string,
) {
  switch (method?.toLowerCase()) {
    case "cash":
      return "Cash";

    case "online":
      return "Online";

    case "cheque":
      return "Cheque";

    default:
      return method || "—";
  }
}

function normalizeInvoice(
  invoice: InvoicesResponse["data"] extends infer T
    ? T extends { invoices?: infer I }
      ? I extends Array<infer R>
        ? R
        : never
      : never
    : never,
): Invoice {
  const id =
    invoice._id ??
    invoice.id ??
    "";

  return {
    id,

    invoiceNo:
      invoice.invoiceNumber ??
      invoice.invoiceNo ??
      "Invoice",

    productNames:
      invoice.productNames ?? [],

    customerName:
      invoice.customer?.name ??
      invoice.customerName ??
      "Customer",

    customerId:
      invoice.customer?._id ??
      invoice.customer?.id ??
      invoice.customerId,

    issueDate:
      invoice.issueDate ??
      invoice.invoiceDate,

    dueDate: invoice.dueDate,

    subtotal:
      invoice.subtotal ?? 0,

    discount:
      invoice.discount ?? 0,

    tax:
      invoice.tax ?? 0,

    total:
      invoice.total ?? 0,

    amountPaid:
      invoice.amountPaid ?? 0,

    amountDue:
      invoice.amountDue ?? 0,

    paymentMethod:
      invoice.paymentMethod,

    status:
      normalizeStatus(invoice.status),

    notes:
      invoice.notes,
  };
}

export default function CustomerInvoicesPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | InvoiceStatus
    >("ALL");

  const loadInvoices =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/customer/invoices`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const result =
          (await response.json()) as InvoicesResponse;

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Unable to load your purchases.",
          );
        }

        const records =
          result.data?.invoices ?? [];

        setInvoices(
          records.map((invoice) =>
            normalizeInvoice(invoice),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your purchases.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return invoices.filter(
        (invoice) => {
          if (
            statusFilter !== "ALL" &&
            invoice.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            invoice.invoiceNo,
            ...invoice.productNames,
            invoice.customerName,
            invoice.paymentMethod,
            getPaymentMethodLabel(
              invoice.paymentMethod,
            ),
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query),
            );
        },
      );
    }, [
      invoices,
      search,
      statusFilter,
    ]);

  const totalPurchases =
    useMemo(
      () =>
        invoices
          .filter(
            (invoice) =>
              invoice.status !==
                "cancelled" &&
              invoice.status !== "draft",
          )
          .reduce(
            (sum, invoice) =>
              sum + invoice.total,
            0,
          ),
      [invoices],
    );

  const paidCount =
    invoices.filter(
      (invoice) =>
        invoice.status === "paid",
    ).length;

  const outstandingAmount =
    useMemo(
      () =>
        invoices
          .filter(
            (invoice) =>
              invoice.status !==
              "cancelled",
          )
          .reduce(
            (sum, invoice) =>
              sum + invoice.amountDue,
            0,
          ),
      [invoices],
    );

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Customer portal
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Purchases
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View your invoices and purchase history.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadInvoices()
          }
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total invoices
          </p>

          <p className="mt-2 text-2xl font-bold">
            {invoices.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total purchases
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(
              totalPurchases,
            )}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Paid invoices
          </p>

          <p className="mt-2 text-2xl font-bold">
            {paidCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Outstanding
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatCurrency(
              outstandingAmount,
            )}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search invoices or products..."
            className="h-10 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | InvoiceStatus,
            )
          }
          className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="paid">
            Paid
          </option>

          <option value="partially_paid">
            Partially Paid
          </option>

          <option value="draft">
            Draft
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>
      </div>

      {isLoading && (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

            <p className="text-sm text-muted-foreground">
              Loading your purchases...
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 text-destructive" />

            <div>
              <h2 className="font-semibold">
                Unable to load purchases
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadInvoices()
                }
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        filteredInvoices.length ===
          0 && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-7" />
            </div>

            <h2 className="text-lg font-semibold">
              {search ||
              statusFilter !== "ALL"
                ? "No invoices found"
                : "No purchases yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {search ||
              statusFilter !== "ALL"
                ? "Try changing your search or status filter."
                : "Your purchase invoices will appear here once you make a purchase."}
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredInvoices.length >
          0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-4">
                        Invoice
                      </th>

                      <th className="px-5 py-4">
                        Date
                      </th>

                      <th className="px-5 py-4">
                        Amount
                      </th>

                      <th className="px-5 py-4">
                        Paid
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredInvoices.map(
                      (invoice) => (
                        <tr
                          key={invoice.id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {invoice.invoiceNo}
                                </p>

                                <p className="mt-1 truncate text-sm font-medium">
                                  {invoice
                                    .productNames
                                    .length >
                                  0
                                    ? invoice
                                        .productNames[0]
                                    : "Product details unavailable"}
                                </p>

                                {invoice
                                  .productNames
                                  .length >
                                  1 && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    +{" "}
                                    {invoice
                                      .productNames
                                      .length -
                                      1}{" "}
                                    more{" "}
                                    {invoice
                                      .productNames
                                      .length -
                                      1 ===
                                    1
                                      ? "item"
                                      : "items"}
                                  </p>
                                )}

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {getPaymentMethodLabel(
                                    invoice.paymentMethod,
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm">
                            {formatDate(
                              invoice.issueDate,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                            {formatCurrency(
                              invoice.total,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm">
                            {formatCurrency(
                              invoice.amountPaid,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                invoice.status,
                              )}`}
                            >
                              {getStatusLabel(
                                invoice.status,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/customer/invoices/${invoice.id}`,
                                )
                              }
                              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                              View invoice
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredInvoices.map(
                (invoice) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/customer/invoices/${invoice.id}`,
                      )
                    }
                    className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold">
                            {invoice.invoiceNo}
                          </p>

                          <p className="mt-1 truncate text-sm font-medium">
                            {invoice
                              .productNames
                              .length >
                            0
                              ? invoice
                                  .productNames[0]
                              : "Product details unavailable"}
                          </p>

                          {invoice
                            .productNames
                            .length >
                            1 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              +{" "}
                              {invoice
                                .productNames
                                .length -
                                1}{" "}
                              more{" "}
                              {invoice
                                .productNames
                                .length -
                                1 ===
                              1
                                ? "item"
                                : "items"}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(
                              invoice.issueDate,
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClass(
                          invoice.status,
                        )}`}
                      >
                        {getStatusLabel(
                          invoice.status,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(
                            invoice.total,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Paid
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(
                            invoice.amountPaid,
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ),
              )}
            </div>
          </>
        )}
    </div>
  );
}