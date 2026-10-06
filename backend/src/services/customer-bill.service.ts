import crypto from "crypto";

import {
  CustomerModel,
} from "../models/customer.model";

import {
  createCustomerBill,
  findCustomerBillByHash,
  findCustomerBills,
  findCustomerBillById,
  updateCustomerBillForCustomer,
  deactivateCustomerBillForCustomer,
} from "../repositories/customer-bill.repository";

import {
  uploadDocumentFileToStorage,
  deleteDocumentFileFromStorage,
} from "./storage.service";

import {
  extractInvoiceDataFromImage,
} from "./ocr.service";

import { ApiError } from "../utils/api-error";



type BillQualitySeverity = "good" | "warning" | "poor";

interface BillQualityCheck {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

interface BillQuality {
  score: number;
  severity: BillQualitySeverity;
  checks: BillQualityCheck[];
  checkedAt: string;
}

function calculateBillQuality(
  extractedData: Record<string, unknown>,
): BillQuality {
  const checks: BillQualityCheck[] = [];
  let score = 100;

  const confidence =
    extractedData.confidence &&
    typeof extractedData.confidence === "object"
      ? (extractedData.confidence as Record<string, unknown>)
      : {};

  const lowConfidence = Object.values(confidence).filter(
    (value) =>
      value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).level === "low",
  ).length;

  const mediumConfidence = Object.values(confidence).filter(
    (value) =>
      value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).level === "medium",
  ).length;

  if (lowConfidence > 0) {
    score -= Math.min(30, lowConfidence * 10);
    checks.push({
      code: "LOW_CONFIDENCE",
      message: `${lowConfidence} field${lowConfidence === 1 ? "" : "s"} have low OCR confidence.`,
      severity: "error",
    });
  }

  if (mediumConfidence > 0) {
    score -= Math.min(20, mediumConfidence * 4);
    checks.push({
      code: "MEDIUM_CONFIDENCE",
      message: `${mediumConfidence} field${mediumConfidence === 1 ? "" : "s"} should be verified.`,
      severity: "warning",
    });
  }

  const requiredFields: Array<[string, string]> = [
    ["invoiceNumber", "Invoice number"],
    ["invoiceDate", "Bill date"],
    ["shopName", "Merchant name"],
    ["total", "Total amount"],
  ];

  const missingFields = requiredFields.filter(
    ([field]) => {
      const value = extractedData[field];
      return (
        value === null ||
        value === undefined ||
        (typeof value === "string" && !value.trim())
      );
    },
  );

  if (missingFields.length) {
    score -= Math.min(28, missingFields.length * 7);
    checks.push({
      code: "MISSING_FIELDS",
      message: `Missing important field${missingFields.length === 1 ? "" : "s"}: ${missingFields.map(([, label]) => label).join(", ")}.`,
      severity: "warning",
    });
  }

  const items = Array.isArray(extractedData.items)
    ? extractedData.items
    : [];

  if (!items.length) {
    score -= 10;
    checks.push({
      code: "NO_ITEMS",
      message: "No products or services were detected.",
      severity: "warning",
    });
  }

  const subtotal =
    typeof extractedData.subtotal === "number"
      ? extractedData.subtotal
      : null;
  const tax =
    typeof extractedData.tax === "number"
      ? extractedData.tax
      : null;
  const discount =
    typeof extractedData.discount === "number"
      ? extractedData.discount
      : 0;
  const total =
    typeof extractedData.total === "number"
      ? extractedData.total
      : null;

  if (
    subtotal !== null &&
    total !== null &&
    Math.abs((subtotal + (tax ?? 0) - discount) - total) > 1
  ) {
    score -= 15;
    checks.push({
      code: "TOTAL_MISMATCH",
      message: "Subtotal, tax, discount and total do not reconcile.",
      severity: "error",
    });
  }

  const rawText =
    typeof extractedData.rawText === "string"
      ? extractedData.rawText.trim()
      : "";

  if (rawText.length < 30) {
    score -= 10;
    checks.push({
      code: "LIMITED_TEXT",
      message: "Very little readable text was extracted. Check the original bill image.",
      severity: "warning",
    });
  }

  score = Math.max(0, Math.min(100, score));

  if (!checks.length) {
    checks.push({
      code: "PASSED",
      message: "Important fields are present and the extracted amounts are consistent.",
      severity: "info",
    });
  }

  return {
    score,
    severity:
      score >= 80
        ? "good"
        : score >= 60
          ? "warning"
          : "poor",
    checks,
    checkedAt: new Date().toISOString(),
  };
}

