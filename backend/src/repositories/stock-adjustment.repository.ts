import {
  Types,
  type ClientSession,
} from "mongoose";

import {
  ProductModel,
} from "../models/product.model";

import {
  ApiError,
} from "../utils/api-error";

/**
 * ============================================================
 * ADJUST PRODUCT STOCK
 * ============================================================
 *
 * Performs an atomic stock adjustment.
 *
 * type = "in"
 *      Adds stock.
 *
 * type = "out"
 *      Removes stock.
 *
 * Stock can never become negative.
 */
export async function adjustProductStock(
  productId: string,
  shopId: string,
  type: "in" | "out",
  quantity: number,
  session: ClientSession,
) {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new ApiError(
      400,
      "Stock adjustment quantity must be greater than zero.",
      "INVALID_STOCK_ADJUSTMENT_QUANTITY",
    );
  }

  const productObjectId =
    new Types.ObjectId(
      productId,
    );

  const shopObjectId =
    new Types.ObjectId(
      shopId,
    );

  /**
   * ==========================================================
   * STOCK IN
   * ==========================================================
   *
   * Example:
   *
   * Current stock = 4
   * Add = 5
   *
   * Result:
   * 4 → 9
   */
  if (type === "in") {
    const updatedProduct =
      await ProductModel.findOneAndUpdate(
        {
          _id: productObjectId,
          shopId: shopObjectId,
        },
        {
          $inc: {
            stockQuantity:
              quantity,
          },
        },
        {
          session,
          returnDocument:
            "after",
        },
      );

    if (!updatedProduct) {
      throw new ApiError(
        404,
        "Product not found.",
        "PRODUCT_NOT_FOUND",
      );
    }

    return {
      previousStock:
        updatedProduct.stockQuantity -
        quantity,

      newStock:
        updatedProduct.stockQuantity,

      product:
        updatedProduct,
    };
  }

  /**
   * ==========================================================
   * STOCK OUT
   * ==========================================================
   *
   * Example:
   *
   * Current stock = 9
   * Remove = 2
   *
   * Result:
   * 9 → 7
   *
   * The database condition:
   *
   * stockQuantity >= quantity
   *
   * guarantees that stock cannot become negative.
   */
  const updatedProduct =
    await ProductModel.findOneAndUpdate(
      {
        _id: productObjectId,
        shopId: shopObjectId,

        stockQuantity: {
          $gte: quantity,
        },
      },
      {
        $inc: {
          stockQuantity:
            -quantity,
        },
      },
      {
        session,
        returnDocument:
          "after",
      },
    );

  if (!updatedProduct) {
    const product =
      await ProductModel.findOne(
        {
          _id: productObjectId,
          shopId: shopObjectId,
        },
        {
          stockQuantity: 1,
          isActive: 1,
          name: 1,
        },
        {
          session,
        },
      );

    if (!product) {
      throw new ApiError(
        404,
        "Product not found.",
        "PRODUCT_NOT_FOUND",
      );
    }

    if (!product.isActive) {
      throw new ApiError(
        400,
        "Inactive products cannot have stock manually removed.",
        "PRODUCT_INACTIVE",
      );
    }

    throw new ApiError(
      400,
      `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, requested: ${quantity}.`,
      "INSUFFICIENT_STOCK",
    );
  }

  return {
    previousStock:
      updatedProduct.stockQuantity +
      quantity,

    newStock:
      updatedProduct.stockQuantity,

    product:
      updatedProduct,
  };
}