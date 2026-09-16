import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

interface InvoiceItem {
  id?: string;
  _id?: string;
  productName?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineSubtotal?: number;
  lineTax?: number;
  lineTotal?: number;
  total?: number;
}

interface InvoiceCustomer {
  id?: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Invoice {
  id?: string;
  _id?: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;

  customer?: InvoiceCustomer;

  items?: InvoiceItem[];

  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  amountPaid?: number;
  amountDue?: number;

  paymentMethod?: string;
  status: InvoiceStatus;

  notes?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceResponse {
  success: boolean;
  data?: {
    invoice?: Invoice;
    items?: InvoiceItem[];
  };
  message?: string;
}

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
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

function normalizeStatus(status?: string): InvoiceStatus {
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

function getStatusLabel(status: InvoiceStatus) {
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

function getStatusClass(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";

    case "partially_paid":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "cancelled":
      return "border-destructive/30 bg-destructive/10 text-destructive";

    case "draft":
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

function getPaymentMethodLabel(method?: string) {
  switch (method?.toLowerCase()) {
    case "cash":
      return "Cash";

    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "bank_transfer":
      return "Bank Transfer";

    case "credit":
      return "Credit";

    default:
      return method || "—";
  }
}

export default function InvoiceDetailsPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadInvoice() {
    if (!invoiceId) {
      setError("Invoice ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as InvoiceResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to load invoice.",
        );
      }

      const loadedInvoice =
        result.data?.invoice;

      if (!loadedInvoice) {
        throw new Error(
          "Invoice was not found.",
        );
      }

      setInvoice({
        ...loadedInvoice,

        status: normalizeStatus(
          loadedInvoice.status,
        ),

        /*
         * The backend returns invoice items
         * separately from the invoice object.
         * Merge them here so the details page
         * works with the actual API response.
         */
        items:
          loadedInvoice.items ??
          result.data?.items ??
          [],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoice.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoice();
  }, [invoiceId]);

  function printInvoice() {
    window.print();
  }

  async function performAction(
    endpoint: "pay" | "cancel",
  ) {
    if (!invoiceId || !invoice) {
      return;
    }

    const actionMessage =
      endpoint === "pay"
        ? "Mark this invoice as paid?"
        : "Cancel this invoice?";

    const confirmed =
      window.confirm(actionMessage);

    if (!confirmed) {
      return;
    }

    try {
      setIsActionLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}/${endpoint}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result =
        (await response.json()) as InvoiceResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            `Unable to ${endpoint} invoice.`,
        );
      }

      setSuccessMessage(
        endpoint === "pay"
          ? "Invoice marked as paid successfully."
          : "Invoice cancelled successfully.",
      );

      await loadInvoice();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${endpoint} invoice.`,
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-4 size-10 text-muted-foreground" />

          <h1 className="text-xl font-semibold">
            Invoice not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "The invoice you are looking for does not exist."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/shopkeeper/invoices")
            }
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" />

            Back to invoices
          </button>
        </div>
      </div>
    );
  }

  const invoiceNumber =
    invoice.invoiceNo ??
    invoice.invoiceNumber ??
    "Invoice";

  const subtotal = invoice.subtotal ?? 0;

  const discount = invoice.discount ?? 0;

  const tax = invoice.tax ?? 0;

  const total = invoice.total ?? 0;

  const amountPaid =
    invoice.amountPaid ?? 0;

  const amountDue =
    invoice.amountDue ??
    Math.max(0, total - amountPaid);

  const status = normalizeStatus(
    invoice.status,
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:mb-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/shopkeeper/invoices")
            }
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-muted print:hidden"
            aria-label="Back to invoices"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" />

              <span>Invoices</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {invoiceNumber}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Invoice created on{" "}
              {formatDate(invoice.invoiceDate)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Printer className="size-4" />

            Print
          </button>

          {status !== "paid" &&
            status !== "cancelled" && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() =>
                  void performAction("pay")
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}

                Mark as Paid
              </button>
            )}

          {status !== "cancelled" &&
            status !== "paid" && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() =>
                  void performAction("cancel")
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="size-4" />

                Cancel Invoice
              </button>
            )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive print:hidden">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400 print:hidden">
          <CheckCircle2 className="size-4" />

          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Customer
                </h2>

                <p className="text-xs text-muted-foreground">
                  Customer linked to this invoice.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="font-semibold">
                {invoice.customer?.name ??
                  "Customer"}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {invoice.customer?.phone && (
                  <span>
                    {invoice.customer.phone}
                  </span>
                )}

                {invoice.customer?.email && (
                  <span>
                    {invoice.customer.email}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Invoice Items */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-5 sm:p-6">
              <h2 className="font-semibold">
                Invoice Items
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Products and services included in
                this invoice.
              </p>
            </div>

            <div className="divide-y">
              {(invoice.items ?? []).map(
                (item, index) => {
                  const quantity =
                    Number(item.quantity) || 0;

                  const unitPrice =
                    Number(item.unitPrice) || 0;

                  const lineTotal =
                    item.lineTotal ??
                    item.total ??
                    item.lineSubtotal ??
                    quantity * unitPrice;

                  return (
                    <div
                      key={
                        item.id ??
                        item._id ??
                        `invoice-item-${index}`
                      }
                      className="p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {item.productName ??
                              item.description ??
                              "Item"}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {quantity} ×{" "}
                            {formatCurrency(
                              unitPrice,
                            )}
                          </p>
                        </div>

                        <p className="text-base font-semibold">
                          {formatCurrency(
                            lineTotal,
                          )}
                        </p>
                      </div>

                      {(item.discount ||
                        item.taxRate) && (
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {item.discount ? (
                            <span>
                              Discount:{" "}
                              {formatCurrency(
                                item.discount,
                              )}
                            </span>
                          ) : null}

                          {item.taxRate ? (
                            <span>
                              Tax: {item.taxRate}%
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                },
              )}

              {(invoice.items ?? []).length ===
                0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No invoice items found.
                </div>
              )}
            </div>
          </section>

          {/* Notes */}
          {invoice.notes && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="font-semibold">
                Notes
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {invoice.notes}
              </p>
            </section>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Payment Summary
                  </h2>

                  <p className="text-xs text-muted-foreground">
                    Invoice payment details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(
                  subtotal,
                )}
              />

              <SummaryRow
                label="Discount"
                value={`− ${formatCurrency(
                  discount,
                )}`}
              />

              <SummaryRow
                label="Tax"
                value={formatCurrency(tax)}
              />

              <div className="border-t pt-4">
                <SummaryRow
                  label="Total"
                  value={formatCurrency(total)}
                  emphasized
                />
              </div>

              <SummaryRow
                label="Amount paid"
                value={formatCurrency(
                  amountPaid,
                )}
              />

              <SummaryRow
                label="Balance due"
                value={formatCurrency(
                  amountDue,
                )}
                emphasized={amountDue > 0}
              />

              <div className="border-t pt-4">
                <SummaryRow
                  label="Payment method"
                  value={getPaymentMethodLabel(
                    invoice.paymentMethod,
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <SummaryRow
                  label="Invoice date"
                  value={formatDate(
                    invoice.invoiceDate,
                  )}
                />

                <div className="mt-3">
                  <SummaryRow
                    label="Due date"
                    value={formatDate(
                      invoice.dueDate,
                    )}
                  />
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span
        className={
          emphasized
            ? "font-semibold"
            : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}