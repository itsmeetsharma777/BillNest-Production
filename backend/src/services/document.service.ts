import {
  createDocument,
  deleteDocumentByIdForShop,
  findDocumentByIdForShop,
  findDocumentsByShopId,
} from "../repositories/document.repository";

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
  uploadedBy: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  storageKey?: string;
}

/**
 * Create a document for the owner's shop.
 */
export async function createDocumentForOwner(
  ownerId: string,
  input: CreateDocumentInput,
) {
  const shop = await getShopForOwner(ownerId);

  if (input.sizeBytes !== undefined && input.sizeBytes < 0) {
    throw new ApiError(
      400,
      "Document size cannot be negative.",
      "INVALID_DOCUMENT_SIZE",
    );
  }

  if (!input.name.trim()) {
    throw new ApiError(
      400,
      "Document name is required.",
      "INVALID_DOCUMENT_NAME",
    );
  }

  if (!input.url.trim()) {
    throw new ApiError(
      400,
      "Document URL is required.",
      "INVALID_DOCUMENT_URL",
    );
  }

  return createDocument({
    shopId: shop._id.toString(),

    ...(input.customerId && {
      customerId: input.customerId,
    }),

    ...(input.invoiceId && {
      invoiceId: input.invoiceId,
    }),

    ...(input.warrantyId && {
      warrantyId: input.warrantyId,
    }),

    uploadedBy: input.uploadedBy,
    name: input.name.trim(),
    type: input.type,
    mimeType: input.mimeType,
    url: input.url,

    ...(input.sizeBytes !== undefined && {
      sizeBytes: input.sizeBytes,
    }),

    ...(input.storageKey && {
      storageKey: input.storageKey,
    }),
  });
}

/**
 * Get documents belonging to the owner's shop.
 */
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
  const shop = await getShopForOwner(ownerId);

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

  const skip = (page - 1) * limit;

  const documents =
    await findDocumentsByShopId(
      shop._id.toString(),
      {
        skip,
        limit,
        customerId: options?.customerId,
        invoiceId: options?.invoiceId,
        warrantyId: options?.warrantyId,
        type: options?.type,
      },
    );

  return {
    documents,
    pagination: {
      page,
      limit,
      hasMore: documents.length === limit,
    },
  };
}

/**
 * Get a single document belonging to the owner's shop.
 */
export async function getDocumentForOwner(
  ownerId: string,
  documentId: string,
) {
  const shop = await getShopForOwner(ownerId);

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

/**
 * Deactivate a document belonging to the owner's shop.
 */
export async function deactivateDocumentForOwner(
  ownerId: string,
  documentId: string,
) {
  const shop = await getShopForOwner(ownerId);

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

  return deletedDocument;
}