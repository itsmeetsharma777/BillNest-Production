import {
  Types,
} from "mongoose";

import {
  InventoryMovementModel,
} from "../models/inventory-movement.model";

export type InventoryMovementType =
  | "initial_stock"
  | "purchase"
  | "sale"
  | "sale_reversal"
  | "adjustment_in"
  | "adjustment_out"
  | "correction";

export type InventoryMovementReferenceType =
  | "invoice"
  | "invoice_cancellation"
  | "product_creation"
  | "stock_adjustment"
  | "manual_correction";

interface InventoryMovementFilters {
  productId?: string;
  variantId?: string;
  movementType?: InventoryMovementType;
  referenceType?: InventoryMovementReferenceType;
  startDate?: Date;
  endDate?: Date;
}

function buildInventoryMovementFilter(
  shopId: string,
  options?: InventoryMovementFilters,
) {
  const filter: Record<
    string,
    unknown
  > = {
    shopId:
      new Types.ObjectId(
        shopId,
      ),
  };

  if (options?.productId) {
    filter.productId = new Types.ObjectId(options.productId);
  }

  if (options?.variantId) {
    filter.variantId = new Types.ObjectId(options.variantId);
  }

  if (
    options?.movementType
  ) {
    filter.movementType =
      options.movementType;
  }

  if (
    options?.referenceType
  ) {
    filter.referenceType =
      options.referenceType;
  }

  if (
    options?.startDate ||
    options?.endDate
  ) {
    const createdAt: Record<
      string,
      Date
    > = {};

    if (
      options.startDate
    ) {
      createdAt.$gte =
        options.startDate;
    }

    if (
      options.endDate
    ) {
      createdAt.$lte =
        options.endDate;
    }

    filter.createdAt =
      createdAt;
  }

  return filter;
}

/**
 * ============================================================
 * CREATE MOVEMENT
 * ============================================================
 *
 * This is intentionally exported for internal services.
 *
 * Public stock-changing operations will use this function later
 * in Feature 20.2 and Feature 20.3.
 */
export async function createInventoryMovement(
  data: {
    shopId: string;
    productId: string;
    variantId?: string;
    productName: string;
    sku?: string;
    movementType:
      InventoryMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    referenceType?:
      InventoryMovementReferenceType;
    referenceId?: string;
    reason?: string;
    createdBy: string;
  },
  session?: import("mongoose").ClientSession,
) {
  const movement =
    new InventoryMovementModel({
      shopId:
        data.shopId,

      productId:
        data.productId,

      ...(data.variantId && {
        variantId: data.variantId,
      }),

      productName:
        data.productName,

      ...(data.sku && {
        sku: data.sku,
      }),

      movementType:
        data.movementType,

      quantity:
        data.quantity,

      previousStock:
        data.previousStock,

      newStock:
        data.newStock,

      ...(data.referenceType && {
        referenceType:
          data.referenceType,
      }),

      ...(data.referenceId && {
        referenceId:
          data.referenceId,
      }),

      ...(data.reason && {
        reason:
          data.reason,
      }),

      createdBy:
        data.createdBy,
    });

  return movement.save({
    session,
  });
}

/**
 * ============================================================
 * FIND MOVEMENTS
 * ============================================================
 */
export async function findInventoryMovementsByShopId(
  shopId: string,
  options?: InventoryMovementFilters & {
    skip?: number;
    limit?: number;
  },
) {
  const filter =
    buildInventoryMovementFilter(
      shopId,
      options,
    );

  return InventoryMovementModel
    .find(filter)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip(
      options?.skip ?? 0,
    )
    .limit(
      options?.limit ?? 20,
    );
}

/**
 * ============================================================
 * COUNT MOVEMENTS
 * ============================================================
 */
export async function countInventoryMovementsByShopId(
  shopId: string,
  options?: InventoryMovementFilters,
) {
  const filter =
    buildInventoryMovementFilter(
      shopId,
      options,
    );

  return InventoryMovementModel.countDocuments(
    filter,
  );
}

/**
 * ============================================================
 * FIND MOVEMENTS FOR ONE PRODUCT
 * ============================================================
 */
export async function findInventoryMovementsByProductId(
  productId: string,
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
    movementType?: InventoryMovementType;
    startDate?: Date;
    endDate?: Date;
  },
) {
  return findInventoryMovementsByShopId(
    shopId,
    {
      ...options,

      productId,
    },
  );
}