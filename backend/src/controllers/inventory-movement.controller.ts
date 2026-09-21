import type {
  Response,
} from "express";

import mongoose from "mongoose";

import {
  getInventoryMovementsForOwner,
  getProductInventoryMovementsForOwner,
  getInventoryValuationForOwner,
} from "../services/inventory-movement.service";

import {
  inventoryMovementListQuerySchema,
} from "../validators/inventory-movement.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  ApiError,
} from "../utils/api-error";

function getProductId(
  req: AuthenticatedRequest,
) {
  const productId =
    req.params.productId;

  if (
    typeof productId !==
      "string" ||
    !mongoose.isValidObjectId(
      productId,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid product ID.",
      "INVALID_PRODUCT_ID",
    );
  }

  return productId;
}

/**
 * ============================================================
 * GET /api/inventory/movements
 * ============================================================
 */
export async function getInventoryMovements(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    inventoryMovementListQuerySchema.parse(
      req.query,
    );

  const result =
    await getInventoryMovementsForOwner(
      req.user.id,
      query,
    );

  res.status(200).json({
    success: true,

    data: result,
  });
}

/**
 * ============================================================
 * GET /api/inventory/products/:productId/movements
 * ============================================================
 */
export async function getProductInventoryMovements(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    inventoryMovementListQuerySchema
      .omit({
        productId: true,
      })
      .parse(
        req.query,
      );

  const result =
    await getProductInventoryMovementsForOwner(
      req.user.id,
      getProductId(req),
      query,
    );

  res.status(200).json({
    success: true,

    data: result,
  });
}

/**
 * ============================================================
 * GET /api/inventory/valuation
 * ============================================================
 *
 * Returns the authoritative inventory valuation for the
 * authenticated shop.
 */
export async function getInventoryValuation(
  req: AuthenticatedRequest,
  res: Response,
) {
  const result =
    await getInventoryValuationForOwner(
      req.user.id,
    );

  res.status(200).json({
    success: true,

    data: {
      valuation: result,
    },
  });
}