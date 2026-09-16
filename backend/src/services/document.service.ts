import {
  createDocument,
  deleteDocumentByIdForShop,
  findDocumentByIdForShop,
  findDocumentsByShopId,
} from "../repositories/document.repository";

import {
  findCustomerByIdForShop,
} from "../repositories/customer.repository";

import {
  findInvoiceByIdForShop,
} from "../repositories/invoice.repository";

import {
  findWarrantyByIdForShop,
} from "../repositories/warranty.repository";

import {
  deleteDocumentFileFromStorage,
  uploadDocumentFileToStorage,
} from "./storage.service";

import { getShopForOwner } from "./shop.service";

import { ApiError } from "../utils/api-error";

type DocumentType =
  | "invoice"
  | "warranty"
  | "receipt"
  | "product_document"
  | "other";

interface CreateDocumentInput {
  customerId?: string;
  invoiceId?: string;
  warrantyId?: string;
  name: string;
  type: DocumentType;
}

interface UploadedFileInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

async function validateDocumentReferences(
  shopId: string,
  input: CreateDocumentInput,
) {
  if (input.customerId) {
    const customer =
      await findCustomerByIdForShop(
        input.customerId,
        shopId,
      );

    if (!customer) {
      throw new ApiError(
        404,
        "Customer not found.",
        "CUSTOMER_NOT_FOUND",
      );
    }
  }

  if (input.invoiceId) {
    const invoice =
      await findInvoiceByIdForShop(
        input.invoiceId,
        shopId,
      );

    if (!invoice) {
      throw new ApiError(
        404,
        "Invoice not found.",
        "INVOICE_NOT_FOUND",
      );
    }

    if (
      input.customerId &&
      invoice.customerId.toString() !==
        input.customerId
    ) {
      throw new ApiError(
        400,
        "Invoice does not belong to the selected customer.",
        "INVALID_INVOICE_CUSTOMER",
      );
    }
  }

  if (input.warrantyId) {
    const warranty =
      await findWarrantyByIdForShop(
        input.warrantyId,
        shopId,
      );

    if (!warranty) {
      throw new ApiError(
        404,
        "Warranty not found.",
        "WARRANTY_NOT_FOUND",
      );
    }

    if (
      input.customerId &&
      warranty.customerId.toString() !==
        input.customerId
    ) {
      throw new ApiError(
        400,
        "Warranty does not belong to the selected customer.",
        "INVALID_WARRANTY_CUSTOMER",
      );
    }

    if (
      input.invoiceId &&
      warranty.invoiceId &&
      warranty.invoiceId.toString() !==
        input.invoiceId
    ) {
      throw new ApiError(
        400,
        "Warranty does not belong to the selected invoice.",
        "INVALID_WARRANTY_INVOICE",
      );
    }
  }
}

export async function createDocumentForOwner(
  ownerId: string,
  uploadedFile: UploadedFileInput,
  input: CreateDocumentInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  if (!uploadedFile.buffer.length) {
    throw new ApiError(
      400,
      "Uploaded file is empty.",
      "EMPTY_FILE",
    );
  }

  if (
    uploadedFile.sizeBytes >
    MAX_FILE_SIZE
  ) {
    throw new ApiError(
      400,
      "Document size cannot exceed 10 MB.",
      "DOCUMENT_TOO_LARGE",
    );
  }

  if (!input.name.trim()) {
    throw new ApiError(
      400,
      "Document name is required.",
      "INVALID_DOCUMENT_NAME",
    );
  }

  await validateDocumentReferences(
    shop._id.toString(),
    input,
  );

  const uploaded =
    await uploadDocumentFileToStorage({
      buffer: uploadedFile.buffer,
      mimeType:
        uploadedFile.mimeType,
      originalName:
        uploadedFile.originalName,
    });

  try {
    return await createDocument({
      shopId:
        shop._id.toString(),

      ...(input.customerId && {
        customerId:
          input.customerId,
      }),

      ...(input.invoiceId && {
        invoiceId:
          input.invoiceId,
      }),

      ...(input.warrantyId && {
        warrantyId:
          input.warrantyId,
      }),

      uploadedBy: ownerId,

      name: input.name.trim(),

      type: input.type,

      mimeType:
        uploaded.mimeType,

      url: uploaded.url,

      sizeBytes:
        uploaded.sizeBytes,

      storageKey:
        uploaded.storageKey,
    });
  } catch (error) {
    try {
      await deleteDocumentFileFromStorage(
        uploaded.storageKey,
        uploaded.mimeType,
      );
    } catch (cleanupError) {
      console.error(
        "Failed to clean up Cloudinary upload after database error:",
        cleanupError,
      );
    }

    throw error;
  }
}

export async function getDocumentsForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
    customerId?: string;
    invoiceId?: string;
    warrantyId?: string;
    type?: DocumentType;
  },
) {
  const shop =
    await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      options?.limit ?? 20,
      1,
    ),
    100,
  );

  const skip =
    (page - 1) * limit;

  const documents =
    await findDocumentsByShopId(
      shop._id.toString(),
      {
        skip,
        limit,
        customerId:
          options?.customerId,
        invoiceId:
          options?.invoiceId,
        warrantyId:
          options?.warrantyId,
        type:
          options?.type,
      },
    );

  return {
    documents,

    pagination: {
      page,
      limit,
      hasMore:
        documents.length === limit,
    },
  };
}

export async function getDocumentForOwner(
  ownerId: string,
  documentId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const document =
    await findDocumentByIdForShop(
      documentId,
      shop._id.toString(),
    );

  if (!document) {
    throw new ApiError(
      404,
      "Document not found.",
      "DOCUMENT_NOT_FOUND",
    );
  }

  return document;
}

export async function deactivateDocumentForOwner(
  ownerId: string,
  documentId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const document =
    await findDocumentByIdForShop(
      documentId,
      shop._id.toString(),
    );

  if (!document) {
    throw new ApiError(
      404,
      "Document not found.",
      "DOCUMENT_NOT_FOUND",
    );
  }

  const deletedDocument =
    await deleteDocumentByIdForShop(
      documentId,
      shop._id.toString(),
    );

  if (!deletedDocument) {
    throw new ApiError(
      404,
      "Document not found.",
      "DOCUMENT_NOT_FOUND",
    );
  }

  if (
    document.storageKey &&
    document.mimeType
  ) {
    try {
      await deleteDocumentFileFromStorage(
        document.storageKey,
        document.mimeType,
      );
    } catch (error) {
      console.error(
        "Failed to delete document from Cloudinary:",
        error,
      );
    }
  }

  return deletedDocument;
}