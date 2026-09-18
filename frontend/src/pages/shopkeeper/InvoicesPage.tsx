import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type InvoiceStatus =
  | "DRAFT"
  | "PAID"
  | "PARTIALLY_PAID"
  | "CANCELLED";

interface Invoice {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName?: string;
  productNames: string[];
  date: string;
  status: InvoiceStatus | string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoicesResponse {
  success: boolean;
  data?: {
    invoices?: InvoiceApiRecord[];
    total?: number;
  };
  message?: string;
}

interface InvoiceApiRecord {
  id?: string;
  _id?: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  number?: string;

  customerId?: string;

  customerName?: string;

  customer?: {
    id?: string;
    _id?: string;
    name?: string;
  };

  productNames?: string[];

  date?: string;
  invoiceDate?: string;

  status?: string;

  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  amountPaid?: number;
  paymentMethod?: string;

  createdAt?: string;
  updatedAt?: string;
}

function normalizeInvoice(
  invoice: InvoiceApiRecord,
): Invoice {
  return {
    id:
      invoice.id ??
      invoice._id ??
      "",

    invoiceNo:
      invoice.invoiceNo ??
      invoice.invoiceNumber ??
      invoice.number ??
      "—",

    customerId:
      invoice.customerId ??
      invoice.customer?.id ??
      invoice.customer?._id,

    customerName:
      invoice.customerName ??
      invoice.customer?.name,

    productNames:
      Array.isArray(invoice.productNames)
        ? invoice.productNames.filter(
            (name): name is string =>
              typeof name === "string" &&
              name.trim().length > 0,
          )
        : [],

    date:
      invoice.date ??
      invoice.invoiceDate ??
      invoice.createdAt ??
      "",

    status:
      invoice.status ??
      "DRAFT",

    subtotal:
      Number(invoice.subtotal ?? 0),

    discount:
      Number(invoice.discount ?? 0),

    tax:
      Number(invoice.tax ?? 0),

    total:
      Number(invoice.total ?? 0),

    amountPaid:
      Number(invoice.amountPaid ?? 0),

    paymentMethod:
      invoice.paymentMethod,

    createdAt:
      invoice.createdAt ??
      "",

    updatedAt:
      invoice.updatedAt ??
      "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
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
  ).format(parsed);
}

function getStatusLabel(
  status: string,
) {
  switch (status) {
    case "PAID":
      return "Paid";

    case "PARTIALLY_PAID":
      return "Partially paid";

    case "CANCELLED":
      return "Cancelled";

    case "DRAFT":
      return "Draft";

    default:
      return status
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase(),
        );
  }
}

function getStatusStyles(
  status: string,
) {
  switch (status) {
    case "PAID":
      return {
        className:
          "bg-green-500/10 text-green-700 dark:text-green-400",
        icon: CheckCircle2,
      };

    case "PARTIALLY_PAID":
      return {
        className:
          "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        icon: Clock3,
      };

    case "CANCELLED":
      return {
        className:
          "bg-red-500/10 text-red-700 dark:text-red-400",
        icon: XCircle,
      };

    case "DRAFT":
    default:
      return {
        className:
          "bg-muted text-muted-foreground",
        icon: FileText,
      };
  }
}

