import type {
  Response,
} from "express";

import mongoose from "mongoose";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  ApiError,
} from "../utils/api-error";

import {
  stockAdjustmentSchema,
} from "../validators/stock-adjustment.validator";

import {
  adjustStockForOwner,
} from "../services/stock-adjustment.service";

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

export async function adjustStock(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    stockAdjustmentSchema.parse(
      req.body,
    );

  const result =
    await adjustStockForOwner(
      req.user.id,
      getProductId(req),
      input,
    );

  res.status(200).json({
    success: true,

    message:
      input.type === "in"
        ? "Stock added successfully."
        : "Stock removed successfully.",

    data: {
      product:
        result.product,

      movement:
        result.movement,
    },
  });
}