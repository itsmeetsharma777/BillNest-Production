import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  terms?: string;
  notes?: string;
  invoiceId: string;
  invoiceItemId: string;
}

interface WarrantiesResponse {
  success: boolean;
  data?: {
    warranties?: Array<{
      _id?: string;
      id?: string;
      productName?: string;
      serialNumber?: string;
      warrantyPeriodMonths?: number;
      startDate?: string;
      expiryDate?: string;
      status?: string;
      terms?: string;
      notes?: string;
      invoiceId?: string;
      invoiceItemId?: string;
    }>;
    total?: number;
  };
  message?: string;
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

function normalizeStatus(status?: string): WarrantyStatus {
  switch (status?.toLowerCase()) {
    case "active":
      return "active";

    case "expiring_soon":
      return "expiring_soon";

    case "expired":
      return "expired";

    case "no_warranty":
      return "no_warranty";

    default:
      return "no_warranty";
  }
}

function getStatusLabel(status: WarrantyStatus) {
  switch (status) {
    case "active":
      return "Active";

    case "expiring_soon":
      return "Expiring Soon";

    case "expired":
      return "Expired";

    case "no_warranty":
      return "No Warranty";
  }
}

function getStatusClass(status: WarrantyStatus) {
  switch (status) {
    case "active":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400";

    case "expiring_soon":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";

    case "expired":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";

    case "no_warranty":
      return "border-muted bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: WarrantyStatus) {
  switch (status) {
    case "active":
      return CheckCircle2;

    case "expiring_soon":
      return Clock3;

    case "expired":
    case "no_warranty":
      return XCircle;
  }
}

export default function CustomerWarrantiesPage() {
  const navigate = useNavigate();

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | WarrantyStatus>("ALL");

  const loadWarranties = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customer/warranties`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as WarrantiesResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to load your warranties.",
        );
      }

      const records = result.data?.warranties ?? [];

      setWarranties(
        records
          .map((warranty) => ({
            id:
              warranty._id ??
              warranty.id ??
              "",
            productName:
              warranty.productName ??
              "Product",
            serialNumber:
              warranty.serialNumber,
            warrantyPeriodMonths:
              warranty.warrantyPeriodMonths ?? 0,
            startDate:
              warranty.startDate ?? "",
            expiryDate:
              warranty.expiryDate ?? "",
            status:
              normalizeStatus(warranty.status),
            terms: warranty.terms,
            notes: warranty.notes,
            invoiceId:
              warranty.invoiceId ?? "",
            invoiceItemId:
              warranty.invoiceItemId ?? "",
          }))
          .filter(
            (warranty) => warranty.id.length > 0,
          ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your warranties.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarranties();
  }, [loadWarranties]);

  const filteredWarranties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return warranties.filter((warranty) => {
      if (
        statusFilter !== "ALL" &&
        warranty.status !== statusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        warranty.productName,
        warranty.serialNumber,
        getStatusLabel(warranty.status),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [warranties, search, statusFilter]);

  const activeCount = warranties.filter(
    (warranty) => warranty.status === "active",
  ).length;

  const expiringCount = warranties.filter(
    (warranty) => warranty.status === "expiring_soon",
  ).length;

  const expiredCount = warranties.filter(
    (warranty) => warranty.status === "expired",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Customer portal
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Warranties
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Track your product warranties and expiry dates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadWarranties()}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total warranties
          </p>

          <p className="mt-2 text-2xl font-bold">
            {warranties.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Active
          </p>

          <p className="mt-2 text-2xl font-bold">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Expiring soon
          </p>

          <p className="mt-2 text-2xl font-bold">
            {expiringCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Expired
          </p>

          <p className="mt-2 text-2xl font-bold">
            {expiredCount}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products or serial numbers..."
            className="h-10 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | WarrantyStatus,
            )
          }
          className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">All statuses</option>
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

      {isLoading && (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

            <p className="text-sm text-muted-foreground">
              Loading your warranties...
            </p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />

            <div>
              <h2 className="font-semibold">
                Unable to load warranties
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadWarranties()}
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        filteredWarranties.length === 0 && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </div>

            <h2 className="text-lg font-semibold">
              {search || statusFilter !== "ALL"
                ? "No warranties found"
                : "No warranties yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or status filter."
                : "Product warranties associated with your purchases will appear here."}
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredWarranties.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-4">
                        Product
                      </th>

                      <th className="px-5 py-4">
                        Start date
                      </th>

                      <th className="px-5 py-4">
                        Expiry date
                      </th>

                      <th className="px-5 py-4">
                        Period
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
                        const StatusIcon =
                          getStatusIcon(
                            warranty.status,
                          );

                        return (
                          <tr
                            key={warranty.id}
                            className="transition-colors hover:bg-muted/30"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <ShieldCheck className="size-4" />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold">
                                    {warranty.productName}
                                  </p>

                                  {warranty.serialNumber && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      Serial:{" "}
                                      {
                                        warranty.serialNumber
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                              {formatDate(
                                warranty.startDate,
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                              {formatDate(
                                warranty.expiryDate,
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                              {
                                warranty.warrantyPeriodMonths
                              }{" "}
                              month
                              {warranty.warrantyPeriodMonths ===
                              1
                                ? ""
                                : "s"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(warranty.status)}`}
                              >
                                <StatusIcon className="size-3.5" />
                                {getStatusLabel(
                                  warranty.status,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/customer/warranties/${warranty.id}`,
                                  )
                                }
                                className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                              >
                                View warranty
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

            <div className="space-y-3 md:hidden">
              {filteredWarranties.map((warranty) => {
                const StatusIcon =
                  getStatusIcon(warranty.status);

                return (
                  <button
                    key={warranty.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/customer/warranties/${warranty.id}`,
                      )
                    }
                    className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {warranty.productName}
                          </p>

                          {warranty.serialNumber && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              Serial:{" "}
                              {warranty.serialNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClass(warranty.status)}`}
                      >
                        <StatusIcon className="size-3" />
                        {getStatusLabel(
                          warranty.status,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          Start
                        </div>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            warranty.startDate,
                          )}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          Expiry
                        </div>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            warranty.expiryDate,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-muted-foreground">
                        Warranty period
                      </span>

                      <span className="text-xs font-semibold">
                        {warranty.warrantyPeriodMonths}{" "}
                        month
                        {warranty.warrantyPeriodMonths ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
    </div>
  );
}