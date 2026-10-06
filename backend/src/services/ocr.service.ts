import { env } from "../config/env";

import { ApiError } from "../utils/api-error";

interface OcrInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

type OcrLineType = "product" | "service" | "charge";

interface OcrItem {
  productName: string;
  lineType: OcrLineType;
  quantity: number | null;
  unitPrice: number | null;
  discount: number | null;
  taxRate: number | null;
  serialNumber: string | null;
  sku: string | null;
}

interface OcrCharge {
  name: string;
  amount: number | null;
}

export interface OcrResult {
  documentType:
    | "invoice"
    | "receipt"
    | "warranty"
    | "product_document"
    | "other"
    | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  shopName: string | null;
  shopPhone: string | null;
  items: OcrItem[];
  charges: OcrCharge[];
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  total: number | null;
  paymentMethod: string | null;
  warrantyPeriod: string | null;
  warrantyExpiry: string | null;
  rawText: string | null;
}

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

const MAX_OCR_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_OCR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getGeminiConfig() {
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(
      503,
      "OCR service is not configured. Please configure GEMINI_API_KEY.",
      "OCR_NOT_CONFIGURED",
    );
  }

  /*
   * Gemini currently rejects gemini-2.5-flash-lite for new users.
   * Keep the OCR model pinned to the currently supported model so
   * an old GEMINI_OCR_MODEL value in a local .env cannot override it.
   */
  return {
    apiKey: env.GEMINI_API_KEY,
    model: "gemini-3.5-flash-lite",
  };
}

function createBase64(
  buffer: Buffer,
): string {
  return buffer.toString("base64");
}

function emptyOcrResult(): OcrResult {
  return {
    documentType: null,
    invoiceNumber: null,
    invoiceDate: null,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    shopName: null,
    shopPhone: null,
    items: [],
    charges: [],
    subtotal: null,
    discount: null,
    tax: null,
    total: null,
    paymentMethod: null,
    warrantyPeriod: null,
    warrantyExpiry: null,
    rawText: null,
  };
}

