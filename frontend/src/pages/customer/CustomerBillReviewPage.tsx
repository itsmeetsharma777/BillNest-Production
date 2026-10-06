import {
  ArrowLeft,
  Bot,
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  useCallback,
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

type DocumentType =
  | "invoice"
  | "receipt"
  | "warranty"
  | "product_document"
  | "other";

interface OcrItem {
  productName?: string;
  lineType?: "product" | "service" | "charge";
  quantity?: number | null;
  unitPrice?: number | null;
  discount?: number | null;
  taxRate?: number | null;
  serialNumber?: string | null;
  sku?: string | null;
}

interface OcrCharge {
  name?: string;
  amount?: number | null;
}

type ConfidenceLevel = "high" | "medium" | "low";

interface FieldConfidence {
  level: ConfidenceLevel;
  score?: number;
  reason?: string;
}

interface OcrConfidence {
  [key: string]: FieldConfidence | undefined;
}

interface BillQualityCheck {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

interface BillQuality {
  score: number;
  severity: "good" | "warning" | "poor";
  checks: BillQualityCheck[];
  checkedAt: string;
}

interface ExtractedData {
  invoiceNumber?: string;
  invoiceDate?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shopName?: string;
  shopPhone?: string;
  items?: OcrItem[];
  charges?: OcrCharge[];
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  paymentMethod?: string;
  warrantyPeriod?: string;
  warrantyExpiry?: string;
  rawText?: string;
  confidence?: OcrConfidence;
  quality?: BillQuality;
  intelligence?: {
    category?: string;
    warranty?: {
      status?: "active" | "expired" | "unknown";
      expiry?: string | null;
    };
  };
  [key: string]: unknown;
}

interface CustomerBill {
  _id: string;
  originalName: string;
  mimeType: string;
  url: string;
  documentType?: DocumentType;
  extractedData?: ExtractedData;
  rawOcrText?: string;
  ocrStatus?: "processed" | "needs_review" | "failed";
}

interface BillResponse {
  success: boolean;
  data?: { bill?: CustomerBill };
  message?: string;
}

function asString(value: unknown) {
  return value === null || value === undefined
    ? ""
    : String(value);
}

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function inputClassName(confidence?: FieldConfidence) {
  const base =
    "mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (confidence?.level === "low") {
    return `${base} border-destructive/60 bg-destructive/5`;
  }

  if (confidence?.level === "medium") {
    return `${base} border-amber-500/60 bg-amber-500/5`;
  }

  if (confidence?.level === "high") {
    return `${base} border-emerald-500/40`;
  }

  return base;
}

function ConfidenceBadge({
  confidence,
}: {
  confidence?: FieldConfidence;
}) {
  if (!confidence) return null;

  const classes =
    confidence.level === "low"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : confidence.level === "medium"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";

  const label =
    confidence.level === "low"
      ? "Verify"
      : confidence.level === "medium"
        ? "Check"
        : "High confidence";

  return (
    <span
      title={confidence.reason ?? undefined}
      className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

export default function CustomerBillReviewPage() {
  const { billId } = useParams();
  const navigate = useNavigate();

  const [bill, setBill] =
    useState<CustomerBill | null>(null);
  const [data, setData] =
    useState<ExtractedData>({});
  const [documentType, setDocumentType] =
    useState<DocumentType>("invoice");
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [saved, setSaved] =
    useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [isAskingAssistant, setIsAskingAssistant] = useState(false);

  const loadBill = useCallback(async () => {
    if (!billId) {
      setError("Bill ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/customer/bills/${billId}`,
        { credentials: "include" },
      );

      const result =
        (await response.json()) as BillResponse;

      if (!response.ok || !result.data?.bill) {
        throw new Error(
          result.message ?? "Unable to load this bill.",
        );
      }

      const loadedBill = result.data.bill;
      setBill(loadedBill);
      setDocumentType(
        loadedBill.documentType ?? "invoice",
      );
      setData({
        ...(loadedBill.extractedData ?? {}),
        rawText:
          loadedBill.extractedData?.rawText ??
          loadedBill.rawOcrText ??
          "",
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load this bill.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    void loadBill();
  }, [loadBill]);

  function updateField(
    field: keyof ExtractedData,
    value: unknown,
  ) {
    setSaved(false);
    setData((current) => {
      const nextConfidence = {
        ...(current.confidence ?? {}),
      };

      delete nextConfidence[String(field)];

      return {
        ...current,
        [field]: value,
        confidence: nextConfidence,
      };
    });
  }

  function updateItem(
    index: number,
    field: keyof OcrItem,
    value: unknown,
  ) {
    setSaved(false);
    setData((current) => {
      const items = [...(current.items ?? [])];
      items[index] = {
        ...(items[index] ?? {}),
        [field]: value,
      };
      const confidence = {
        ...(current.confidence ?? {}),
      };

      delete confidence.items;

      return {
        ...current,
        items,
        confidence,
      };
    });
  }

  function addItem() {
    setSaved(false);
    setData((current) => ({
      ...current,
      items: [
        ...(current.items ?? []),
        {
          productName: "",
          lineType: "product",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  }

  function removeItem(index: number) {
    setSaved(false);
    setData((current) => ({
      ...current,
      items: (current.items ?? []).filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  function updateCharge(
    index: number,
    field: keyof OcrCharge,
    value: unknown,
  ) {
    setSaved(false);
    setData((current) => {
      const charges = [...(current.charges ?? [])];
      charges[index] = {
        ...(charges[index] ?? {}),
        [field]: value,
      };
      const confidence = {
        ...(current.confidence ?? {}),
      };

      delete confidence.charges;

      return {
        ...current,
        charges,
        confidence,
      };
    });
  }

  function addCharge() {
    setSaved(false);
    setData((current) => ({
      ...current,
      charges: [
        ...(current.charges ?? []),
        { name: "", amount: 0 },
      ],
    }));
  }

  function removeCharge(index: number) {
    setSaved(false);
    setData((current) => ({
      ...current,
      charges: (current.charges ?? []).filter(
        (_, chargeIndex) => chargeIndex !== index,
      ),
    }));
  }

  async function saveChanges() {
    if (!billId) return;

    setIsSaving(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(
        `${API_URL}/customer/bills/${billId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType,
            extractedData: data,
          }),
        },
      );

      const result =
        (await response.json()) as BillResponse;

      if (!response.ok || !result.data?.bill) {
        throw new Error(
          result.message ?? "Unable to save bill changes.",
        );
      }

      setBill(result.data.bill);
      setSaved(true);
      setData({
        ...(result.data.bill.extractedData ?? {}),
        rawText:
          result.data.bill.extractedData?.rawText ??
          result.data.bill.rawOcrText ??
          "",
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save bill changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <XCircle className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">
            Unable to open bill
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "This bill could not be found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/customer/bills")}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to My Bills
          </button>
        </div>
      </div>
    );
  }

  const items = data.items ?? [];
  const charges = data.charges ?? [];
  const confidence = data.confidence ?? {};
  const reviewFields = Object.values(confidence).filter(
    (field) =>
      field?.level === "low" ||
      field?.level === "medium",
  ).length;
  const quality = data.quality;
  const qualityTone =
    quality?.severity === "good"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : quality?.severity === "poor"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";


  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/customer/bills")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to My Bills
          </button>

          <p className="text-sm font-medium text-primary">
            Customer Bill Vault
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Review bill details
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Check the information extracted by AI and correct anything that
            is inaccurate. Your original bill is kept unchanged.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={bill.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            View original
          </a>

          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved ? (
              <Check className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving
              ? "Saving..."
              : saved
                ? "Saved"
                : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Verify before saving
            </p>
            <p className="text-xs text-muted-foreground">
              AI extraction can make mistakes, especially with handwritten
              or low-quality bills.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {reviewFields > 0 && (
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                {reviewFields} field{reviewFields === 1 ? "" : "s"} need verification
              </span>
            )}
            <span className="inline-flex w-fit rounded-full bg-background px-3 py-1 text-xs font-medium capitalize">
              {bill.ocrStatus === "needs_review"
                ? "Needs review"
                : "AI extracted"}
            </span>
          </div>
        </div>
      </div>

      {data.intelligence && (
        <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Smart bill insights</p>
              <p className="mt-1 text-xs text-muted-foreground">
                BillNest automatically identifies the purchase category and warranty state.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full border bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              {data.intelligence.category ?? "Other"}
            </span>
          </div>
          {data.intelligence.warranty?.status !== "unknown" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm">
              <span className="font-medium">Warranty</span>
              <span className={
                data.intelligence.warranty?.status === "active"
                  ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                  : "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"
              }>
                {data.intelligence.warranty?.status === "active" ? "Active" : "Expired"}
              </span>
              {data.intelligence.warranty?.expiry && (
                <span className="text-xs text-muted-foreground">
                  Expiry: {data.intelligence.warranty.expiry}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {quality && (
        <div className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Bill quality check</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Automatic validation checks the extracted data before you save it.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm font-bold ${qualityTone}`}>
              {quality.score}/100
              <span className="text-xs font-semibold capitalize">
                {quality.severity}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {quality.checks.map((check) => (
              <div
                key={check.code}
                className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-sm"
              >
                <span className="mt-0.5 shrink-0">
                  {check.severity === "error"
                    ? "🔴"
                    : check.severity === "warning"
                      ? "🟠"
                      : "🟢"}
                </span>
                <span>{check.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Bill information</h2>
                <p className="text-xs text-muted-foreground">
                  Basic details extracted from the original document.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Document type<ConfidenceBadge confidence={confidence.documentType} />
                <select
                  value={documentType}
                  onChange={(event) => {
                    setDocumentType(
                      event.target.value as DocumentType,
                    );
                    setData((current) => ({
                      ...current,
                      confidence: {
                        ...(current.confidence ?? {}),
                        documentType: undefined,
                      },
                    }));
                    setSaved(false);
                  }}
                  className={inputClassName()}
                >
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="warranty">Warranty</option>
                  <option value="product_document">Product document</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Bill / invoice number<ConfidenceBadge confidence={confidence.invoiceNumber} />
                <input
                  value={asString(data.invoiceNumber)}
                  onChange={(event) =>
                    updateField("invoiceNumber", event.target.value)
                  }
                  className={inputClassName(confidence.invoiceNumber)}
                  placeholder="Invoice number"
                />
              </label>

              <label className="text-sm font-medium">
                Bill date<ConfidenceBadge confidence={confidence.invoiceDate} />
                <input
                  value={asString(data.invoiceDate)}
                  onChange={(event) =>
                    updateField("invoiceDate", event.target.value)
                  }
                  className={inputClassName(confidence.invoiceDate)}
                  placeholder="DD/MM/YYYY"
                />
              </label>

              <label className="text-sm font-medium">
                Payment method<ConfidenceBadge confidence={confidence.paymentMethod} />
                <input
                  value={asString(data.paymentMethod)}
                  onChange={(event) =>
                    updateField("paymentMethod", event.target.value)
                  }
                  className={inputClassName(confidence.paymentMethod)}
                  placeholder="Cash, UPI, card..."
                />
              </label>

              <label className="text-sm font-medium">
                Store / merchant<ConfidenceBadge confidence={confidence.shopName} />
                <input
                  value={asString(data.shopName)}
                  onChange={(event) =>
                    updateField("shopName", event.target.value)
                  }
                  className={inputClassName(confidence.shopName)}
                  placeholder="Store name"
                />
              </label>

              <label className="text-sm font-medium">
                Store phone<ConfidenceBadge confidence={confidence.shopPhone} />
                <input
                  value={asString(data.shopPhone)}
                  onChange={(event) =>
                    updateField("shopPhone", event.target.value)
                  }
                  className={inputClassName(confidence.shopPhone)}
                  placeholder="Store phone"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold">Customer details</h2>
              <p className="text-xs text-muted-foreground">
                Details found on the bill. These are editable.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Customer name<ConfidenceBadge confidence={confidence.customerName} />
                <input
                  value={asString(data.customerName)}
                  onChange={(event) =>
                    updateField("customerName", event.target.value)
                  }
                  className={inputClassName(confidence.customerName)}
                />
              </label>

              <label className="text-sm font-medium">
                Customer phone<ConfidenceBadge confidence={confidence.customerPhone} />
                <input
                  value={asString(data.customerPhone)}
                  onChange={(event) =>
                    updateField("customerPhone", event.target.value)
                  }
                  className={inputClassName(confidence.customerPhone)}
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                Customer email<ConfidenceBadge confidence={confidence.customerEmail} />
                <input
                  type="email"
                  value={asString(data.customerEmail)}
                  onChange={(event) =>
                    updateField("customerEmail", event.target.value)
                  }
                  className={inputClassName(confidence.customerEmail)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                Products / items
                <ConfidenceBadge confidence={confidence.items} />
              </h2>
                <p className="text-xs text-muted-foreground">
                  Review product names, quantities, prices and identifiers.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition hover:bg-muted"
              >
                <Plus className="size-4" />
                Add item
              </button>
            </div>

            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No products were extracted. Add one if needed.
                </div>
              ) : (
                items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Item {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        title="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="text-sm font-medium sm:col-span-2 lg:col-span-3">
                        Product name
                        <input
                          value={asString(item.productName)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "productName",
                              event.target.value,
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Type
                        <select
                          value={item.lineType ?? "product"}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "lineType",
                              event.target.value,
                            )
                          }
                          className={inputClassName()}
                        >
                          <option value="product">Product</option>
                          <option value="service">Service</option>
                          <option value="charge">Charge</option>
                        </select>
                      </label>

                      <label className="text-sm font-medium">
                        Quantity
                        <input
                          type="number"
                          min="0"
                          value={asNumber(item.quantity)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantity",
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Unit price
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={asNumber(item.unitPrice)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "unitPrice",
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Discount
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={asNumber(item.discount)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "discount",
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Tax rate %
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={asNumber(item.taxRate)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "taxRate",
                              event.target.value === ""
                                ? null
                                : Number(event.target.value),
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        Serial / IMEI
                        <input
                          value={asString(item.serialNumber)}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "serialNumber",
                              event.target.value,
                            )
                          }
                          className={inputClassName()}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        SKU
                        <input
                          value={asString(item.sku)}
                          onChange={(event) =>
                            updateItem(index, "sku", event.target.value)
                          }
                          className={inputClassName()}
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                Charges / fees
                <ConfidenceBadge confidence={confidence.charges} />
              </h2>
                <p className="text-xs text-muted-foreground">
                  Marketplace, delivery, handling and other non-product fees.
                </p>
              </div>
              <button
                type="button"
                onClick={addCharge}
                className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition hover:bg-muted"
              >
                <Plus className="size-4" />
                Add charge
              </button>
            </div>

            <div className="space-y-3">
              {charges.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No separate charges were detected.
                </div>
              ) : (
                charges.map((charge, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[1fr_180px_40px]"
                  >
                    <label className="text-sm font-medium">
                      Charge name
                      <input
                        value={asString(charge.name)}
                        onChange={(event) =>
                          updateCharge(index, "name", event.target.value)
                        }
                        className={inputClassName(confidence.charges)}
                      />
                    </label>

                    <label className="text-sm font-medium">
                      Amount
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={asNumber(charge.amount)}
                        onChange={(event) =>
                          updateCharge(
                            index,
                            "amount",
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        className={inputClassName()}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeCharge(index)}
                      className="mt-6 inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      title="Remove charge"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold">Amounts & warranty</h2>
              <p className="text-xs text-muted-foreground">
                Verify totals and any warranty information found on the bill.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["subtotal", "Subtotal"],
                ["discount", "Discount"],
                ["tax", "Tax"],
                ["total", "Total"],
              ].map(([field, label]) => (
                <label key={field} className="text-sm font-medium">
                  {label}
                  <ConfidenceBadge
                    confidence={confidence[field]}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={asNumber(data[field])}
                    onChange={(event) =>
                      updateField(
                        field as keyof ExtractedData,
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    className={inputClassName(
                      confidence[field],
                    )}
                  />
                </label>
              ))}

              <label className="text-sm font-medium">
                Warranty period<ConfidenceBadge confidence={confidence.warrantyPeriod} />
                <input
                  value={asString(data.warrantyPeriod)}
                  onChange={(event) =>
                    updateField("warrantyPeriod", event.target.value)
                  }
                  className={inputClassName()}
                  placeholder="e.g. 1 year"
                />
              </label>

              <label className="text-sm font-medium">
                Warranty expiry<ConfidenceBadge confidence={confidence.warrantyExpiry} />
                <input
                  value={asString(data.warrantyExpiry)}
                  onChange={(event) =>
                    updateField("warrantyExpiry", event.target.value)
                  }
                  className={inputClassName()}
                  placeholder="DD/MM/YYYY"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <details>
              <summary className="cursor-pointer text-sm font-semibold">
                View raw OCR text
              </summary>
              <textarea
                readOnly
                value={asString(data.rawText)}
                className="mt-4 min-h-64 w-full rounded-xl border bg-muted/20 p-3 font-mono text-xs leading-5 outline-none"
              />
            </details>
          </section>
        </div>

        <aside className="space-y-4 h-fit xl:sticky xl:top-24">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <div>
                <h2 className="font-semibold">Ask about this bill</h2>
                <p className="text-xs text-muted-foreground">
                  Ask questions using only information found on this bill.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
                placeholder="e.g. Is this bill under warranty?"
                maxLength={500}
                rows={3}
                disabled={isAskingAssistant}
                className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />

              <button
                type="button"
                disabled={!assistantQuestion.trim() || isAskingAssistant}
                onClick={async () => {
                  if (!billId || !assistantQuestion.trim()) return;

                  setIsAskingAssistant(true);
                  setAssistantAnswer("");
                  setError("");

                  try {
                    const response = await fetch(
                      `${API_URL}/customer/bills/${billId}/ask`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          question: assistantQuestion.trim(),
                        }),
                      },
                    );

                    const result = (await response.json()) as {
                      message?: string;
                      data?: {
                        answer?: string;
                      };
                    };

                    if (!response.ok || !result.data?.answer) {
                      throw new Error(
                        result.message ??
                          "Unable to answer this question.",
                      );
                    }

                    setAssistantAnswer(result.data.answer);
                  } catch (assistantError) {
                    setError(
                      assistantError instanceof Error
                        ? assistantError.message
                        : "Unable to answer this question.",
                    );
                  } finally {
                    setIsAskingAssistant(false);
                  }
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAskingAssistant ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Bot className="size-4" />
                    Ask BillNest AI
                  </>
                )}
              </button>

              {assistantAnswer ? (
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    BillNest AI
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {assistantAnswer}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {[
                  "What is the total amount?",
                  "What did I buy?",
                  "What is the invoice number?",
                  "Is this bill under warranty?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isAskingAssistant}
                    onClick={() => setAssistantQuestion(suggestion)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

        <aside className="h-fit xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-5">
              <p className="text-sm font-semibold">Original document</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {bill.originalName}
              </p>
            </div>

            {bill.mimeType.startsWith("image/") ? (
              <div className="bg-muted/30 p-3">
                <img
                  src={bill.url}
                  alt="Original uploaded bill"
                  className="max-h-[520px] w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 bg-muted/30 p-6 text-center">
                <FileText className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  This document cannot be previewed here.
                </p>
              </div>
            )}

            <div className="p-4">
              <a
                href={bill.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition hover:bg-muted"
              >
                <ExternalLink className="size-4" />
                Open original bill
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
