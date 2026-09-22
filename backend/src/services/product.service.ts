import mongoose from "mongoose";

import {
  countProductsByShopId,
  createProduct,
  deleteProductByIdForShop,
  findProductByIdForShop,
  findProductsByShopId,
  updateProductByIdForShop,
} from "../repositories/product.repository";

import {
  createInventoryMovement,
} from "../repositories/inventory-movement.repository";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanOptionalText(
  value?: string,
) {
  const trimmed =
    value?.trim();

  return trimmed || undefined;
}

function isDuplicateKeyError(
  error: unknown,
) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as {
      code?: unknown;
    }).code === 11000
  );
}

/*
 * ============================================================
 * CREATE PRODUCT
 * ============================================================
 *
 * Product creation and initial inventory movement happen
 * inside the SAME MongoDB transaction.
 */

export async function createProductForOwner(
  ownerId: string,
  input: {
    name: string;
    sku?: string;
    category?: string;

    /*
     * Advanced catalog foundation.
     */
    brand?: string;
    barcode?: string;
    unit?: string;

    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    warrantyPeriodMonths: number;
    description?: string;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const session =
    await mongoose.startSession();

  try {
    const result =
      await session.withTransaction(
        async () => {
          /*
           * ======================================================
           * CREATE PRODUCT
           * ======================================================
           */

          const product =
            await createProduct(
              {
                shopId:
                  shop._id.toString(),

                name:
                  input.name.trim(),

                sku:
                  cleanOptionalText(
                    input.sku,
                  ),

                category:
                  cleanOptionalText(
                    input.category,
                  ),

                /*
                 * Advanced catalog foundation.
                 */

                brand:
                  cleanOptionalText(
                    input.brand,
                  ),

                barcode:
                  cleanOptionalText(
                    input.barcode,
                  ),

                unit:
                  cleanOptionalText(
                    input.unit,
                  ),

                purchasePrice:
                  input.purchasePrice,

                sellingPrice:
                  input.sellingPrice,

                stockQuantity:
                  input.stockQuantity,

                lowStockThreshold:
                  input.lowStockThreshold,

                warrantyPeriodMonths:
                  input.warrantyPeriodMonths,

                description:
                  cleanOptionalText(
                    input.description,
                  ),
              },
              session,
            );

          /*
           * ======================================================
           * INITIAL STOCK MOVEMENT
           * ======================================================
           *
           * Only create a movement when the product
           * actually starts with stock.
           */

          let movement = null;

          if (
            input.stockQuantity > 0
          ) {
            movement =
              await createInventoryMovement(
                {
                  shopId:
                    shop._id.toString(),

                  productId:
                    product._id.toString(),

                  productName:
                    product.name,

                  ...(product.sku && {
                    sku:
                      product.sku,
                  }),

                  movementType:
                    "initial_stock",

                  quantity:
                    input.stockQuantity,

                  previousStock: 0,

                  newStock:
                    input.stockQuantity,

                  referenceType:
                    "product_creation",

                  referenceId:
                    product._id.toString(),

                  reason:
                    "Initial stock recorded when product was created.",

                  createdBy:
                    ownerId,
                },
                session,
              );
          }

          return {
            product,
            movement,
          };
        },
      );

    if (!result) {
      throw new ApiError(
        500,
        "Product creation transaction failed.",
        "PRODUCT_CREATION_TRANSACTION_FAILED",
      );
    }

    return result;
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      /*
       * At this stage both SKU and barcode can cause
       * duplicate-key errors.
       *
       * We distinguish the likely field from MongoDB's
       * duplicate-key metadata when available.
       */

      const duplicateKey =
        error !== null &&
        typeof error === "object" &&
        "keyPattern" in error
          ? (
              error as {
                keyPattern?: Record<
                  string,
                  unknown
                >;
              }
            ).keyPattern
          : undefined;

      if (
        duplicateKey?.barcode
      ) {
        throw new ApiError(
          409,
          "A product with this barcode already exists in your shop.",
          "PRODUCT_BARCODE_ALREADY_EXISTS",
        );
      }

      throw new ApiError(
        409,
        "A product with this SKU already exists in your shop.",
        "PRODUCT_SKU_ALREADY_EXISTS",
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

/*
 * ============================================================
 * GET PRODUCTS
 * ============================================================
 */

export async function getProductsForOwner(
  ownerId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const skip =
    (options.page - 1) *
    options.limit;

  const [
    products,
    total,
  ] = await Promise.all([
    findProductsByShopId(
      shop._id.toString(),
      {
        skip,

        limit:
          options.limit,

        search:
          options.search,

        category:
          options.category,

        isActive:
          options.isActive,
      },
    ),

    countProductsByShopId(
      shop._id.toString(),
      {
        search:
          options.search,

        category:
          options.category,

        isActive:
          options.isActive,
      },
    ),
  ]);

  return {
    products,

    pagination: {
      page:
        options.page,

      limit:
        options.limit,

      total,

      hasMore:
        skip +
          products.length <
        total,
    },
  };
}

/*
 * ============================================================
 * GET ONE PRODUCT
 * ============================================================
 */

export async function getProductForOwner(
  ownerId: string,
  productId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const product =
    await findProductByIdForShop(
      productId,
      shop._id.toString(),
    );

  if (!product) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  return product;
}

/*
 * ============================================================
 * UPDATE PRODUCT
 * ============================================================
 *
 * stockQuantity is intentionally NOT accepted here.
 *
 * Inventory changes must go through the inventory
 * stock-adjustment workflow.
 */

export async function updateProductForOwner(
  ownerId: string,
  productId: string,
  input: {
    name?: string;
    sku?: string;
    category?: string;

    /*
     * Advanced catalog foundation.
     */
    brand?: string;
    barcode?: string;
    unit?: string;

    purchasePrice?: number;
    sellingPrice?: number;
    lowStockThreshold?: number;
    warrantyPeriodMonths?: number;
    description?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const existing =
    await findProductByIdForShop(
      productId,
      shop._id.toString(),
    );

  if (!existing) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  try {
    const updated =
      await updateProductByIdForShop(
        productId,
        shop._id.toString(),
        {
          ...(input.name !==
            undefined && {
            name:
              input.name.trim(),
          }),

          ...(input.sku !==
            undefined && {
            sku:
              cleanOptionalText(
                input.sku,
              ) ?? "",
          }),

          ...(input.category !==
            undefined && {
            category:
              cleanOptionalText(
                input.category,
              ) ?? "",
          }),

          /*
           * Advanced catalog foundation.
           */

          ...(input.brand !==
            undefined && {
            brand:
              cleanOptionalText(
                input.brand,
              ) ?? "",
          }),

          ...(input.barcode !==
            undefined && {
            barcode:
              cleanOptionalText(
                input.barcode,
              ) ?? "",
          }),

          ...(input.unit !==
            undefined && {
            unit:
              cleanOptionalText(
                input.unit,
              ) ?? "",
          }),

          ...(input.purchasePrice !==
            undefined && {
            purchasePrice:
              input.purchasePrice,
          }),

          ...(input.sellingPrice !==
            undefined && {
            sellingPrice:
              input.sellingPrice,
          }),

          ...(input.lowStockThreshold !==
            undefined && {
            lowStockThreshold:
              input.lowStockThreshold,
          }),

          ...(input.warrantyPeriodMonths !==
            undefined && {
            warrantyPeriodMonths:
              input.warrantyPeriodMonths,
          }),

          ...(input.description !==
            undefined && {
            description:
              input.description.trim(),
          }),

          ...(input.isActive !==
            undefined && {
            isActive:
              input.isActive,
          }),
        },
      );

    if (!updated) {
      throw new ApiError(
        404,
        "Product not found.",
        "PRODUCT_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      const duplicateKey =
        error !== null &&
        typeof error === "object" &&
        "keyPattern" in error
          ? (
              error as {
                keyPattern?: Record<
                  string,
                  unknown
                >;
              }
            ).keyPattern
          : undefined;

      if (
        duplicateKey?.barcode
      ) {
        throw new ApiError(
          409,
          "A product with this barcode already exists in your shop.",
          "PRODUCT_BARCODE_ALREADY_EXISTS",
        );
      }

      throw new ApiError(
        409,
        "A product with this SKU already exists in your shop.",
        "PRODUCT_SKU_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

/*
 * ============================================================
 * DEACTIVATE PRODUCT
 * ============================================================
 */

export async function deleteProductForOwner(
  ownerId: string,
  productId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const product =
    await deleteProductByIdForShop(
      productId,
      shop._id.toString(),
    );

  if (!product) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  return product;
}