function normalizeOcrResult(
  value: unknown,
): OcrResult {
  if (!value || typeof value !== "object") {
    return emptyOcrResult();
  }

  const data = value as Record<string, unknown>;

  const rawItems = Array.isArray(data.items)
    ? data.items
    : [];

  const excludedChargePatterns = [
    "marketplace fee",
    "marketplace fees",
    "platform fee",
    "platform fees",
    "shipping fee",
    "shipping fees",
    "shipping charge",
    "delivery fee",
    "delivery fees",
    "delivery charge",
    "handling fee",
    "handling charge",
    "convenience fee",
    "payment processing fee",
    "processing fee",
    "service charge",
    "gst",
    "tax",
    "subtotal",
    "total amount",
    "discount",
  ];

  const charges: OcrCharge[] = [];
  const items: OcrItem[] = rawItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const productName =
        typeof row.productName === "string"
          ? row.productName.trim()
          : "";
      const normalizedName = productName.toLowerCase();
      const rawLineType =
        typeof row.lineType === "string"
          ? row.lineType.trim().toLowerCase()
          : "";
      const isCharge =
        rawLineType === "charge" ||
        excludedChargePatterns.some((pattern) =>
          normalizedName.includes(pattern),
        );

      if (isCharge) {
        const amount =
          typeof row.unitPrice === "number" &&
          Number.isFinite(row.unitPrice)
            ? row.unitPrice
            : null;

        if (productName) {
          charges.push({
            name: productName,
            amount,
          });
        }

        return null;
      }

      const lineType: OcrLineType =
        rawLineType === "service"
          ? "service"
          : "product";

      return {
        productName,
        lineType,
        quantity:
          typeof row.quantity === "number" &&
          Number.isFinite(row.quantity)
            ? row.quantity
            : null,
        unitPrice:
          typeof row.unitPrice === "number" &&
          Number.isFinite(row.unitPrice)
            ? row.unitPrice
            : null,
        discount:
          typeof row.discount === "number" &&
          Number.isFinite(row.discount)
            ? row.discount
            : null,
        taxRate:
          typeof row.taxRate === "number" &&
          Number.isFinite(row.taxRate)
            ? row.taxRate
            : null,
        serialNumber:
          typeof row.serialNumber === "string"
            ? row.serialNumber.trim()
            : null,
        sku:
          typeof row.sku === "string"
            ? row.sku.trim()
            : null,
      };
    })
    .filter((item): item is OcrItem =>
      Boolean(item?.productName),
    );

  const rawCharges = Array.isArray(data.charges)
    ? data.charges
    : [];

  for (const charge of rawCharges) {
    if (!charge || typeof charge !== "object") {
      continue;
    }

    const row = charge as Record<string, unknown>;
    const name =
      typeof row.name === "string"
        ? row.name.trim()
        : "";

    if (!name) {
      continue;
    }

    const amount =
      typeof row.amount === "number" &&
      Number.isFinite(row.amount)
        ? row.amount
        : null;

    if (
      !charges.some(
        (existing) =>
          existing.name.toLowerCase() ===
          name.toLowerCase(),
      )
    ) {
      charges.push({
        name,
        amount,
      });
    }
  }

  const documentType =
    typeof data.documentType === "string"
      ? data.documentType
      : null;

  return {
    documentType:
      documentType === "invoice" ||
      documentType === "receipt" ||
      documentType === "warranty" ||
      documentType === "product_document" ||
      documentType === "other"
        ? documentType
        : null,
    invoiceNumber:
      typeof data.invoiceNumber === "string"
        ? data.invoiceNumber.trim()
        : null,
    invoiceDate:
      typeof data.invoiceDate === "string"
        ? data.invoiceDate.trim()
        : null,
    customerName:
      typeof data.customerName === "string"
        ? data.customerName.trim()
        : null,
    customerPhone:
      typeof data.customerPhone === "string"
        ? data.customerPhone.trim()
        : null,
    customerEmail:
      typeof data.customerEmail === "string"
        ? data.customerEmail.trim()
        : null,
    shopName:
      typeof data.shopName === "string"
        ? data.shopName.trim()
        : null,
    shopPhone:
      typeof data.shopPhone === "string"
        ? data.shopPhone.trim()
        : null,
    items,
    charges,
    subtotal:
      typeof data.subtotal === "number" &&
      Number.isFinite(data.subtotal)
        ? data.subtotal
        : null,
    discount:
      typeof data.discount === "number" &&
      Number.isFinite(data.discount)
        ? data.discount
        : null,
    tax:
      typeof data.tax === "number" &&
      Number.isFinite(data.tax)
        ? data.tax
        : null,
    total:
      typeof data.total === "number" &&
      Number.isFinite(data.total)
        ? data.total
        : null,
    paymentMethod:
      typeof data.paymentMethod === "string"
        ? data.paymentMethod.trim()
        : null,
    warrantyPeriod:
      typeof data.warrantyPeriod === "string"
        ? data.warrantyPeriod.trim()
        : null,
    warrantyExpiry:
      typeof data.warrantyExpiry === "string"
        ? data.warrantyExpiry.trim()
        : null,
    rawText:
      typeof data.rawText === "string"
        ? data.rawText.trim()
        : null,
  };
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^\`\`\`json\s*/i, "")
    .replace(/^\`\`\`\s*/i, "")
    .replace(/\s*\`\`\`$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      throw new ApiError(
        502,
        "OCR service returned an invalid response.",
        "OCR_INVALID_RESPONSE",
      );
    }

    try {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1),
      );
    } catch {
      throw new ApiError(
        502,
        "OCR service returned an invalid JSON response.",
        "OCR_INVALID_RESPONSE",
      );
    }
  }
}

export async function extractInvoiceDataFromImage(
  input: OcrInput,
  requestedDocumentType?: string,
): Promise<OcrResult> {
  if (!input.buffer.length) {
    throw new ApiError(
      400,
      "Uploaded OCR image is empty.",
      "OCR_EMPTY_FILE",
    );
  }

  if (input.buffer.length > MAX_OCR_FILE_SIZE) {
    throw new ApiError(
      400,
      "OCR image cannot exceed 10 MB.",
      "OCR_FILE_TOO_LARGE",
    );
  }

  const normalizedMimeType =
    input.mimeType.toLowerCase().trim();

  if (!ALLOWED_OCR_MIME_TYPES.has(normalizedMimeType)) {
    throw new ApiError(
      400,
      "OCR currently supports JPG, PNG, and WebP images.",
      "OCR_UNSUPPORTED_FILE_TYPE",
    );
  }

  const { apiKey, model } = getGeminiConfig();

  const requestedTypeInstruction = requestedDocumentType
    ? `The user expects this document to be a ${requestedDocumentType}.`
    : "Determine the document type yourself.";

  const prompt = `
