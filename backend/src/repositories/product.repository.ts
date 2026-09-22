
import {
  type ClientSession,
} from "mongoose";

import {
  ProductModel,
} from "../models/product.model";

interface ProductFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
}

/*
 * ============================================================
 * BUILD PRODUCT FILTER
 * ============================================================
 */

function buildProductFilter(
  shopId: string,
  options?: ProductFilters,
) {
  const filter: Record<
    string,
    unknown
  > = {
    shopId,
  };

  const search =
    options?.search?.trim();

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: search,
          $options: "i",
        },
      },
      {
        category: {
          $regex: search,
          $options: "i",
        },
      },
      {
        brand: {
          $regex: search,
          $options: "i",
        },
      },
      {
        barcode: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (options?.category) {
    filter.category =
      options.category;
  }

  if (
    options?.isActive !== undefined
  ) {
    filter.isActive =
      options.isActive;
  }

  return filter;
}

/*
 * ============================================================
 * CREATE PRODUCT
 * ============================================================
 */

export async function createProduct(
  data: {
    shopId: string;
    name: string;
    sku?: string;
    category?: string;
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
  session?: ClientSession,
) {
  if (!session) {
    return ProductModel.create(
      data,
    );
  }

  const [product] =
    await ProductModel.create(
      [data],
      {
        session,
      },
    );

  return product;
}

/*
 * ============================================================
 * FIND PRODUCTS
 * ============================================================
 */

export async function findProductsByShopId(
  shopId: string,
  options?: ProductFilters & {
    skip?: number;
    limit?: number;
  },
) {
  const filter =
    buildProductFilter(
      shopId,
      options,
    );

  return ProductModel.find(filter)
    .sort({
      isActive: -1,
      createdAt: -1,
    })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 20);
}

/*
 * ============================================================
 * COUNT PRODUCTS
 * ============================================================
 */

export async function countProductsByShopId(
  shopId: string,
  options?: ProductFilters,
) {
  const filter =
    buildProductFilter(
      shopId,
      options,
    );

  return ProductModel.countDocuments(
    filter,
  );
}

/*
 * ============================================================
 * FIND ONE PRODUCT
 * ============================================================
 */

export async function findProductByIdForShop(
  productId: string,
  shopId: string,
) {
  return ProductModel.findOne({
    _id: productId,
    shopId,
  });
}

/*
 * ============================================================
 * FIND PRODUCT BY BARCODE
 * ============================================================
 *
 * Barcode lookup is ALWAYS scoped by shopId.
 *
 * This prevents one shopkeeper from ever resolving a
 * barcode belonging to another shop.
 */

export async function findProductByBarcodeForShop(
  barcode: string,
  shopId: string,
) {
  return ProductModel.findOne({
    shopId,
    barcode,
  });
}

/*
 * ============================================================
 * UPDATE PRODUCT
 * ============================================================
 */

export async function updateProductByIdForShop(
  productId: string,
  shopId: string,
  data: Partial<{
    name: string;
    sku: string;
    category: string;
    brand: string;
    barcode: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    warrantyPeriodMonths: number;
    description: string;
    isActive: boolean;
  }>,
) {
  return ProductModel.findOneAndUpdate(
    {
      _id: productId,
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

/*
 * ============================================================
 * DEACTIVATE PRODUCT
 * ============================================================
 */

export async function deleteProductByIdForShop(
  productId: string,
  shopId: string,
) {
  return ProductModel.findOneAndUpdate(
    {
      _id: productId,
      shopId,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}