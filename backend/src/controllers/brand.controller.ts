import type {
  Response,
} from "express";

import mongoose from "mongoose";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  createBrandForOwner,
  deactivateBrandForOwner,
  getBrandForOwner,
  getBrandsForOwner,
  updateBrandForOwner,
} from "../services/brand.service";

import {
  brandListQuerySchema,
  createBrandSchema,
  updateBrandSchema,
} from "../validators/brand.validator";

import {
  ApiError,
} from "../utils/api-error";

function getBrandId(
  req: AuthenticatedRequest,
) {
  const brandId =
    req.params.brandId;

  if (
    typeof brandId !==
      "string" ||
    !mongoose.isValidObjectId(
      brandId,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid brand ID.",
      "INVALID_BRAND_ID",
    );
  }

  return brandId;
}

/**
 * ============================================================
 * CREATE
 * ============================================================
 */

export async function createBrand(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    createBrandSchema.parse(
      req.body,
    );

  const brand =
    await createBrandForOwner(
      req.user.id,
      input,
    );

  res.status(201).json({
    success: true,

    message:
      "Brand created successfully.",

    data: {
      brand,
    },
  });
}

/**
 * ============================================================
 * LIST
 * ============================================================
 */

export async function getBrands(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    brandListQuerySchema.parse(
      req.query,
    );

  const isActive =
    query.isActive === "all"
      ? undefined
      : query.isActive === "true";

  const brands =
    await getBrandsForOwner(
      req.user.id,
      {
        search:
          query.search,

        isActive,
      },
    );

  res.status(200).json({
    success: true,

    data: {
      brands,
    },
  });
}

/**
 * ============================================================
 * GET ONE
 * ============================================================
 */

export async function getBrand(
  req: AuthenticatedRequest,
  res: Response,
) {
  const brand =
    await getBrandForOwner(
      req.user.id,
      getBrandId(req),
    );

  res.status(200).json({
    success: true,

    data: {
      brand,
    },
  });
}

/**
 * ============================================================
 * UPDATE
 * ============================================================
 */

export async function updateBrand(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateBrandSchema.parse(
      req.body,
    );

  const brand =
    await updateBrandForOwner(
      req.user.id,
      getBrandId(req),
      input,
    );

  res.status(200).json({
    success: true,

    message:
      "Brand updated successfully.",

    data: {
      brand,
    },
  });
}

/**
 * ============================================================
 * DEACTIVATE
 * ============================================================
 */

export async function deleteBrand(
  req: AuthenticatedRequest,
  res: Response,
) {
  await deactivateBrandForOwner(
    req.user.id,
    getBrandId(req),
  );

  res.status(200).json({
    success: true,

    message:
      "Brand deactivated successfully.",
  });
}