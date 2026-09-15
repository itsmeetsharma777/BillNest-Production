import { Types } from "mongoose";
import { DocumentModel } from "../models/document.model";

export async function findDocumentByIdForShop(
  documentId: string,
  shopId: string,
) {
  return DocumentModel.findOne({
    _id: documentId,
    shopId,
    isActive: true,
  });
}

export async function findDocumentsByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
    customerId?: string;
    invoiceId?: string;
    warrantyId?: string;
    type?: "invoice" | "warranty" | "receipt" | "product_document" | "other";
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter: {
    shopId: Types.ObjectId;
    customerId?: Types.ObjectId;
    invoiceId?: Types.ObjectId;
    warrantyId?: Types.ObjectId;
    type?: "invoice" | "warranty" | "receipt" | "product_document" | "other";
    isActive: boolean;
  } = {
    shopId: new Types.ObjectId(shopId),
    isActive: true,
  };

  if (options?.customerId) {
    filter.customerId = new Types.ObjectId(options.customerId);
  }

  if (options?.invoiceId) {
    filter.invoiceId = new Types.ObjectId(options.invoiceId);
  }

  if (options?.warrantyId) {
    filter.warrantyId = new Types.ObjectId(options.warrantyId);
  }

  if (options?.type) {
    filter.type = options.type;
  }

  return DocumentModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

export async function createDocument(data: {
  shopId: string;
  customerId?: string;
  invoiceId?: string;
  warrantyId?: string;
  uploadedBy: string;
  name: string;
  type: "invoice" | "warranty" | "receipt" | "product_document" | "other";
  mimeType: string;
  url: string;
  sizeBytes?: number;
  storageKey?: string;
}) {
  return DocumentModel.create(data);
}

export async function deleteDocumentByIdForShop(
  documentId: string,
  shopId: string,
) {
  return DocumentModel.findOneAndUpdate(
    {
      _id: documentId,
      shopId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
    },
  );
}