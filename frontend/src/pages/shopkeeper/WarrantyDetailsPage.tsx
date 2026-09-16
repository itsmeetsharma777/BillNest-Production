import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  ShieldCheck,
  ShieldX,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  invoiceItemId?: string;
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
  customerId: string;
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

interface WarrantyResponse {
  success: boolean;
  data?: {
    warranty?: ApiWarranty;
  };
  message?: string;
}

function normalizeWarranty(
  warranty: ApiWarranty,
): Warranty {
  return {
    id: warranty.id ?? warranty._id ?? "",
    customerId: warranty.customerId,
    invoiceId: warranty.invoiceId,
    invoiceItemId: warranty.invoiceItemId,
    productName: warranty.productName,
    serialNumber: warranty.serialNumber,
    warrantyPeriodMonths:
      warranty.warrantyPeriodMonths,
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
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDaysRemaining(expiryDate: string) {
  const expiry = new Date(expiryDate).getTime();

  if (Number.isNaN(expiry)) {
    return null;
  }

  return Math.ceil(
    (expiry - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
}

function getStatusConfig(status: WarrantyStatus) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        icon: ShieldCheck,
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };

    case "expiring_soon":
      return {
        label: "Expiring Soon",
        icon: Clock3,
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };

    case "expired":
      return {
        label: "Expired",
        icon: ShieldX,
        className:
          "border-destructive/20 bg-destructive/10 text-destructive",
      };

    default:
      return {
        label: "No Warranty",
        icon: ShieldX,
        className:
          "border-muted bg-muted text-muted-foreground",
      };
  }
}

export default function WarrantyDetailsPage() {
  const navigate = useNavigate();
  const { warrantyId } = useParams<{
    warrantyId: string;
  }>();

  const [warranty, setWarranty] =
    useState<Warranty | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isDeactivating, setIsDeactivating] =
    useState(false);

  const [error, setError] = useState("");

  const [showDeactivateConfirm, setShowDeactivateConfirm] =
    useState(false);

  async function loadWarranty() {
    if (!warrantyId) {
      setError("Invalid warranty ID.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/warranties/${warrantyId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as WarrantyResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Failed to load warranty.",
        );
      }

      if (!result.data?.warranty) {
        throw new Error(
          "Warranty data was not returned.",
        );
      }

      setWarranty(
        normalizeWarranty(
          result.data.warranty,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load warranty.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadWarranty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warrantyId]);

  async function deactivateWarranty() {
    if (!warrantyId) return;

    try {
      setIsDeactivating(true);
      setError("");

      const response = await fetch(
        `${API_URL}/warranties/${warrantyId}/deactivate`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as WarrantyResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Failed to deactivate warranty.",
        );
      }

      setShowDeactivateConfirm(false);

      await loadWarranty();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to deactivate warranty.",
      );
    } finally {
      setIsDeactivating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading warranty...
          </p>
        </div>
      </div>
    );
  }

  if (error && !warranty) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() =>
            navigate("/shopkeeper/warranties")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to warranties
        </button>

        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h1 className="text-lg font-semibold">
            Unable to load warranty
          </h1>

          <p className="mt-2 text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadWarranty()}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!warranty) {
    return null;
  }

  const statusConfig = getStatusConfig(
    warranty.status,
  );

  const StatusIcon = statusConfig.icon;

  const daysRemaining = getDaysRemaining(
    warranty.expiryDate,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/shopkeeper/warranties")
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to warranties
          </button>

          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="size-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {warranty.productName}
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Warranty details and coverage
                information.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusConfig.className}`}
        >
          <StatusIcon className="size-4" />
          {statusConfig.label}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Expiry banner */}
      {warranty.status === "expiring_soon" &&
        daysRemaining !== null && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />

              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Warranty expiring soon
                </p>

                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                  This warranty expires in{" "}
                  {Math.max(
                    daysRemaining,
                    0,
                  )}{" "}
                  days.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Product information */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />

          <h2 className="font-semibold">
            Warranty Information
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Product"
            value={warranty.productName}
          />

          <DetailItem
            label="Serial Number"
            value={warranty.serialNumber ?? "Not provided"}
          />

          <DetailItem
            label="Warranty Period"
            value={`${warranty.warrantyPeriodMonths} months`}
          />

          <DetailItem
            label="Start Date"
            value={formatDate(
              warranty.startDate,
            )}
          />

          <DetailItem
            label="Expiry Date"
            value={formatDate(
              warranty.expiryDate,
            )}
          />

          <DetailItem
            label="Status"
            value={statusConfig.label}
          />
        </div>
      </section>

      {/* Customer */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <UserRound className="size-5 text-primary" />

          <h2 className="font-semibold">
            Customer
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Name"
            value={
              warranty.customer?.name ??
              "Customer"
            }
          />

          <DetailItem
            label="Phone"
            value={
              warranty.customer?.phone ??
              "Not provided"
            }
          />

          <DetailItem
            label="Email"
            value={
              warranty.customer?.email ??
              "Not provided"
            }
          />
        </div>
      </section>

      {/* Dates */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" />

          <h2 className="font-semibold">
            Coverage Timeline
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TimelineItem
            label="Warranty Starts"
            value={formatDate(
              warranty.startDate,
            )}
          />

          <TimelineItem
            label="Warranty Expires"
            value={formatDate(
              warranty.expiryDate,
            )}
          />
        </div>
      </section>

      {/* Terms */}
      {(warranty.terms || warranty.notes) && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <FileText className="size-5 text-primary" />

            <h2 className="font-semibold">
              Terms & Notes
            </h2>
          </div>

          <div className="space-y-5">
            {warranty.terms && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Warranty Terms
                </p>

                <div className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                  {warranty.terms}
                </div>
              </div>
            )}

            {warranty.notes && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Notes
                </p>

                <div className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                  {warranty.notes}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Warranty Actions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage the current warranty status.
            </p>
          </div>

          {warranty.isActive ? (
            <button
              type="button"
              onClick={() =>
                setShowDeactivateConfirm(true)
              }
              disabled={isDeactivating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50"
            >
              <XCircle className="size-4" />
              Deactivate Warranty
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
              <ShieldX className="size-4" />
              Warranty Deactivated
            </span>
          )}
        </div>
      </section>

      {/* Confirmation */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10">
              <XCircle className="size-5 text-destructive" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Deactivate warranty?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This will deactivate the warranty for{" "}
              <span className="font-medium text-foreground">
                {warranty.productName}
              </span>
              . This action should only be used when
              the warranty is no longer valid.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={() =>
                  setShowDeactivateConfirm(false)
                }
                className="h-10 rounded-xl border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Keep Warranty
              </button>

              <button
                type="button"
                disabled={isDeactivating}
                onClick={() =>
                  void deactivateWarranty()
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    Deactivate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <CalendarDays className="size-4 text-primary" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}