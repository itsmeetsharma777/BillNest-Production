import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  issueDate?: string;
  invoiceDate?: string;
  dueDate?: string;

  customer?: InvoiceCustomer;

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

interface Shop {
  name?: string;
  phone?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

interface InvoiceResponse {
  success: boolean;
  data?: {
    invoice?: Invoice;
    items?: InvoiceItem[];
    customer?: InvoiceCustomer | null;
    shop?: Shop | null;
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

    case "online":
      return "Online";

    case "cheque":
      return "Cheque";

    default:
      return method || "—";
  }
}

function getAddress(shop?: Shop | null) {
  if (!shop?.address) {
    return null;
  }

  const parts = [
    shop.address.line1,
    shop.address.line2,
    shop.address.city,
    shop.address.state,
    shop.address.postalCode,
    shop.address.country,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(", ")
    : null;
}

export default function CustomerInvoiceDetailsPage() {
  const { invoiceId } =
    useParams<{ invoiceId: string }>();

  const navigate = useNavigate();

  const [data, setData] =
    useState<InvoiceResponse["data"] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState("");

  useEffect(() => {
    let mounted = true;

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
          `${API_URL}/customer/invoices/${invoiceId}`,
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
              "Unable to load this invoice.",
          );
        }

        if (mounted) {
          setData(result.data ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this invoice.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoice();

    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  async function handleDownloadPdf() {
    if (!invoiceId || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadError("");

      const response = await fetch(
        `${API_URL}/customer/invoices/${invoiceId}/pdf`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        let message =
          "Unable to download the invoice PDF.";

        try {
          const result = (await response.json()) as {
            message?: string;
          };

          if (result.message) {
            message = result.message;
          }
        } catch {
          // Ignore invalid JSON error responses.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (
        !blob.size ||
        blob.type !== "application/pdf"
      ) {
        throw new Error(
          "The server returned an invalid PDF.",
        );
      }

      const objectUrl =
        window.URL.createObjectURL(blob);

      const invoiceNumber =
        data?.invoice?.invoiceNumber ??
        data?.invoice?.invoiceNo ??
        "invoice";

      const safeInvoiceNumber =
        invoiceNumber.replace(
          /[^a-zA-Z0-9-_]/g,
          "_",
        );

      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download = `invoice-${safeInvoiceNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Unable to download the invoice PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <Button
          variant="ghost"
          onClick={() =>
            navigate("/customer/invoices")
          }
          className="mb-5 -ml-2"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to purchases
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto size-10 text-muted-foreground" />

            <h1 className="mt-4 text-xl font-semibold">
              Invoice unavailable
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {error ||
                "We couldn't find this invoice."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invoice = {
    ...data.invoice,
    status: normalizeStatus(
      data.invoice.status,
    ),
  };

  const items = data.items ?? [];
  const shop = data.shop;

  const address = getAddress(shop);

  const invoiceNumber =
    invoice.invoiceNumber ??
    invoice.invoiceNo ??
    "Invoice";

  const customer =
    invoice.customer ??
    data.customer;

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() =>
            navigate("/customer/invoices")
          }
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to purchases
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadPdf}
          isDisabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}

          {isDownloading
            ? "Downloading..."
            : "Download PDF"}
        </Button>
      </div>

      {downloadError && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {downloadError}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/20 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                Purchase invoice
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {invoiceNumber}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Issued on{" "}
                {formatDate(
                  invoice.issueDate ??
                    invoice.invoiceDate,
                )}
              </p>
            </div>

            <Badge
              className={`rounded-full border px-3 py-1.5 ${getStatusClass(invoice.status)}`}
            >
              {invoice.status === "paid" && (
                <CheckCircle2 className="mr-1.5 size-4" />
              )}

              {invoice.status ===
                "partially_paid" && (
                <CreditCard className="mr-1.5 size-4" />
              )}

              {invoice.status === "cancelled" && (
                <XCircle className="mr-1.5 size-4" />
              )}

              {getStatusLabel(invoice.status)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <UserRound className="size-5 text-primary" />

                <CardTitle>
                  Customer
                </CardTitle>
              </div>

              <div className="mt-4 rounded-2xl border p-5">
                <p className="font-semibold">
                  {customer?.name ??
                    "Customer information unavailable"}
                </p>

                {customer?.phone && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {customer.phone}
                  </p>
                )}

                {customer?.email && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {customer.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />

                <CardTitle>
                  Purchase store
                </CardTitle>
              </div>

              <div className="mt-4 rounded-2xl border p-5">
                <p className="font-semibold">
                  {shop?.name ??
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

                {address && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Purchased items
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Items included in this invoice.
                </p>
              </div>

              <span className="text-sm text-muted-foreground">
                {items.length} item
                {items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border">
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left">
                  <thead className="border-b bg-muted/40">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">
                        Product
                      </th>

                      <th className="px-4 py-3 text-right">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right">
                        Unit price
                      </th>

                      <th className="px-4 py-3 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {items.map((item, index) => {
                      const lineTotal =
                        item.lineTotal ??
                        item.total ??
                        item.quantity *
                          item.unitPrice;

                      return (
                        <tr
                          key={
                            item._id ??
                            item.id ??
                            `item-${index}`
                          }
                        >
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold">
                              {item.productName ??
                                item.description ??
                                "Product"}
                            </p>

                            {item.description &&
                              item.productName && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                          </td>

                          <td className="px-4 py-4 text-right text-sm">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-4 text-right text-sm">
                            {formatCurrency(
                              item.unitPrice,
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-sm font-semibold">
                            {formatCurrency(
                              lineTotal,
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y sm:hidden">
                {items.map((item, index) => {
                  const lineTotal =
                    item.lineTotal ??
                    item.total ??
                    item.quantity *
                      item.unitPrice;

                  return (
                    <div
                      key={
                        item._id ??
                        item.id ??
                        `mobile-item-${index}`
                      }
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {item.productName ??
                              item.description ??
                              "Product"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty {item.quantity} ×{" "}
                            {formatCurrency(
                              item.unitPrice,
                            )}
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            lineTotal,
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="ml-auto max-w-md space-y-3">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Subtotal
              </span>

              <span className="font-medium">
                {formatCurrency(
                  invoice.subtotal,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Discount
              </span>

              <span className="font-medium">
                -{" "}
                {formatCurrency(
                  invoice.discount,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Tax
              </span>

              <span className="font-medium">
                {formatCurrency(invoice.tax)}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between gap-4 text-lg font-bold">
              <span>Total</span>

              <span>
                {formatCurrency(invoice.total)}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Amount paid
              </span>

              <span className="font-medium">
                {formatCurrency(
                  invoice.amountPaid,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                Amount due
              </span>

              <span className="font-semibold">
                {formatCurrency(
                  invoice.amountDue,
                )}
              </span>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment method
              </p>

              <p className="mt-2 font-semibold">
                {getPaymentMethodLabel(
                  invoice.paymentMethod,
                )}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Due date
              </p>

              <p className="mt-2 font-semibold">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator className="my-8" />

              <div>
                <h2 className="text-lg font-semibold">
                  Notes
                </h2>

                <div className="mt-3 rounded-2xl border bg-muted/20 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {invoice.notes}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}