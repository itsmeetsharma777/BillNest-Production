import { Types } from "mongoose";
import { WarrantyModel } from "../models/warranty.model";

export async function findWarrantyByIdForShop(
  warrantyId: string,
  shopId: string,
) {
  return WarrantyModel.findOne({
    _id: warrantyId,
    shopId,
  });
}

export async function findWarrantiesByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
    customerId?: string;
    status?:
      | "active"
      | "expiring_soon"
      | "expired"
      | "no_warranty";
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter: {
    shopId: Types.ObjectId;
    customerId?: Types.ObjectId;
    status?:
      | "active"
      | "expiring_soon"
      | "expired"
      | "no_warranty";
  } = {
    shopId: new Types.ObjectId(shopId),
  };

  if (options?.customerId) {
    filter.customerId = new Types.ObjectId(
      options.customerId,
    );
  }

  if (options?.status) {
    filter.status = options.status;
  }

  return WarrantyModel.find(filter)
    .sort({ expiryDate: 1 })
    .skip(skip)
    .limit(limit);
}

export async function findWarrantiesExpiringSoon(
  shopId: string,
  startDate: Date,
  endDate: Date,
) {
  return WarrantyModel.find({
    shopId: new Types.ObjectId(shopId),
    expiryDate: {
      $gt: startDate,
      $lte: endDate,
    },
    isActive: true,
  }).sort({
    expiryDate: 1,
  });
}

/**
 * Find active warranties across all shops whose
 * expiry date falls inside the supplied range.
 *
 * Used by the background warranty notification job.
 */
export async function findAllWarrantiesExpiringBetween(
  startDate: Date,
  endDate: Date,
) {
  return WarrantyModel.find({
    expiryDate: {
      $gt: startDate,
      $lte: endDate,
    },
    isActive: true,
    warrantyPeriodMonths: {
      $gt: 0,
    },
  }).sort({
    expiryDate: 1,
  });
}

/**
 * Find active warranties that have already expired.
 *
 * Used by the background warranty notification job.
 */
export async function findAllExpiredWarranties(
  now = new Date(),
) {
  return WarrantyModel.find({
    expiryDate: {
      $lte: now,
    },
    isActive: true,
    warrantyPeriodMonths: {
      $gt: 0,
    },
  }).sort({
    expiryDate: 1,
  });
}

export async function createWarranty(data: {
  shopId: string;
  customerId: string;
  invoiceId?: string;
  invoiceItemId?: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: Date;
  expiryDate: Date;
  status?:
    | "active"
    | "expiring_soon"
    | "expired"
    | "no_warranty";
  terms?: string;
  notes?: string;
}) {
  return WarrantyModel.create(data);
}

export async function updateWarrantyByIdForShop(
  warrantyId: string,
  shopId: string,
  data: Partial<{
    productName: string;
    serialNumber: string;
    warrantyPeriodMonths: number;
    startDate: Date;
    expiryDate: Date;
    status:
      | "active"
      | "expiring_soon"
      | "expired"
      | "no_warranty";
    terms: string;
    notes: string;
    isActive: boolean;
  }>,
) {
  return WarrantyModel.findOneAndUpdate(
    {
      _id: warrantyId,
      shopId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  );
}