function withBillQuality(
  extractedData: Record<string, unknown>,
) {
  return {
    ...extractedData,
    quality: calculateBillQuality(extractedData),
  };
}

interface UploadedFileInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

function getCustomerForUser(userId: string) {
  return CustomerModel.findOne({
    userId,
    isActive: true,
  }).lean();
}

export async function createCustomerBillForUser(
  userId: string,
  file: UploadedFileInput,
) {
  const customer =
    await getCustomerForUser(userId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  if (!file.buffer.length) {
    throw new ApiError(
      400,
      "Uploaded bill is empty.",
      "EMPTY_FILE",
    );
  }

  const contentHash =
    crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");

  const existing =
    await findCustomerBillByHash(
      customer._id.toString(),
      contentHash,
    );

  if (existing) {
    throw new ApiError(
      409,
      "This bill already exists in your BillNest account.",
      "DUPLICATE_CUSTOMER_BILL",
    );
  }

  const uploaded =
    await uploadDocumentFileToStorage({
      buffer: file.buffer,
      mimeType: file.mimeType,
      originalName: file.originalName,
    });

  try {
    const extracted =
      await extractInvoiceDataFromImage({
        buffer: file.buffer,
        mimeType: file.mimeType,
        originalName: file.originalName,
      });

    const documentType =
      extracted.documentType ===
        "receipt"
        ? "receipt"
        : extracted.documentType ===
            "warranty"
          ? "warranty"
          : extracted.documentType ===
              "product_document"
            ? "product_document"
            : "invoice";

    return await createCustomerBill({
      customerId:
        customer._id,
      originalName:
        file.originalName,
      mimeType:
        uploaded.mimeType,
      url:
        uploaded.url,
      storageKey:
        uploaded.storageKey,
      sizeBytes:
        uploaded.sizeBytes,
      documentType,
      extractedData:
        withBillQuality(extracted as unknown as Record<string, unknown>),
      rawOcrText:
        extracted.rawText ?? "",
      contentHash,
      ocrStatus: "needs_review",
    });
  } catch (error) {
    try {
      await deleteDocumentFileFromStorage(
        uploaded.storageKey,
        uploaded.mimeType,
      );
    } catch (cleanupError) {
      console.error(
        "Failed to clean up customer bill upload:",
        cleanupError,
      );
    }

    throw error;
  }
}

export async function getCustomerBillsForUser(
  userId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  return findCustomerBills(
    customer._id.toString(),
  );
}

export async function getCustomerBillForUser(
  userId: string,
  billId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  const bill =
    await findCustomerBillById(
      customer._id.toString(),
      billId,
    );

  if (!bill) {
    throw new ApiError(
      404,
      "Bill not found.",
      "CUSTOMER_BILL_NOT_FOUND",
    );
  }

  return bill;
}


export async function updateCustomerBillForUser(
  userId: string,
  billId: string,
  data: {
    documentType?: string;
    extractedData?: Record<string, unknown>;
  },
) {
  const customer =
    await getCustomerForUser(userId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  const updatedData = data.extractedData
    ? withBillQuality(data.extractedData)
    : data.extractedData;

  const bill =
    await updateCustomerBillForCustomer(
      customer._id.toString(),
      billId,
      {
        ...data,
        extractedData: updatedData,
      },
    );

  if (!bill) {
    throw new ApiError(
      404,
      "Bill not found.",
      "CUSTOMER_BILL_NOT_FOUND",
    );
  }

  return bill;
}


export async function archiveCustomerBillForUser(
  userId: string,
  billId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  const bill =
    await deactivateCustomerBillForCustomer(
      customer._id.toString(),
      billId,
    );

  if (!bill) {
    throw new ApiError(
      404,
      "Bill not found.",
      "CUSTOMER_BILL_NOT_FOUND",
    );
  }

  return bill;
}
