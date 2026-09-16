import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type WarrantyStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "no_warranty";

interface Warranty {
  id: string;
  customerId: string;
  invoiceId?: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  terms?: string;
  notes?: string;
  isActive: boolean;
  customer?: {
    id?: string;
    _id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface ApiWarranty {
  _id?: string;
  id?: string;
  customerId?: string;
  invoiceId?: string;
  invoiceItemId?: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  terms?: string;
  notes?: string;
  isActive?: boolean;
  customer?: Warranty["customer"];
}

interface WarrantiesResponse {
  success: boolean;
  data?: {
    warranties?: ApiWarranty[];
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

const statusConfig: Record<
  WarrantyStatus,
  {
    label: string;
    icon: typeof ShieldCheck;
    className: string;
  }
> = {
  active: {
    label: "Active",
    icon: ShieldCheck,
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  expiring_soon: {
    label: "Expiring Soon",
    icon: Clock3,
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  expired: {
    label: "Expired",
    icon: ShieldX,
    className:
      "border-destructive/20 bg-destructive/10 text-destructive",
  },
  no_warranty: {
    label: "No Warranty",
    icon: ShieldX,
    className:
      "border-muted bg-muted text-muted-foreground",
  },
};

function normalizeWarranty(
  warranty: ApiWarranty,
): Warranty | null {
  const id = warranty.id ?? warranty._id;

  if (!id || !warranty.customerId) {
    return null;
  }

  return {
    id,
    customerId: warranty.customerId,
    invoiceId: warranty.invoiceId,
    productName: warranty.productName,
    serialNumber: warranty.serialNumber,
    warrantyPeriodMonths: warranty.warrantyPeriodMonths,
    startDate: warranty.startDate,
    expiryDate: warranty.expiryDate,
    status: warranty.status,
    terms: warranty.terms,
    notes: warranty.notes,
    isActive: warranty.isActive ?? true,
    customer: warranty.customer,
  };
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

function getCustomerName(warranty: Warranty) {
  return warranty.customer?.name ?? "Customer";
}

function getDaysRemaining(expiryDate: string) {
  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();

  if (Number.isNaN(expiry)) {
    return null;
  }

  return Math.ceil(
    (expiry - now) / (1000 * 60 * 60 * 24),
  );
}

export default function WarrantiesPage() {
  const navigate = useNavigate();

  const [warranties, setWarranties] = useState<Warranty[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | WarrantyStatus
  >("all");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWarranties() {
      try {
        setIsLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const response = await fetch(
          `${API_URL}/warranties?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          },
        );

        let result: WarrantiesResponse;

        try {
          result =
            (await response.json()) as WarrantiesResponse;
        } catch {
          throw new Error(
            "The server returned an invalid response.",
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Failed to load warranties.",
          );
        }

        const normalized = (
          result.data?.warranties ?? []
        )
          .map(normalizeWarranty)
          .filter(
            (warranty): warranty is Warranty =>
              warranty !== null,
          );

        setWarranties(normalized);

        setHasMore(
          result.data?.pagination?.hasMore ?? false,
        );
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load warranties.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadWarranties();

    return () => {
      controller.abort();
    };
  }, [page, statusFilter]);

  const filteredWarranties = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return warranties;
    }

    return warranties.filter((warranty) => {
      const productMatches = warranty.productName
        .toLowerCase()
        .includes(query);

      const serialMatches = Boolean(
        warranty.serialNumber
          ?.toLowerCase()
          .includes(query),
      );

      const customerMatches = getCustomerName(warranty)
        .toLowerCase()
        .includes(query);

      return (
        productMatches ||
        serialMatches ||
        customerMatches
      );
    });
  }, [search, warranties]);

  const stats = useMemo(() => {
    return {
      total: warranties.length,
      active: warranties.filter(
        (item) => item.status === "active",
      ).length,
      expiring: warranties.filter(
        (item) => item.status === "expiring_soon",
      ).length,
      expired: warranties.filter(
        (item) => item.status === "expired",
      ).length,
    };
  }, [warranties]);

  function getStatusBadge(status: WarrantyStatus) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
      >
        <Icon className="size-3.5" />
        {config.label}
      </span>
    );
  }

  function handleStatusChange(
    nextStatus: "all" | WarrantyStatus,
  ) {
    setPage(1);
    setStatusFilter(nextStatus);
  }

  function handleRetry() {
    setError("");
    setPage((current) => current);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" />
            Warranty Management
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Warranties
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Track customer warranties and expiration dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/shopkeeper/warranties/new")
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="size-4" />
          New Warranty
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total on Page"
          value={stats.total}
          icon={ShieldCheck}
        />

        <StatCard
          label="Active"
          value={stats.active}
          icon={ShieldCheck}
        />

        <StatCard
          label="Expiring Soon"
          value={stats.expiring}
          icon={Clock3}
        />

        <StatCard
          label="Expired"
          value={stats.expired}
          icon={ShieldX}
        />
      </div>

      {/* Controls */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product, serial number or customer..."
              aria-label="Search warranties"
              className="h-10 w-full rounded-xl border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              handleStatusChange(
                event.target.value as
                  | "all"
                  | WarrantyStatus,
              )
            }
            aria-label="Filter warranties by status"
            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">
              Expiring Soon
            </option>
            <option value="expired">Expired</option>
            <option value="no_warranty">
              No Warranty
            </option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">
                Unable to load warranties
              </p>

              <p className="mt-1 text-sm text-destructive/80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="w-fit rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-7 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Loading warranties...
            </p>
          </div>
        </div>
      ) : filteredWarranties.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="size-7 text-primary" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            {search || statusFilter !== "all"
              ? "No warranties found"
              : "No warranties yet"}
          </h2>

          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Try changing your search or filter."
              : "Create your first warranty to start tracking customer coverage."}
          </p>

          {!search && statusFilter === "all" && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/shopkeeper/warranties/new",
                )
              }
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Plus className="size-4" />
              Create Warranty
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b bg-muted/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Start Date
                    </th>

                    <th className="px-5 py-4">
                      Expiry
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
                  {filteredWarranties.map(
                    (warranty) => {
                      const daysRemaining =
                        getDaysRemaining(
                          warranty.expiryDate,
                        );

                      return (
                        <tr
                          key={warranty.id}
                          className="transition hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <ShieldCheck className="size-5 text-primary" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {warranty.productName}
                                </p>

                                {warranty.serialNumber && (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    S/N:{" "}
                                    {warranty.serialNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <UserRound className="size-4 text-muted-foreground" />

                              <div>
                                <p className="text-sm font-medium">
                                  {getCustomerName(
                                    warranty,
                                  )}
                                </p>

                                {warranty.customer
                                  ?.phone && (
                                  <p className="text-xs text-muted-foreground">
                                    {
                                      warranty
                                        .customer.phone
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {formatDate(
                              warranty.startDate,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium">
                              {formatDate(
                                warranty.expiryDate,
                              )}
                            </p>

                            {daysRemaining !== null &&
                              warranty.status ===
                                "expiring_soon" && (
                                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                                  {Math.max(
                                    daysRemaining,
                                    0,
                                  )}{" "}
                                  days left
                                </p>
                              )}
                          </td>

                          <td className="px-5 py-4">
                            {getStatusBadge(
                              warranty.status,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/shopkeeper/warranties/${warranty.id}`,
                                )
                              }
                              className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <Eye className="size-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet */}
          <div className="grid gap-4 lg:hidden">
            {filteredWarranties.map((warranty) => {
              const daysRemaining =
                getDaysRemaining(
                  warranty.expiryDate,
                );

              return (
                <div
                  key={warranty.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <ShieldCheck className="size-5 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {warranty.productName}
                        </h3>

                        {warranty.serialNumber && (
                          <p className="truncate text-xs text-muted-foreground">
                            S/N:{" "}
                            {warranty.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {getStatusBadge(
                      warranty.status,
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoItem
                      icon={UserRound}
                      label="Customer"
                      value={getCustomerName(
                        warranty,
                      )}
                    />

                    <InfoItem
                      icon={CalendarDays}
                      label="Expiry"
                      value={formatDate(
                        warranty.expiryDate,
                      )}
                    />
                  </div>

                  {warranty.status ===
                    "expiring_soon" &&
                    daysRemaining !== null && (
                      <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Warranty expires in{" "}
                        {Math.max(
                          daysRemaining,
                          0,
                        )}{" "}
                        days.
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/shopkeeper/warranties/${warranty.id}`,
                      )
                    }
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Eye className="size-4" />
                    View Warranty
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium">
                Page {page}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Showing {filteredWarranties.length}{" "}
                warranty
                {filteredWarranties.length === 1
                  ? ""
                  : "ies"}{" "}
                on this page
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1 || isLoading}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                aria-label="Previous page"
                className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft className="size-4" />
              </button>

              <button
                type="button"
                disabled={!hasMore || isLoading}
                onClick={() =>
                  setPage((current) => current + 1)
                }
                aria-label="Next page"
                className="inline-flex size-9 items-center justify-center rounded-lg border transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>

      <p className="mt-1 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}