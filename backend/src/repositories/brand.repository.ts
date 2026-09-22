import {
  BrandModel,
} from "../models/brand.model";

/**
 * ============================================================
 * FIND BRAND BY ID
 * ============================================================
 */

export async function findBrandByIdForShop(
  brandId: string,
  shopId: string,
) {
  return BrandModel.findOne({
    _id: brandId,
    shopId,
  });
}

/**
 * ============================================================
 * FIND BRAND BY NORMALIZED NAME
 * ============================================================
 */

export async function findBrandByNameForShop(
  normalizedName: string,
  shopId: string,
) {
  return BrandModel.findOne({
    shopId,
    normalizedName,
  });
}

/**
 * ============================================================
 * LIST BRANDS
 * ============================================================
 */

export async function findBrandsByShopId(
  shopId: string,
  options?: {
    search?: string;
    isActive?: boolean;
  },
) {
  const filter: Record<
    string,
    unknown
  > = {
    shopId,
  };

  if (
    options?.isActive !==
    undefined
  ) {
    filter.isActive =
      options.isActive;
  }

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
        manufacturer: {
          $regex: search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return BrandModel.find(
    filter,
  ).sort({
    isActive: -1,
    name: 1,
  });
}

/**
 * ============================================================
 * CREATE BRAND
 * ============================================================
 */

export async function createBrand(
  data: {
    shopId: string;
    name: string;
    normalizedName: string;
    description?: string;
    manufacturer?: string;
    website?: string;
  },
) {
  return BrandModel.create(
    data,
  );
}

/**
 * ============================================================
 * UPDATE BRAND
 * ============================================================
 */

export async function updateBrandByIdForShop(
  brandId: string,
  shopId: string,
  data: Partial<{
    name: string;
    normalizedName: string;
    description: string;
    manufacturer: string;
    website: string;
    isActive: boolean;
  }>,
) {
  return BrandModel.findOneAndUpdate(
    {
      _id: brandId,
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

/**
 * ============================================================
 * DEACTIVATE BRAND
 * ============================================================
 */

export async function deactivateBrandByIdForShop(
  brandId: string,
  shopId: string,
) {
  return BrandModel.findOneAndUpdate(
    {
      _id: brandId,
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