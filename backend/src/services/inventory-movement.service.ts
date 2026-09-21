import {
  countInventoryMovementsByShopId,
  findInventoryMovementsByShopId,
  createInventoryMovement,
  type InventoryMovementReferenceType,
  type InventoryMovementType,
} from "../repositories/inventory-movement.repository";

import {
  findProductByIdForShop,
} from "../repositories/product.repository";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

/**
 * ============================================================
 * INTERNAL MOVEMENT CREATION
 * ============================================================
 *
 * This function is used by trusted inventory operations.
 *
 * It is NOT exposed directly as a public API.
 */
export async function recordInventoryMovement(
  input: {
    ownerId: string;
    productId: string;
    movementType:
      InventoryMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    referenceType?:
      InventoryMovementReferenceType;
    referenceId?: string;
    reason?: string;
  },
  options?: {
    session?: import("mongoose").ClientSession;
  },
) {
  const shop =
    await getShopForOwner(
      input.ownerId,
    );

  if (
    !Number.isFinite(
      input.quantity,
    ) ||
    input.quantity <= 0
  ) {
    throw new ApiError(
      400,
      "Inventory movement quantity must be greater than zero.",
      "INVALID_INVENTORY_MOVEMENT_QUANTITY",
    );
  }

  if (
    !Number.isFinite(
      input.previousStock,
    ) ||
    input.previousStock < 0
  ) {
    throw new ApiError(
      400,
      "Previous stock must be a valid non-negative number.",
      "INVALID_PREVIOUS_STOCK",
    );
  }

  if (
    !Number.isFinite(
      input.newStock,
    ) ||
    input.newStock < 0
  ) {
    throw new ApiError(
      400,
      "New stock must be a valid non-negative number.",
      "INVALID_NEW_STOCK",
    );
  }

  const product =
    await findProductByIdForShop(
      input.productId,
      shop._id.toString(),
    );

  if (!product) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  const sku =
    product.sku?.trim();

  return createInventoryMovement(
    {
      shopId:
        shop._id.toString(),

      productId:
        product._id.toString(),

      productName:
        product.name,

      ...(sku && {
        sku,
      }),

      movementType:
        input.movementType,

      quantity:
        input.quantity,

      previousStock:
        input.previousStock,

      newStock:
        input.newStock,

      ...(input.referenceType && {
        referenceType:
          input.referenceType,
      }),

      ...(input.referenceId && {
        referenceId:
          input.referenceId,
      }),

      ...(input.reason?.trim() && {
        reason:
          input.reason.trim(),
      }),

      createdBy:
        input.ownerId,
    },
    options?.session,
  );
}

/**
 * ============================================================
 * GET INVENTORY MOVEMENTS
 * ============================================================
 */
export async function getInventoryMovementsForOwner(
  ownerId: string,
  options: {
    page: number;
    limit: number;
    productId?: string;
    movementType?:
      InventoryMovementType;
    referenceType?:
      InventoryMovementReferenceType;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  /*
   * If a product filter is supplied, verify that the
   * product belongs to this shop before querying movements.
   *
   * This prevents cross-tenant probing using another shop's
   * product ID.
   */
  if (
    options.productId
  ) {
    const product =
      await findProductByIdForShop(
        options.productId,
        shop._id.toString(),
      );

    if (!product) {
      throw new ApiError(
        404,
        "Product not found.",
        "PRODUCT_NOT_FOUND",
      );
    }
  }

  const skip =
    (options.page - 1) *
    options.limit;

  const filters = {
    productId:
      options.productId,

    movementType:
      options.movementType,

    referenceType:
      options.referenceType,

    startDate:
      options.startDate,

    endDate:
      options.endDate,
  };

  const [
    movements,
    total,
  ] = await Promise.all([
    findInventoryMovementsByShopId(
      shop._id.toString(),
      {
        ...filters,

        skip,

        limit:
          options.limit,
      },
    ),

    countInventoryMovementsByShopId(
      shop._id.toString(),
      filters,
    ),
  ]);

  return {
    movements,

    pagination: {
      page:
        options.page,

      limit:
        options.limit,

      total,

      hasMore:
        skip +
          movements.length <
        total,
    },
  };
}

/**
 * ============================================================
 * GET ONE PRODUCT'S INVENTORY HISTORY
 * ============================================================
 */
export async function getProductInventoryMovementsForOwner(
  ownerId: string,
  productId: string,
  options: {
    page: number;
    limit: number;
    movementType?:
      InventoryMovementType;
    startDate?: Date;
    endDate?: Date;
  },
) {
  return getInventoryMovementsForOwner(
    ownerId,
    {
      ...options,

      productId,
    },
  );
}