export default function InvoicesPage() {
  const navigate =
    useNavigate();

  const [
    invoices,
    setInvoices,
  ] = useState<Invoice[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "ALL" | InvoiceStatus
  >("ALL");

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const loadInvoices =
    useCallback(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/invoices`,
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
              "Unable to load invoices.",
          );
        }

        const records =
          result.data?.invoices ??
          [];

        setInvoices(
          records.map(
            normalizeInvoice,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invoices.",
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
        search
          .trim()
          .toLowerCase();

      return invoices.filter(
        (invoice) => {
          const matchesStatus =
            statusFilter ===
              "ALL" ||
            invoice.status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            invoice.invoiceNo,
            invoice.customerName,
            invoice.customerId,
            invoice.paymentMethod,
            ...invoice.productNames,
          ]
            .filter(Boolean)
            .some(
              (value) =>
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

  const totalSales =
    useMemo(
      () =>
        invoices
          .filter(
            (invoice) =>
              invoice.status !==
                "CANCELLED" &&
              invoice.status !==
                "DRAFT",
          )
          .reduce(
            (sum, invoice) =>
              sum +
              invoice.total,
            0,
          ),
      [invoices],
    );

  const paidCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
        "PAID",
    ).length;

  const pendingCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
          "PARTIALLY_PAID" ||
        invoice.status ===
          "DRAFT",
    ).length;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            <span>Invoices</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your Invoices
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage and track your business invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/shopkeeper/invoices/new",
            )
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <FileText className="size-5" />
          }
          label="Total invoices"
          value={String(
            invoices.length,
          )}
        />

        <StatCard
          icon={
            <CheckCircle2 className="size-5" />
          }
          label="Paid"
          value={String(
            paidCount,
          )}
          iconClassName="bg-green-500/10 text-green-600 dark:text-green-400"
        />

        <StatCard
          icon={
            <Clock3 className="size-5" />
          }
          label="Pending"
          value={String(
            pendingCount,
          )}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />

        <StatCard
          icon={
            <CalendarDays className="size-5" />
          }
          label="Recorded sales"
          value={formatCurrency(
            totalSales,
          )}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search invoice, customer or product..."
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | "ALL"
                  | InvoiceStatus,
              )
            }
            className="h-10 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 lg:w-48"
            aria-label="Filter invoices by status"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="PAID">
              Paid
            </option>

            <option value="PARTIALLY_PAID">
              Partially paid
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          onClick={() =>
            void loadInvoices()
          }
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && (
            <Loader2 className="size-4 animate-spin" />
          )}

          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-destructive">
              Couldn't load invoices
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadInvoices()
            }
            className="shrink-0 text-xs font-semibold text-destructive hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />

            <div>
              <p className="text-sm font-semibold">
                Loading invoices
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Fetching your invoice records...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
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
              statusFilter !==
                "ALL"
                ? "No invoices found"
                : "No invoices yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {search ||
              statusFilter !==
                "ALL"
                ? "Try changing your search or status filter."
                : "Create your first invoice to start recording sales."}
            </p>

            {!search &&
              statusFilter ===
                "ALL" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/shopkeeper/invoices/new",
                    )
                  }
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Plus className="size-4" />
                  Create Invoice
                </button>
              )}
          </div>
        )}

      {/* Invoice list */}
      {!isLoading &&
        filteredInvoices.length >
          0 && (
          <>
            {/* Desktop */}
            <div className="hidden rounded-2xl border bg-card shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3.5">
                        Invoice
                      </th>

                      <th className="px-5 py-3.5">
                        Customer
                      </th>

                      <th className="px-5 py-3.5">
                        Product(s)
                      </th>

                      <th className="px-5 py-3.5">
                        Date
                      </th>

                      <th className="px-5 py-3.5">
                        Amount
                      </th>

                      <th className="px-5 py-3.5">
                        Paid
                      </th>

                      <th className="px-5 py-3.5">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredInvoices.map(
                      (invoice) => (
                        <tr
                          key={
                            invoice.id
                          }
                          className="transition-colors hover:bg-muted/30"
                        >
                          {/* Invoice */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                              </div>

                              <div>
                                <p className="text-sm font-semibold">
                                  {
                                    invoice.invoiceNo
                                  }
                                </p>

                                {invoice.paymentMethod && (
                                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                    {
                                      invoice.paymentMethod
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <p className="max-w-52 truncate text-sm font-medium">
                              {
                                invoice.customerName ??
                                "Customer"
                              }
                            </p>

                            {invoice.customerId && (
                              <p className="mt-0.5 max-w-52 truncate text-xs text-muted-foreground">
                                {
                                  invoice.customerId
                                }
                              </p>
                            )}
                          </td>

                          {/* Products */}
                          <td className="px-5 py-4">
                            {invoice.productNames.length >
                            0 ? (
                              <div className="max-w-64">
                                <p
                                  className="truncate text-sm font-medium"
                                  title={invoice.productNames.join(
                                    ", ",
                                  )}
                                >
                                  {invoice.productNames.join(
                                    ", ",
                                  )}
                                </p>

                                {invoice.productNames.length >
                                  1 && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {
                                      invoice
                                        .productNames
                                        .length
                                    }{" "}
                                    products
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                            {formatDate(
                              invoice.date,
                            )}
                          </td>

                          {/* Amount */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                            {formatCurrency(
                              invoice.total,
                            )}
                          </td>

                          {/* Paid */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
                            {formatCurrency(
                              invoice.amountPaid,
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                invoice.status
                              }
                            />
                          </td>

                          {/* Action */}
                          <td className="px-5 py-4 text-right">
                            <InvoiceActions
                              invoice={
                                invoice
                              }
                              open={
                                openMenuId ===
                                invoice.id
                              }
                              onToggle={() =>
                                setOpenMenuId(
                                  (
                                    current,
                                  ) =>
                                    current ===
                                    invoice.id
                                      ? null
                                      : invoice.id,
                                )
                              }
                              onClose={() =>
                                setOpenMenuId(
                                  null,
                                )
                              }
                            />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                Showing{" "}
                {
                  filteredInvoices.length
                }{" "}
                of{" "}
                {invoices.length}{" "}
                invoices
              </div>
            </div>

            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {filteredInvoices.map(
                (invoice) => (
                  <div
                    key={
                      invoice.id
                    }
                    className="rounded-2xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {
                                invoice.invoiceNo
                              }
                            </p>

                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {
                                invoice.customerName ??
                                "Customer"
                              }
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              invoice.status
                            }
                          />
                        </div>

                        {/* Product(s) */}
                        <div className="mt-3 rounded-xl bg-muted/40 px-3 py-2.5">
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Product(s)
                          </p>

                          <p
                            className="mt-0.5 text-sm font-medium"
                            title={invoice.productNames.join(
                              ", ",
                            )}
                          >
                            {invoice.productNames.length >
                            0
                              ? invoice.productNames.join(
                                  ", ",
                                )
                              : "—"}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Date
                            </p>

                            <p className="mt-0.5 text-sm font-medium">
                              {formatDate(
                                invoice.date,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Total
                            </p>

                            <p className="mt-0.5 text-sm font-semibold">
                              {formatCurrency(
                                invoice.total,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Paid
                            </p>

                            <p className="mt-0.5 text-sm font-medium">
                              {formatCurrency(
                                invoice.amountPaid,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Payment
                            </p>

                            <p className="mt-0.5 text-sm font-medium capitalize">
                              {invoice.paymentMethod ??
                                "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <InvoiceActions
                            invoice={
                              invoice
                            }
                            open={
                              openMenuId ===
                              invoice.id
                            }
                            onToggle={() =>
                              setOpenMenuId(
                                (
                                  current,
                                ) =>
                                  current ===
                                  invoice.id
                                    ? null
                                    : invoice.id,
                              )
                            }
                            onClose={() =>
                              setOpenMenuId(
                                null,
                              )
                            }
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="mt-3 text-center text-xs text-muted-foreground md:hidden">
              Showing{" "}
              {
                filteredInvoices.length
              }{" "}
              of{" "}
              {invoices.length}{" "}
              invoices
            </div>
          </>
        )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconClassName =
    "bg-primary/10 text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="truncate text-xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    getStatusStyles(status);

  const Icon =
    styles.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles.className}`}
    >
      <Icon className="size-3.5" />

      {getStatusLabel(status)}
    </span>
  );
}

