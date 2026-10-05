import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Store,
  Tag,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

interface Warranty {
  _id: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: string;
  expiryDate: string;
  status: string;
  terms?: string;
  notes?: string;
  invoiceId: string;
  invoiceItemId: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  total: number;
  status: string;
}

interface Shop {
  name?: string;
  phone?: string;
  email?: string;
}

interface WarrantyResponse {
  warranty: Warranty;
  publicVerificationUrl?: string;
  invoice?: Invoice | null;
  shop?: Shop | null;
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
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";

    case "expiring_soon":
      return "Expiring Soon";

    case "expired":
      return "Expired";

    case "no_warranty":
      return "No Warranty";

    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400";

    case "expiring_soon":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400";

    case "expired":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400";

    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

function StatusIcon({
  status,
}: {
  status: string;
}) {
  if (status === "active") {
    return <CheckCircle2 className="size-7" />;
  }

  if (status === "expiring_soon") {
    return <Clock3 className="size-7" />;
  }

  return <XCircle className="size-7" />;
}

export default function CustomerWarrantyDetailsPage() {
  const { warrantyId } =
    useParams<{ warrantyId: string }>();

  const navigate = useNavigate();

  const [data, setData] =
    useState<WarrantyResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWarranty() {
      if (!warrantyId) {
        setError("Warranty ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/customer/warranties/${warrantyId}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ??
              "Unable to load this warranty.",
          );
        }

        if (mounted) {
          setData(result?.data ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this warranty.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWarranty();

    return () => {
      mounted = false;
    };
  }, [warrantyId]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />

          <p className="text-sm text-muted-foreground">
            Loading warranty...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={() =>
            navigate("/customer/warranties")
          }
          className="mb-5 -ml-2"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to warranties
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto size-10 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Warranty unavailable
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error ||
                "We couldn't find this warranty."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { warranty, invoice, shop, publicVerificationUrl } = data;

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() =>
            navigate("/customer/warranties")
          }
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to warranties
        </Button>

        {publicVerificationUrl && (
          <a
            href={publicVerificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <ShieldCheck className="mr-2 size-4" />
            View Warranty Card
          </a>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/20 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-7" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Product warranty
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {warranty.productName}
                </h1>

                {warranty.serialNumber && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Serial number:{" "}
                    {warranty.serialNumber}
                  </p>
                )}
              </div>
            </div>

            <div
              className={`flex items-center gap-2 self-start rounded-full border px-3 py-2 text-sm font-semibold sm:self-center ${getStatusClass(warranty.status)}`}
            >
              <StatusIcon status={warranty.status} />

              <span>
                {getStatusLabel(warranty.status)}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Start date
              </div>

              <p className="mt-2 font-semibold">
                {formatDate(warranty.startDate)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                Expiry date
              </div>

              <p className="mt-2 font-semibold">
                {formatDate(warranty.expiryDate)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                Warranty period
              </div>

              <p className="mt-2 font-semibold">
                {warranty.warrantyPeriodMonths} month
                {warranty.warrantyPeriodMonths === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="size-4" />
                Serial number
              </div>

              <p className="mt-2 font-semibold">
                {warranty.serialNumber ||
                  "Not provided"}
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <div>
            <div className="flex items-center gap-2">
              <Store className="size-5 text-primary" />
              <CardTitle>Purchase store</CardTitle>
            </div>

            <div className="mt-4 rounded-2xl border p-5">
              <p className="font-semibold">
                {shop?.name ||
                  "Store information unavailable"}
              </p>

              {shop?.phone && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {shop.phone}
                </p>
              )}

              {shop?.email && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {shop.email}
                </p>
              )}
            </div>
          </div>

          {invoice && (
            <>
              <Separator className="my-8" />

              <div>
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <CardTitle>
                    Purchase invoice
                  </CardTitle>
                </div>

                <div className="mt-4 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {invoice.invoiceNumber}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Purchased on{" "}
                      {formatDate(invoice.issueDate)}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Total:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(invoice.total)}
                      </span>
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      navigate(
                        `/customer/invoices/${invoice.id}`,
                      )
                    }
                  >
                    View invoice
                  </Button>
                </div>
              </div>
            </>
          )}

          {warranty.terms && (
            <>
              <Separator className="my-8" />

              <div>
                <h2 className="text-lg font-semibold">
                  Warranty terms
                </h2>

                <div className="mt-3 rounded-2xl border bg-muted/20 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {warranty.terms}
                  </p>
                </div>
              </div>
            </>
          )}

          {warranty.notes && (
            <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
              <h2 className="font-semibold">
                Notes
              </h2>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {warranty.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}