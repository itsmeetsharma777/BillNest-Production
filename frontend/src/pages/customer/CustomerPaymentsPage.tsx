import {
  CreditCard,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status:
    | "draft"
    | "paid"
    | "partially_paid"
    | "cancelled";
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod: string;
}

interface Payment {
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
    summary: {
      totalPurchases: number;
      totalPaid: number;
      totalDue: number;
      totalInvoices: number;
      paidInvoices: number;
      partiallyPaidInvoices: number;
      unpaidInvoices: number;
    };

    invoices: Invoice[];
    payments: Payment[];
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
  status: Invoice["status"],
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
  status: Invoice["status"],
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

export default function CustomerPaymentsPage() {
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
      try {
        setIsLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/customer/ledger`,
            {
              credentials: "include",
            },
          );

        const result =
          (await response.json()) as LedgerResponse;

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Unable to load your payment ledger.",
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
              : "Unable to load your payment ledger.",
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
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading your payment ledger...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          {error ||
            "Unable to load your payment ledger."}
        </div>
      </div>
    );
  }

  const {
    summary,
    invoices,
    payments,
  } = data;

  const outstandingInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !==
          "cancelled" &&
        invoice.amountDue > 0,
    );

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="size-4" />
          Payments
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Payment Ledger
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Track your purchases, payments and outstanding balance.
        </p>
      </div>

      {/* Summary */}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Outstanding */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">
              Outstanding Invoices
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Invoices that still have a balance.
            </p>
          </div>

          {outstandingInvoices.length ===
          0 ? (
            <div className="flex min-h-48 items-center justify-center p-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  <CreditCard className="size-5" />
                </div>

                <p className="font-semibold">
                  Nothing outstanding
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  All your invoices are fully paid.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {outstandingInvoices.map(
                (invoice) => (
                  <button
                    type="button"
                    key={invoice.id}
                    onClick={() =>
                      navigate(
                        `/customer/invoices/${invoice.id}`,
                      )
                    }
                    className="w-full p-5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {
                            invoice.invoiceNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Due{" "}
                          {date(
                            invoice.dueDate,
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {currency(
                            invoice.amountDue,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          of{" "}
                          {currency(
                            invoice.total,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
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
              Payments received against your invoices.
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payment history available yet.
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
                        `/customer/invoices/${payment.invoiceId}`,
                      )
                    }
                    className="w-full p-5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {
                            payment.invoiceNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTime(
                            payment.paidAt,
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2.5 py-1 text-[11px] font-medium">
                            {
                              payment.paymentMethod
                            }
                          </span>

                          {payment.notes && (
                            <span className="text-xs text-muted-foreground">
                              {
                                payment.notes
                              }
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