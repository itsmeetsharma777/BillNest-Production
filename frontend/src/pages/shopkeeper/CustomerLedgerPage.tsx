import {
  ArrowLeft,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

interface LedgerInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod: string;
}

interface LedgerPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes?: string;
}

interface LedgerResponse {
  success: boolean;
  data?: {
    customer: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };

    summary: {
      totalPurchases: number;
      totalPaid: number;
      totalDue: number;
      totalInvoices: number;
      paidInvoices: number;
      partiallyPaidInvoices: number;
      unpaidInvoices: number;
    };

    invoices: LedgerInvoice[];
    payments: LedgerPayment[];
  };

  message?: string;
}

function currency(value: number) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function date(value?: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(parsed);
}

function dateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
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
  ).format(parsed);
}

function statusLabel(
  status: InvoiceStatus,
) {
  switch (status) {
    case "paid":
      return "Paid";

    case "partially_paid":
      return "Partially Paid";

    case "cancelled":
      return "Cancelled";

    default:
      return "Draft";
  }
}

function statusClass(
  status: InvoiceStatus,
) {
  switch (status) {
    case "paid":
      return "bg-green-500/10 text-green-700 dark:text-green-400";

    case "partially_paid":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "cancelled":
      return "bg-destructive/10 text-destructive";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function CustomerLedgerPage() {
  const { customerId } =
    useParams<{
      customerId: string;
    }>();

  const navigate = useNavigate();

  const [data, setData] =
    useState<
      LedgerResponse["data"] | null
    >(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadLedger() {
      if (!customerId) {
        setError(
          "Customer ID is missing.",
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/customers/${customerId}/ledger`,
            {
              credentials: "include",
            },
          );

        const result =
          (await response.json()) as LedgerResponse;

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Unable to load customer ledger.",
          );
        }

        if (mounted) {
          setData(
            result.data ?? null,
          );
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load customer ledger.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLedger();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading customer ledger...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/shopkeeper/customers",
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to customers
        </button>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {error ||
            "Customer ledger could not be loaded."}
        </div>
      </div>
    );
  }

  const {
    customer,
    summary,
    invoices,
    payments,
  } = data;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() =>
          navigate(
            "/shopkeeper/customers",
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to customers
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound className="size-4" />
            Customer Ledger
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {customer.name}
          </h1>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {customer.email && (
              <span>
                {customer.email}
              </span>
            )}

            {customer.phone && (
              <span>
                {customer.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={
            <Receipt className="size-5" />
          }
          label="Total purchases"
          value={currency(
            summary.totalPurchases,
          )}
        />

        <SummaryCard
          icon={
            <CreditCard className="size-5" />
          }
          label="Total paid"
          value={currency(
            summary.totalPaid,
          )}
        />

        <SummaryCard
          icon={
            <CreditCard className="size-5" />
          }
          label="Outstanding"
          value={currency(
            summary.totalDue,
          )}
          highlighted={
            summary.totalDue > 0
          }
        />

        <SummaryCard
          icon={
            <FileText className="size-5" />
          }
          label="Invoices"
          value={String(
            summary.totalInvoices,
          )}
        />
      </div>

      {/* Invoice stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MiniStat
          label="Paid invoices"
          value={summary.paidInvoices}
        />

        <MiniStat
          label="Partially paid"
          value={
            summary.partiallyPaidInvoices
          }
        />

        <MiniStat
          label="Unpaid invoices"
          value={
            summary.unpaidInvoices
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Invoices */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Invoice Ledger
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Every invoice issued to this customer.
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No invoices found.
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map(
                (invoice) => (
                  <button
                    type="button"
                    key={invoice.id}
                    onClick={() =>
                      navigate(
                        `/shopkeeper/invoices/${invoice.id}`,
                      )
                    }
                    className="w-full p-5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {invoice.invoiceNumber}
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(
                              invoice.status,
                            )}`}
                          >
                            {statusLabel(
                              invoice.status,
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Issued{" "}
                          {date(
                            invoice.issueDate,
                          )}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-semibold">
                          {currency(
                            invoice.total,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Paid{" "}
                          {currency(
                            invoice.amountPaid,
                          )}
                        </p>

                        {invoice.amountDue >
                          0 && (
                          <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            Due{" "}
                            {currency(
                              invoice.amountDue,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>

        {/* Payment history */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Payment History
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              All payments received from this customer.
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y">
              {payments.map(
                (payment) => (
                  <button
                    type="button"
                    key={payment.id}
                    onClick={() =>
                      navigate(
                        `/shopkeeper/invoices/${payment.invoiceId}`,
                      )
                    }
                    className="w-full p-5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {payment.invoiceNumber}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTime(
                            payment.paidAt,
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                            {payment.paymentMethod}
                          </span>

                          {payment.notes && (
                            <span className="text-xs text-muted-foreground">
                              {payment.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="shrink-0 font-bold text-green-600 dark:text-green-400">
                        +{" "}
                        {currency(
                          payment.amount,
                        )}
                      </p>
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-card p-5 shadow-sm",
        highlighted &&
          "border-amber-500/30 bg-amber-500/5",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 truncate text-xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}