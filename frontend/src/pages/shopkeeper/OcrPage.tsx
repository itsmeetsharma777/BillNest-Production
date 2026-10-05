import {
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

type OcrDocumentType =
  | "invoice"
  | "receipt"
  | "warranty"
  | "product_document"
  | "other";

interface OcrItem {
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  taxRate?: number;
  serialNumber?: string;
  sku?: string;
}

interface OcrResult {
  documentType?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shopName?: string;
  shopPhone?: string;
  items?: OcrItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  paymentMethod?: string;
  warrantyPeriod?: string;
  warrantyExpiry?: string;
  rawText?: string;
}


interface OcrInvoiceDraft {
  sourceInvoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    serialNumber?: string;
    sku?: string;
  }>;
  discount: number;
  tax: number;
  paymentMethod?: string;
  notes?: string;
}

interface OcrResponse {
  success: boolean;
  message?: string;
  data?: {
    extracted?: OcrResult;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function formatLabel(
  value: string,
): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) =>
      character.toUpperCase(),
    );
}

function displayValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(
      value,
      null,
      2,
    );
  }

  return String(value);
}

export default function OcrPage() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [
    documentType,
    setDocumentType,
  ] =
    useState<OcrDocumentType>(
      "invoice",
    );

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    extracted,
    setExtracted,
  ] =
    useState<OcrResult | null>(
      null,
    );

  function clearFile() {
    setFile(null);
    setExtracted(null);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  function validateFile(
    selectedFile: File,
  ): boolean {
    if (
      !ACCEPTED_TYPES.includes(
        selectedFile.type,
      )
    ) {
      setError(
        "Please upload a JPG, PNG, or WebP image.",
      );
      return false;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "The image must be smaller than 10 MB.",
      );
      return false;
    }

    return true;
  }

  function selectFile(
    selectedFile: File,
  ) {
    setError("");

    if (
      !validateFile(
        selectedFile,
      )
    ) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setFile(selectedFile);
    setExtracted(null);

    setPreviewUrl(
      URL.createObjectURL(
        selectedFile,
      ),
    );
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    selectFile(selectedFile);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (!droppedFile) {
      return;
    }

    selectFile(droppedFile);
  }

  async function processDocument() {
    if (!file) {
      setError(
        "Please upload an invoice or document first.",
      );
      return;
    }

    setIsProcessing(true);
    setError("");
    setExtracted(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "documentType",
        documentType,
      );

      const response =
        await fetch(
          `${API_URL}/ocr/process`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );

      const result =
        (await response.json()) as OcrResponse;

      if (!response.ok) {
        throw new Error(
          result.message ??
            "Unable to process this document.",
        );
      }

      if (
        !result.data?.extracted
      ) {
        throw new Error(
          "OCR completed but no extracted data was returned.",
        );
      }

      setExtracted(
        result.data.extracted,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process this document.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function updateField(
    field: keyof OcrResult,
    value: string,
  ) {
    setExtracted(
      (current) =>
        current
          ? {
              ...current,
              [field]: value,
            }
          : current,
    );
  }

  function updateItem(
    index: number,
    field: keyof OcrItem,
    value: string,
  ) {
    setExtracted(
      (current) => {
        if (!current) {
          return current;
        }

        const items =
          [...(current.items ?? [])];

        items[index] = {
          ...items[index],
          [field]:
            field ===
              "quantity" ||
            field ===
              "unitPrice" ||
            field ===
              "discount" ||
            field ===
              "taxRate"
              ? Number(value)
              : value,
        };

        return {
          ...current,
          items,
        };
      },
    );
  }


  function continueToCreateInvoice() {
    if (!extracted) return;

    const items = (extracted.items ?? [])
      .filter((item) => Boolean(item.productName?.trim()))
      .map((item) => ({
        productName: item.productName?.trim() ?? "",
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        unitPrice: Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0,
        discount: Number.isFinite(Number(item.discount)) ? Number(item.discount) : 0,
        taxRate: Number.isFinite(Number(item.taxRate)) ? Number(item.taxRate) : 0,
        serialNumber: item.serialNumber?.trim() || undefined,
        sku: item.sku?.trim() || undefined,
      }));

    if (items.length === 0) {
      setError("No invoice items were extracted. Please add at least one item before continuing.");
      return;
    }

    const draft: OcrInvoiceDraft = {
      sourceInvoiceNumber: extracted.invoiceNumber?.trim() || undefined,
      customerName: extracted.customerName?.trim() || undefined,
      customerPhone: extracted.customerPhone?.trim() || undefined,
      customerEmail: extracted.customerEmail?.trim() || undefined,
      items,
      discount: Number.isFinite(Number(extracted.discount)) ? Number(extracted.discount) : 0,
      tax: Number.isFinite(Number(extracted.tax)) ? Number(extracted.tax) : 0,
      paymentMethod: extracted.paymentMethod?.trim() || undefined,
      notes: extracted.invoiceNumber?.trim()
        ? "Imported from OCR. Source invoice number: " + extracted.invoiceNumber.trim()
        : "Imported from OCR.",
    };

    sessionStorage.setItem("billnest_ocr_invoice_draft", JSON.stringify(draft));
    navigate("/shopkeeper/invoices/new?from=ocr");
  }

  function resetForAnotherDocument() {
    clearFile();
    setDocumentType(
      "invoice",
    );
  }

  const fieldGroups: Array<
    Array<keyof OcrResult>
  > = [
    [
      "invoiceNumber",
      "invoiceDate",
    ],
    [
      "customerName",
      "customerPhone",
    ],
    [
      "customerEmail",
      "shopName",
    ],
    [
      "shopPhone",
      "paymentMethod",
    ],
    [
      "subtotal",
      "discount",
    ],
    [
      "tax",
      "total",
    ],
    [
      "warrantyPeriod",
      "warrantyExpiry",
    ],
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>AI Tools</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Scan a document
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Upload an invoice or bill and let BillNest extract
          the important information for you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileImage className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Upload document
              </h2>

              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP • Max 10 MB
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium">
            Document type
          </label>

          <select
            value={documentType}
            onChange={(event) =>
              setDocumentType(
                event.target
                  .value as OcrDocumentType,
              )
            }
            disabled={isProcessing}
            className="mb-4 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="invoice">
              Invoice / Bill
            </option>
            <option value="receipt">
              Receipt
            </option>
            <option value="warranty">
              Warranty document
            </option>
            <option value="product_document">
              Product document
            </option>
            <option value="other">
              Other
            </option>
          </select>

          {!file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() =>
                setIsDragging(false)
              }
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className={[
                "flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
              ].join(" ")}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="size-7" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                Drop your invoice here
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                or click to choose an image
              </p>

              <span className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                Choose image
              </span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border">
              <div className="relative bg-muted/30 p-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected document"
                    className="max-h-[300px] w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <FileText className="size-12 text-muted-foreground" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={isProcessing}
                  className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-foreground disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-4">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              void processDocument()
            }
            disabled={
              !file ||
              isProcessing
            }
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Reading document...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Process with AI
              </>
            )}
          </button>

          {extracted && (
            <button
              type="button"
              onClick={
                resetForAnotherDocument
              }
              disabled={isProcessing}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
              Scan another document
            </button>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          {!extracted ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FileText className="size-8" />
              </div>

              <h2 className="mt-4 text-lg font-semibold">
                Review area
              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Upload a document and process it with AI.
                Extracted information will appear here for
                review before it is used anywhere else.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-green-600" />
                    <h2 className="text-lg font-semibold">
                      Extracted information
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Review the AI result carefully before using it.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                  AI extraction complete
                </span>
              </div>

              <div className="space-y-5">
                {fieldGroups.map(
                  (group) => (
                    <div
                      key={group.join("-")}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      {group.map(
                        (field) => (
                          <label
                            key={field}
                            className="block"
                          >
                            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                              {formatLabel(
                                field,
                              )}
                            </span>

                            <input
                              value={displayValue(
                                extracted[field],
                              ) === "—"
                                ? ""
                                : displayValue(
                                    extracted[field],
                                  )}
                              onChange={(
                                event,
                              ) =>
                                updateField(
                                  field,
                                  event.target.value,
                                )
                              }
                              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </label>
                        ),
                      )}
                    </div>
                  ),
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      Products / Items
                    </h3>

                    <span className="text-xs text-muted-foreground">
                      {extracted.items?.length ?? 0} items
                    </span>
                  </div>

                  {extracted.items &&
                  extracted.items.length > 0 ? (
                    <div className="space-y-3">
                      {extracted.items.map(
                        (
                          item,
                          index,
                        ) => (
                          <div
                            key={index}
                            className="rounded-xl border p-4"
                          >
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {(
                                [
                                  "productName",
                                  "quantity",
                                  "unitPrice",
                                  "discount",
                                  "taxRate",
                                  "serialNumber",
                                  "sku",
                                ] as Array<
                                  keyof OcrItem
                                >
                              ).map(
                                (
                                  field,
                                ) => (
                                  <label
                                    key={field}
                                    className="block"
                                  >
                                    <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                                      {formatLabel(
                                        field,
                                      )}
                                    </span>

                                    <input
                                      value={displayValue(
                                        item[
                                          field
                                        ],
                                      ) ===
                                        "—"
                                        ? ""
                                        : displayValue(
                                            item[
                                              field
                                            ],
                                          )}
                                      onChange={(
                                        event,
                                      ) =>
                                        updateItem(
                                          index,
                                          field,
                                          event
                                            .target
                                            .value,
                                        )
                                      }
                                      className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  </label>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No products were detected.
                    </div>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Raw OCR text
                  </span>

                  <textarea
                    value={
                      extracted.rawText ??
                      ""
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "rawText",
                        event.target.value,
                      )
                    }
                    rows={8}
                    className="w-full rounded-xl border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold">
                    Ready to create an invoice?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your edited OCR data will be transferred to the normal BillNest invoice form. Nothing is saved until you review and click Create Invoice.
                  </p>

                  <button
                    type="button"
                    onClick={continueToCreateInvoice}
                    className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Continue to Create Invoice
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
