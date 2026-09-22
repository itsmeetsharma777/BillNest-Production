import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

import {
  createBrand,
  deactivateBrandByIdForShop,
  findBrandByIdForShop,
  findBrandByNameForShop,
  findBrandsByShopId,
  updateBrandByIdForShop,
} from "../repositories/brand.repository";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalizeBrandName(
  name: string,
) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

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
    (
      error as {
        code?: unknown;
      }
    ).code === 11000
  );
}

/**
 * ============================================================
 * CREATE BRAND
 * ============================================================
 */

export async function createBrandForOwner(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    manufacturer?: string;
    website?: string;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const name =
    input.name
      .trim()
      .replace(/\s+/g, " ");

  if (!name) {
    throw new ApiError(
      400,
      "Brand name is required.",
      "INVALID_BRAND_NAME",
    );
  }

  const normalizedName =
    normalizeBrandName(
      name,
    );

  const existing =
    await findBrandByNameForShop(
      normalizedName,
      shop._id.toString(),
    );

  if (existing) {
    throw new ApiError(
      409,
      "A brand with this name already exists in your shop.",
      "BRAND_ALREADY_EXISTS",
    );
  }

  try {
    return await createBrand({
      shopId:
        shop._id.toString(),

      name,

      normalizedName,

      ...(cleanOptionalText(
        input.description,
      ) && {
        description:
          cleanOptionalText(
            input.description,
          ),
      }),

      ...(cleanOptionalText(
        input.manufacturer,
      ) && {
        manufacturer:
          cleanOptionalText(
            input.manufacturer,
          ),
      }),

      ...(cleanOptionalText(
        input.website,
      ) && {
        website:
          cleanOptionalText(
            input.website,
          ),
      }),
    });
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      throw new ApiError(
        409,
        "A brand with this name already exists in your shop.",
        "BRAND_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

/**
 * ============================================================
 * GET BRANDS
 * ============================================================
 */

export async function getBrandsForOwner(
  ownerId: string,
  options?: {
    search?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  return findBrandsByShopId(
    shop._id.toString(),
    {
      search:
        options?.search,

      isActive:
        options?.isActive,
    },
  );
}

/**
 * ============================================================
 * GET ONE BRAND
 * ============================================================
 */

export async function getBrandForOwner(
  ownerId: string,
  brandId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const brand =
    await findBrandByIdForShop(
      brandId,
      shop._id.toString(),
    );

  if (
    !brand ||
    !brand.isActive
  ) {
    throw new ApiError(
      404,
      "Brand not found.",
      "BRAND_NOT_FOUND",
    );
  }

  return brand;
}

/**
 * ============================================================
 * UPDATE BRAND
 * ============================================================
 */

export async function updateBrandForOwner(
  ownerId: string,
  brandId: string,
  input: {
    name?: string;
    description?: string;
    manufacturer?: string;
    website?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const existing =
    await findBrandByIdForShop(
      brandId,
      shop._id.toString(),
    );

  if (!existing) {
    throw new ApiError(
      404,
      "Brand not found.",
      "BRAND_NOT_FOUND",
    );
  }

  const updateData: {
    name?: string;
    normalizedName?: string;
    description?: string;
    manufacturer?: string;
    website?: string;
    isActive?: boolean;
  } = {};

  if (
    input.name !==
    undefined
  ) {
    const name =
      input.name
        .trim()
        .replace(/\s+/g, " ");

    if (!name) {
      throw new ApiError(
        400,
        "Brand name cannot be empty.",
        "INVALID_BRAND_NAME",
      );
    }

    const normalizedName =
      normalizeBrandName(
        name,
      );

    const duplicate =
      await findBrandByNameForShop(
        normalizedName,
        shop._id.toString(),
      );

    if (
      duplicate &&
      duplicate._id.toString() !==
        brandId
    ) {
      throw new ApiError(
        409,
        "A brand with this name already exists in your shop.",
        "BRAND_ALREADY_EXISTS",
      );
    }

    updateData.name =
      name;

    updateData.normalizedName =
      normalizedName;
  }

  if (
    input.description !==
    undefined
  ) {
    updateData.description =
      input.description.trim();
  }

  if (
    input.manufacturer !==
    undefined
  ) {
    updateData.manufacturer =
      input.manufacturer.trim();
  }

  if (
    input.website !==
    undefined
  ) {
    updateData.website =
      input.website.trim();
  }

  if (
    input.isActive !==
    undefined
  ) {
    updateData.isActive =
      input.isActive;
  }

  try {
    const updated =
      await updateBrandByIdForShop(
        brandId,
        shop._id.toString(),
        updateData,
      );

    if (!updated) {
      throw new ApiError(
        404,
        "Brand not found.",
        "BRAND_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      throw new ApiError(
        409,
        "A brand with this name already exists in your shop.",
        "BRAND_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

/**
 * ============================================================
 * DEACTIVATE BRAND
 * ============================================================
 */

export async function deactivateBrandForOwner(
  ownerId: string,
  brandId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const existing =
    await findBrandByIdForShop(
      brandId,
      shop._id.toString(),
    );

  if (
    !existing ||
    !existing.isActive
  ) {
    throw new ApiError(
      404,
      "Brand not found.",
      "BRAND_NOT_FOUND",
    );
  }

  const brand =
    await deactivateBrandByIdForShop(
      brandId,
      shop._id.toString(),
    );

  if (!brand) {
    throw new ApiError(
      404,
      "Brand not found.",
      "BRAND_NOT_FOUND",
    );
  }

  return brand;
}