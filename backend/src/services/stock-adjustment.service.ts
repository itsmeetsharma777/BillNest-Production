import mongoose from "mongoose";

import {
  adjustProductStock,
} from "../repositories/stock-adjustment.repository";

import {
  findProductByIdForShop,
} from "../repositories/product.repository";

import {
  recordInventoryMovement,
} from "./inventory-movement.service";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

import type {
  StockAdjustmentInput,
} from "../validators/stock-adjustment.validator";

/**
 * ============================================================
 * ADJUST STOCK
 * ============================================================
 *
 * Performs a manual stock adjustment and records the
 * corresponding inventory movement in the SAME transaction.
 *
 * Stock IN:
 *
 *     4 → 9
 *
 * Stock OUT:
 *
 *     9 → 7
 */
export async function adjustStockForOwner(
  ownerId: string,
  productId: string,
  input: StockAdjustmentInput,
) {
  /**
   * Resolve the shop belonging to the authenticated
   * shopkeeper.
   */
  const shop =
    await getShopForOwner(
      ownerId,
    );

  /**
   * Verify that the product belongs to this shop.
   *
   * This provides tenant isolation.
   */
  const existingProduct =
    await findProductByIdForShop(
      productId,
      shop._id.toString(),
    );

  if (!existingProduct) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  if (!existingProduct.isActive) {
    throw new ApiError(
      400,
      "Inactive products cannot be adjusted.",
      "PRODUCT_INACTIVE",
    );
  }

  /**
   * Start MongoDB transaction.
   */
  const session =
    await mongoose.startSession();

  try {
    const transactionResult =
      await session.withTransaction(
        async () => {
          /**
           * Re-read the product inside the transaction.
           *
           * This ensures we work with the latest stock
           * value rather than relying on the earlier read.
           */
          const currentProduct =
            await findProductByIdForShop(
              productId,
              shop._id.toString(),
            );

          if (!currentProduct) {
            throw new ApiError(
              404,
              "Product not found.",
              "PRODUCT_NOT_FOUND",
            );
          }

          if (
            !currentProduct.isActive
          ) {
            throw new ApiError(
              400,
              "Inactive products cannot be adjusted.",
              "PRODUCT_INACTIVE",
            );
          }

          /**
           * Perform atomic stock adjustment.
           */
          const result =
            await adjustProductStock(
              productId,
              shop._id.toString(),
              input.type,
              input.quantity,
              session,
            );

          /**
           * ======================================================
           * RECORD INVENTORY MOVEMENT
           * ======================================================
           *
           * recordInventoryMovement() automatically
           * uses ownerId as createdBy.
           */
          const movement =
            await recordInventoryMovement(
              {
                ownerId,

                productId,

                movementType:
                  input.type === "in"
                    ? "adjustment_in"
                    : "adjustment_out",

                quantity:
                  input.quantity,

                previousStock:
                  result.previousStock,

                newStock:
                  result.newStock,

                referenceType:
                  "stock_adjustment",

                referenceId:
                  result.product._id.toString(),

                reason:
                  input.reason,
              },
              {
                session,
              },
            );

          /**
           * Return both the updated product and
           * the newly-created movement.
           */
          return {
            product:
              result.product,

            movement,
          };
        },
      );

    if (!transactionResult) {
      throw new ApiError(
        500,
        "Stock adjustment transaction failed.",
        "STOCK_ADJUSTMENT_TRANSACTION_FAILED",
      );
    }

    return transactionResult;
  } finally {
    await session.endSession();
  }
}