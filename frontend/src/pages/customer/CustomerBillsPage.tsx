import {
  FileText,
  Loader2,
  Search,
  Upload,
  XCircle,
  Pencil,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

interface CustomerBill {
  _id: string;
  originalName: string;
  mimeType: string;
  url: string;
  documentType?: string;
  extractedData?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    customerName?: string;
    shopName?: string;
    total?: number | null;
    rawText?: string;
  };
  createdAt?: string;
}

interface BillsResponse {
  success: boolean;
  data?: {
    bills?: CustomerBill[];
    bill?: CustomerBill;
  };
  message?: string;
}

function formatCurrency(
  value?: number | null,
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
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

export default function CustomerBillsPage() {
  const navigate = useNavigate();
  const [bills, setBills] =
    useState<CustomerBill[]>([]);
  const [search, setSearch] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isUploading, setIsUploading] =
    useState(false);
  const [error, setError] =
    useState("");

  const loadBills = useCallback(
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/customer/bills`,
            {
              credentials: "include",
            },
          );

        const result =
          (await response.json()) as BillsResponse;

        if (!response.ok) {
          throw new Error(
            result.message ??
              "Unable to load your bills.",
          );
        }

        setBills(
          result.data?.bills ?? [],
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your bills.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadBills();
  }, [loadBills]);

  async function handleUpload(
    file?: File,
  ) {
    if (!file) return;

    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        "Only JPG, PNG, and WebP bill images are supported right now.",
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "Bill image cannot exceed 10 MB.",
      );
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          `${API_URL}/customer/bills/upload`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );

      const result =
        (await response.json()) as BillsResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to process this bill.",
        );
      }

      const uploadedBill = result.data?.bill;

      if (uploadedBill?._id) {
        navigate(`/customer/bills/${uploadedBill._id}/review`);
        return;
      }

      await loadBills();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to process this bill.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  const filteredBills =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) return bills;

      return bills.filter(
        (bill) =>
          [
            bill.originalName,
            bill.extractedData?.invoiceNumber,
            bill.extractedData?.customerName,
            bill.extractedData?.shopName,
            bill.extractedData?.rawText,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query),
            ),
      );
    }, [bills, search]);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Customer portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Bills
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep bills from BillNest and other stores in one private place.
          </p>
        </div>

        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isUploading
            ? "Processing bill..."
            : "Add bill"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={isUploading}
            onChange={(event) => {
              const file =
                event.target.files?.[0];
              event.target.value = "";
              void handleUpload(file);
            }}
          />
        </label>
      </div>

      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search shop, invoice number, product or bill text..."
            className="h-10 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 text-destructive" />
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center shadow-sm">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-7" />
          </div>
          <h2 className="text-lg font-semibold">
            {search
              ? "No matching bills"
              : "No bills added yet"}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload a bill from any store and BillNest will extract its details while keeping the original document.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBills.map((bill) => (
            <article
              key={bill._id}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {bill.extractedData?.shopName ??
                          bill.originalName}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {bill.documentType ?? "invoice"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(
                      bill.extractedData?.invoiceDate ??
                        bill.createdAt,
                    )}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Invoice
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {bill.extractedData?.invoiceNumber ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Total
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatCurrency(
                        bill.extractedData?.total,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/customer/bills/${bill._id}/review`,
                      )
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Pencil className="size-4" />
                    Review
                  </button>

                  <a
                    href={bill.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition hover:bg-muted"
                  >
                    <FileText className="size-4" />
                    Original
                  </a>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Remove this bill from your BillNest vault?",
                    );

                    if (!confirmed) return;

                    setError("");

                    try {
                      const response = await fetch(
                        `${API_URL}/customer/bills/${bill._id}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        },
                      );

                      const result = (await response.json()) as {
                        success: boolean;
                        message?: string;
                      };

                      if (!response.ok) {
                        throw new Error(
                          result.message ??
                            "Unable to remove this bill.",
                        );
                      }

                      await loadBills();
                    } catch (archiveError) {
                      setError(
                        archiveError instanceof Error
                          ? archiveError.message
                          : "Unable to remove this bill.",
                      );
                    }
                  }}
                  className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
                >
                  Delete bill
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