You are the OCR and document extraction engine for BillNest,
a billing and warranty management application.

Analyze the uploaded document image carefully.

${requestedTypeInstruction}

Your job is to read the visible document and return structured data.

IMPORTANT RULES:

1. Do not invent information.
2. If a field is not visible or cannot be determined, return null.
3. Preserve product names as accurately as possible.
4. Preserve invoice numbers exactly when readable.
5. Extract Indian phone numbers when visible.
6. Extract prices as numeric values without currency symbols.
7. Extract quantities as numbers.
8. Extract tax percentage when visible.
9. Extract serial numbers when visible.
10. Extract SKU values when visible.
11. If the document contains warranty information, extract it.
12. If a date is clearly visible, return it in YYYY-MM-DD format when possible.
13. rawText should contain the important readable text from the document.
14. Do not add explanations outside the JSON.
15. Return ONLY valid JSON.

16. The "items" array must contain ONLY actual purchased products or clearly billable services. Never put a fee or summary row in "items".
17. Use "lineType": "product" for a physical product, "service" for a genuine billable service, and "charge" ONLY for a non-product fee or adjustment.
18. Put marketplace fees, platform fees, shipping, delivery, handling, convenience fees, payment-processing fees, taxes/GST, discounts, subtotals, totals, order summaries, and similar charges in the separate "charges" array instead of "items".
19. For Amazon-style invoices, "Marketplace Fees" is a charge, NOT a product. The actual purchased product should be the only product item unless there are multiple genuine purchased products.
20. Never duplicate a product because its name or details appear in multiple sections of the document. Count each purchased product line once.
21. Quantity and unitPrice must come from the actual product line. Never use a fee or summary amount as a product price.
22. If the same product appears in both an order-summary section and an item-details section, keep only the actual item-details line.
23. The "charges" array should contain each meaningful non-product charge once, with its visible amount when available.

Return ONLY valid JSON.

Return this exact structure:

{
  "documentType": "invoice | receipt | warranty | product_document | other",
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "customerName": "string or null",
  "customerPhone": "string or null",
  "customerEmail": "string or null",
  "shopName": "string or null",
  "shopPhone": "string or null",
  "items": [
    {
      "productName": "string",
      "lineType": "product | service",
      "quantity": 0,
      "unitPrice": 0,
      "discount": 0,
      "taxRate": 0,
      "serialNumber": "string or null",
      "sku": "string or null"
    }
  ],
  "charges": [
    {
      "name": "string",
      "amount": 0
    }
  ],
  "subtotal": 0,
  "discount": 0,
  "tax": 0,
  "total": 0,
  "paymentMethod": "string or null",
  "warrantyPeriod": "string or null",
  "warrantyExpiry": "YYYY-MM-DD or null",
  "rawText": "string or null"
}
`;

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: normalizedMimeType,
                  data: createBase64(input.buffer),
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    const payload =
      (await response.json()) as GeminiResponse;

    if (!response.ok) {
      const message =
        payload.error?.message ??
        "Unknown Gemini API error.";

      console.error(
        "OCR request failed:",
        {
          status: response.status,
          code:
            payload.error?.code ??
            "unknown",
          geminiStatus:
            payload.error?.status ??
            "unknown",
          message,
          model,
        },
      );

      throw new ApiError(
        502,
        `Gemini OCR request failed [${response.status}]: ${message}`,
        "OCR_PROCESSING_FAILED",
      );
    }

    const outputText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

    if (!outputText) {
      throw new ApiError(
        502,
        "OCR service returned no text.",
        "OCR_EMPTY_RESPONSE",
      );
    }

    const parsed = extractJson(outputText);

    return normalizeOcrResult(parsed);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown Gemini API error.";

    console.error(
      "Gemini OCR request failed:",
      {
        message,
        model,
      },
    );

    throw new ApiError(
      502,
      `Gemini OCR request failed: ${message}`,
      "OCR_PROCESSING_FAILED",
    );
  }
}
