import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  UserRound,
  XCircle,
  Plus,
  History,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  loadRazorpayCheckout,
  type RazorpayOrderResponse,
} from "@/lib/razorpay";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

type PaymentMethod =
  | "cash"
  | "online"
  | "cheque";

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

interface Payment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  referenceNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  notes?: string;
}

interface InvoiceResponse {
  success: boolean;

  data?: {
    invoice?: Invoice;
    items?: InvoiceItem[];
  };

  message?: string;
}

interface PaymentsResponse {
  success: boolean;

  data?: {
    invoice: {
      id: string;
      invoiceNumber: string;
      total: number;
      amountPaid: number;
      amountDue: number;
      status: InvoiceStatus;
    };

    payments: Payment[];
  };

  message?: string;
}

function formatCurrency(
  value: number | undefined,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value ?? 0);
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function normalizeStatus(
  status?: string,
): InvoiceStatus {
  switch (
    status?.toLowerCase()
  ) {
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
      return "border-destructive/30 bg-destructive/10 text-destructive";

    case "draft":
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

function getPaymentMethodLabel(
  method?: string,
) {
  switch (
    method?.toLowerCase()
  ) {
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

export default function InvoiceDetailsPage() {
  const navigate =
    useNavigate();

  const { invoiceId } =
    useParams();

  const [
    invoice,
    setInvoice,
  ] =
    useState<Invoice | null>(
      null,
    );

  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isPaymentsLoading,
    setIsPaymentsLoading,
  ] =
    useState(false);

  const [
    isActionLoading,
    setIsActionLoading,
  ] =
    useState(false);

  const [
    isPdfLoading,
    setIsPdfLoading,
  ] =
    useState(false);

  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] =
    useState(false);

  const [
    paymentAmount,
    setPaymentAmount,
  ] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>(
      "cash",
    );

  const [
    chequeNumber,
    setChequeNumber,
  ] = useState("");

  const [
    paymentNotes,
    setPaymentNotes,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function loadInvoice() {
    if (!invoiceId) {
      setError(
        "Invoice ID is missing.",
      );

      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response =
        await fetch(
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

        status:
          normalizeStatus(
            loadedInvoice.status,
          ),

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

  async function loadPayments() {
    if (!invoiceId) {
      return;
    }

    try {
      setIsPaymentsLoading(
        true,
      );

      const response =
        await fetch(
          `${API_URL}/invoices/${invoiceId}/payments`,
          {
            method: "GET",
            credentials: "include",
          },
        );

      const result =
        (await response.json()) as PaymentsResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to load payment history.",
        );
      }

      setPayments(
        result.data?.payments ??
          [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payment history.",
      );
    } finally {
      setIsPaymentsLoading(
        false,
      );
    }
  }

  useEffect(() => {
    void loadInvoice();
    void loadPayments();
  }, [invoiceId]);

  async function downloadInvoicePdf() {
    if (
      !invoiceId ||
      isPdfLoading
    ) {
      return;
    }

    try {
      setIsPdfLoading(true);
      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `${API_URL}/invoices/${invoiceId}/pdf`,
          {
            method: "GET",
            credentials: "include",
          },
        );

      if (!response.ok) {
        let message =
          "Unable to generate invoice PDF.";

        try {
          const result =
            (await response.json()) as {
              message?: string;
            };

          message =
            result.message ??
            message;
        } catch {
          // The server returned a non-JSON error.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      if (blob.size === 0) {
        throw new Error(
          "The generated invoice PDF is empty.",
        );
      }

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement(
          "a",
        );

      const invoiceNumber =
        invoice?.invoiceNo ??
        invoice?.invoiceNumber ??
        `invoice-${invoiceId}`;

      anchor.href = url;
      anchor.download =
        `${invoiceNumber}.pdf`;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(
          url,
        );
      }, 1000);

      setSuccessMessage(
        "Invoice PDF generated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate invoice PDF.",
      );
    } finally {
      setIsPdfLoading(false);
    }
  }

  async function recordPayment() {
    if (!invoiceId || !invoice) {
      return;
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (amount > amountDue) {
      setError("Payment amount cannot exceed the remaining balance.");
      return;
    }

    if (
      paymentMethod === "cheque" &&
      !chequeNumber.trim()
    ) {
      setError("Please enter the cheque number.");
      return;
    }

    setIsActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (paymentMethod === "online") {
        const orderResponse = await fetch(
          `${API_URL}/invoices/${invoiceId}/razorpay/order`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount,
            }),
          },
        );

        const orderResult =
          (await orderResponse.json()) as RazorpayOrderResponse;

        if (
          !orderResponse.ok ||
          !orderResult.data
        ) {
          throw new Error(
            orderResult.message ??
              "Unable to start Razorpay payment.",
          );
        }

        const orderData = orderResult.data;

        await loadRazorpayCheckout();

        if (!window.Razorpay) {
          throw new Error(
            "Razorpay Checkout is unavailable.",
          );
        }

        const razorpay =
          new window.Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "BillNest",
            description:
              `Invoice ${orderData.invoiceNumber}`,
            order_id: orderData.orderId,
            prefill: {
              name: invoice.customer?.name,
              email: invoice.customer?.email,
              contact: invoice.customer?.phone,
            },
            handler: async (razorpayResponse) => {
              try {
                const verifyResponse = await fetch(
                  `${API_URL}/invoices/${invoiceId}/razorpay/verify`,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      razorpayPaymentId:
                        razorpayResponse.razorpay_payment_id,
                      razorpayOrderId:
                        razorpayResponse.razorpay_order_id,
                      razorpaySignature:
                        razorpayResponse.razorpay_signature,
                    }),
                  },
                );

                const verifyResult =
                  (await verifyResponse.json()) as {
                    success: boolean;
                    message?: string;
                  };

                if (!verifyResponse.ok) {
                  throw new Error(
                    verifyResult.message ??
                      "Payment verification failed.",
                  );
                }

                setPaymentAmount("");
                setPaymentMethod("cash");
                setChequeNumber("");
                setPaymentNotes("");
                setIsPaymentModalOpen(false);
                setSuccessMessage(
                  verifyResult.message ??
                    "Online payment received successfully.",
                );

                await loadInvoice();
                await loadPayments();
              } catch (verificationError) {
                setError(
                  verificationError instanceof Error
                    ? verificationError.message
                    : "Payment verification failed.",
                );
              } finally {
                setIsActionLoading(false);
              }
            },
            modal: {
              ondismiss: () => {
                setIsActionLoading(false);
                setError(
                  "Razorpay checkout was closed. No payment was recorded.",
                );
              },
            },
          });

        razorpay.on(
          "payment.failed",
          (failure) => {
            setIsActionLoading(false);
            setError(
              failure.error?.description ??
                "Razorpay payment failed.",
            );
          },
        );

        razorpay.open();
        return;
      }

      const response = await fetch(
        `${API_URL}/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            paymentMethod,
            ...(paymentMethod === "cheque" && {
              referenceNumber: chequeNumber.trim(),
            }),
            notes:
              paymentNotes.trim() || undefined,
          }),
        },
      );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to record payment.",
        );
      }

      setPaymentAmount("");
      setPaymentNotes("");
      setPaymentMethod("cash");
      setChequeNumber("");
      setIsPaymentModalOpen(false);
      setSuccessMessage(
        result.message ??
          "Payment recorded successfully.",
      );

      await loadInvoice();
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record payment.",
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function performAction(
    endpoint: "pay" | "cancel",
  ) {
    if (!invoiceId || !invoice) {
      return;
    }

    const actionMessage =
      endpoint === "pay"
        ? "Mark this invoice as fully paid?"
        : "Cancel this invoice?";

    const confirmed = window.confirm(actionMessage);

    if (!confirmed) {
      return;
    }

    setIsActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        endpoint === "pay"
          ? `${API_URL}/invoices/${invoiceId}/pay`
          : `${API_URL}/invoices/${invoiceId}/cancel`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.message ??
            (endpoint === "pay"
              ? "Unable to mark invoice as paid."
              : "Unable to cancel invoice."),
        );
      }

      setSuccessMessage(
        result.message ??
          (endpoint === "pay"
            ? "Invoice marked as paid."
            : "Invoice cancelled successfully."),
      );

      await loadInvoice();
      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : endpoint === "pay"
            ? "Unable to mark invoice as paid."
            : "Unable to cancel invoice.",
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
              navigate(
                "/shopkeeper/invoices",
              )
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

  const subtotal =
    invoice.subtotal ?? 0;

  const discount =
    invoice.discount ?? 0;

  const tax =
    invoice.tax ?? 0;

  const total =
    invoice.total ?? 0;

  const amountPaid =
    invoice.amountPaid ?? 0;

  const amountDue =
    invoice.amountDue ??
    Math.max(
      0,
      total - amountPaid,
    );

  const status =
    normalizeStatus(
      invoice.status,
    );

  return (
    <>
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:mb-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/shopkeeper/invoices",
                )
              }
              className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-muted print:hidden"
              aria-label="Back to invoices"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />

                <span>
                  Invoices
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {invoiceNumber}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                >
                  {getStatusLabel(
                    status,
                  )}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Invoice created on{" "}
                {formatDate(
                  invoice.invoiceDate,
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() =>
                void downloadInvoicePdf()
              }
              disabled={
                isPdfLoading ||
                isActionLoading
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPdfLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Printer className="size-4" />
              )}

              {isPdfLoading
                ? "Generating PDF..."
                : "Print"}
            </button>

            {status !==
              "paid" &&
              status !==
                "cancelled" && (
                <button
                  type="button"
                  disabled={
                    isActionLoading ||
                    isPdfLoading
                  }
                  onClick={() =>
                    setIsPaymentModalOpen(
                      true,
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-60"
                >
                  <Plus className="size-4" />

                  Record Payment
                </button>
              )}

            {status !==
              "paid" &&
              status !==
                "cancelled" && (
                <button
                  type="button"
                  disabled={
                    isActionLoading ||
                    isPdfLoading
                  }
                  onClick={() =>
                    void performAction(
                      "pay",
                    )
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

            {status !==
              "cancelled" &&
              status !==
                "paid" && (
                <button
                  type="button"
                  disabled={
                    isActionLoading ||
                    isPdfLoading
                  }
                  onClick={() =>
                    void performAction(
                      "cancel",
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="size-4" />

                  Cancel Invoice
                </button>
              )}
          </div>
        </div>

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
                  {invoice.customer
                    ?.name ??
                    "Customer"}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {invoice.customer
                    ?.phone && (
                    <span>
                      {
                        invoice
                          .customer
                          .phone
                      }
                    </span>
                  )}

                  {invoice.customer
                    ?.email && (
                    <span>
                      {
                        invoice
                          .customer
                          .email
                      }
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Items */}
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="border-b p-5 sm:p-6">
                <h2 className="font-semibold">
                  Invoice Items
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Products and services included in this invoice.
                </p>
              </div>

              <div className="divide-y">
                {(
                  invoice.items ??
                  []
                ).map(
                  (
                    item,
                    index,
                  ) => {
                    const quantity =
                      Number(
                        item.quantity,
                      ) || 0;

                    const unitPrice =
                      Number(
                        item.unitPrice,
                      ) || 0;

                    const lineTotal =
                      item.lineTotal ??
                      item.total ??
                      item.lineSubtotal ??
                      quantity *
                        unitPrice;

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
                      </div>
                    );
                  },
                )}

                {(
                  invoice.items ??
                  []
                ).length ===
                  0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No invoice items found.
                  </div>
                )}
              </div>
            </section>

            {/* Payment History */}
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="border-b p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <History className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Payment History
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Every payment received against this invoice.
                    </p>
                  </div>
                </div>
              </div>

              {isPaymentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : payments.length ===
                0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="divide-y">
                  {payments.map(
                    (
                      payment,
                    ) => (
                      <div
                        key={
                          payment.id
                        }
                        className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {formatCurrency(
                                payment.amount,
                              )}
                            </p>

                            <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                              {getPaymentMethodLabel(
                                payment.paymentMethod,
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(
                              payment.paidAt,
                            )}
                          </p>

                          {payment.referenceNumber && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Reference:{" "}
                              {payment.referenceNumber}
                            </p>
                          )}

                          {payment.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {
                                payment.notes
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

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
                  value={formatCurrency(
                    tax,
                  )}
                />

                <div className="border-t pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(
                      total,
                    )}
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
                  emphasized={
                    amountDue > 0
                  }
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl">
            <div className="border-b p-5 sm:p-6">
              <h2 className="text-lg font-semibold">
                Record Payment
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Remaining balance:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    amountDue,
                  )}
                </span>
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Payment amount
                </label>

                <input
                  type="number"
                  min="0.01"
                  max={amountDue}
                  step="0.01"
                  value={
                    paymentAmount
                  }
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Enter amount"
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Payment method
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(event) => {
                    const value =
                      event.target
                        .value as PaymentMethod;

                    setPaymentMethod(value);

                    if (value !== "cheque") {
                      setChequeNumber("");
                    }
                  }
                  className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">
                    Cash
                  </option>

                  <option value="online">
                    Online
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>
                </select>
              </div>

              {paymentMethod === "cheque" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cheque number
                  </label>

                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(event) =>
                      setChequeNumber(
                        event.target.value,
                      )
                    }
                    placeholder="Enter cheque number"
                    maxLength={50}
                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Notes
                  <span className="ml-1 text-xs text-muted-foreground">
                    optional
                  </span>
                </label>

                <textarea
                  value={
                    paymentNotes
                  }
                  onChange={(event) =>
                    setPaymentNotes(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Payment reference or note"
                  rows={3}
                  className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Current balance
                  </span>

                  <span className="font-medium">
                    {formatCurrency(
                      amountDue,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    New payment
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(
                      Number(
                        paymentAmount,
                      ) || 0,
                    )}
                  </span>
                </div>

                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Balance after payment
                    </span>

                    <span className="font-bold">
                      {formatCurrency(
                        Math.max(
                          0,
                          amountDue -
                            (Number(
                              paymentAmount,
                            ) || 0),
                        ),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-5 sm:p-6">
              <button
                type="button"
                disabled={
                  isActionLoading
                }
                onClick={() =>
                  setIsPaymentModalOpen(
                    false,
                  )
                }
                className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isActionLoading ||
                  !paymentAmount
                }
                onClick={() =>
                  void recordPayment()
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionLoading && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
