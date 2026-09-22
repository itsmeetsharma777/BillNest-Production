import {
  CategoryModel,
} from "../models/category.model";

/**
 * ============================================================
 * FIND CATEGORY BY ID
 * ============================================================
 */

export async function findCategoryByIdForShop(
  categoryId: string,
  shopId: string,
) {
  return CategoryModel.findOne({
    _id: categoryId,
    shopId,
  });
}

/**
 * ============================================================
 * FIND CATEGORY BY NORMALIZED NAME
 * ============================================================
 */

export async function findCategoryByNameForShop(
  normalizedName: string,
  shopId: string,
) {
  return CategoryModel.findOne({
    shopId,
    normalizedName,
  });
}

/**
 * ============================================================
 * LIST CATEGORIES
 * ============================================================
 */

export async function findCategoriesByShopId(
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
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return CategoryModel.find(
    filter,
  ).sort({
    isActive: -1,
    name: 1,
  });
}

/**
 * ============================================================
 * CREATE CATEGORY
 * ============================================================
 */

export async function createCategory(
  data: {
    shopId: string;
    name: string;
    normalizedName: string;
    description?: string;
  },
) {
  return CategoryModel.create(
    data,
  );
}

/**
 * ============================================================
 * UPDATE CATEGORY
 * ============================================================
 */

export async function updateCategoryByIdForShop(
  categoryId: string,
  shopId: string,
  data: Partial<{
    name: string;
    normalizedName: string;
    description: string;
    isActive: boolean;
  }>,
) {
  return CategoryModel.findOneAndUpdate(
    {
      _id: categoryId,
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
 * DEACTIVATE CATEGORY
 * ============================================================
 */

export async function deactivateCategoryByIdForShop(
  categoryId: string,
  shopId: string,
) {
  return CategoryModel.findOneAndUpdate(
    {
      _id: categoryId,
      shopId,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
    },
  );
}