function InvoiceActions({
  invoice,
  open,
  onToggle,
  onClose,
  fullWidth = false,
}: {
  invoice: Invoice;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  fullWidth?: boolean;
}) {
  const navigate =
    useNavigate();

  const buttonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const [
    menuPosition,
    setMenuPosition,
  ] = useState({
    top: 0,
    left: 0,
  });

  const updateMenuPosition =
    useCallback(() => {
      if (!buttonRef.current) {
        return;
      }

      const rect =
        buttonRef.current.getBoundingClientRect();

      const menuWidth = 192;

      const left = Math.max(
        8,
        Math.min(
          rect.right -
            menuWidth,
          window.innerWidth -
            menuWidth -
            8,
        ),
      );

      const top =
        rect.bottom + 6;

      setMenuPosition({
        top,
        left,
      });
    }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();

    const handleViewportChange =
      () => {
        updateMenuPosition();
      };

    window.addEventListener(
      "resize",
      handleViewportChange,
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleViewportChange,
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true,
      );
    };
  }, [
    open,
    updateMenuPosition,
  ]);

  function viewInvoice() {
    onClose();

    if (!invoice.id) {
      return;
    }

    navigate(
      `/shopkeeper/invoices/${invoice.id}`,
    );
  }

  const menu =
    open &&
    typeof document !==
      "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[90] cursor-default"
              aria-label="Close invoice actions"
              onClick={onClose}
            />

            <div
              className="fixed z-[100] w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl"
              style={{
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              role="menu"
            >
              <button
                type="button"
                onClick={
                  viewInvoice
                }
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                role="menuitem"
              >
                View invoice
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                role="menuitem"
              >
                Download PDF
              </button>

              {invoice.status !==
                "PAID" &&
                invoice.status !==
                  "CANCELLED" && (
                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    role="menuitem"
                  >
                    Mark as paid
                  </button>
                )}

              {invoice.status !==
                "CANCELLED" && (
                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  role="menuitem"
                >
                  Cancel invoice
                </button>
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={
          fullWidth
            ? "w-full"
            : "inline-block"
        }
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!open) {
              updateMenuPosition();
            }

            onToggle();
          }}
          className={[
            "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3",
            "text-xs font-medium text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            fullWidth
              ? "w-full"
              : "",
          ].join(" ")}
          aria-label={`Actions for ${invoice.invoiceNo}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="size-4" />

          {fullWidth && (
            <span>
              Actions
            </span>
          )}
        </button>
      </div>

      {menu}
    </>
  );
}