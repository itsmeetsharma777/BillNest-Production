import crypto from "crypto";

import {
  CustomerModel,
} from "../models/customer.model";

import {
  createCustomerBill,
  findCustomerBillByHash,
  findCustomerBills,
  findCustomerBillById,
} from "../repositories/customer-bill.repository";

import {
  uploadDocumentFileToStorage,
  deleteDocumentFileFromStorage,
} from "./storage.service";

import {
  extractInvoiceDataFromImage,
} from "./ocr.service";

import { ApiError } from "../utils/api-error";

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
        extracted,
      rawOcrText:
        extracted.rawText ?? "",
      contentHash,
      ocrStatus: "processed",
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
