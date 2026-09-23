import type {
  Response,
} from "express";

import {
  addProductImageForOwner,
  deleteProductImageForOwner,
  setPrimaryProductImageForOwner,
} from "../services/product-image.service";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  ApiError,
} from "../utils/api-error";

function getImageIds(
  req: AuthenticatedRequest,
) {
  const productId =
    req.params.productId;

  const imageId =
    req.params.imageId;

  if (
    typeof productId !==
      "string" ||
    typeof imageId !==
      "string"
  ) {
    throw new ApiError(
      400,
      "Invalid product image request.",
      "INVALID_PRODUCT_IMAGE_REQUEST",
    );
  }

  return {
    productId,
    imageId,
  };
}

/*
 * ============================================================
 * UPLOAD PRODUCT IMAGE
 * ============================================================
 */

export async function uploadProductImage(
  req: AuthenticatedRequest,
  res: Response,
) {
  const productId =
    req.params.productId;

  if (
    typeof productId !==
    "string"
  ) {
    throw new ApiError(
      400,
      "Invalid product ID.",
      "INVALID_PRODUCT_ID",
    );
  }

  const product =
    await addProductImageForOwner(
      req.user.id,
      productId,
      req.file,
    );

  res.status(201).json({
    success: true,

    message:
      "Product image uploaded successfully.",

    data: {
      product,
    },
  });
}

/*
 * ============================================================
 * DELETE PRODUCT IMAGE
 * ============================================================
 */

export async function deleteProductImage(
  req: AuthenticatedRequest,
  res: Response,
) {
  const {
    productId,
    imageId,
  } =
    getImageIds(req);

  const product =
    await deleteProductImageForOwner(
      req.user.id,
      productId,
      imageId,
    );

  res.status(200).json({
    success: true,

    message:
      "Product image deleted successfully.",

    data: {
      product,
    },
  });
}

/*
 * ============================================================
 * SET PRIMARY IMAGE
 * ============================================================
 */

export async function setPrimaryProductImage(
  req: AuthenticatedRequest,
  res: Response,
) {
  const {
    productId,
    imageId,
  } =
    getImageIds(req);

  const product =
    await setPrimaryProductImageForOwner(
      req.user.id,
      productId,
      imageId,
    );

  res.status(200).json({
    success: true,

    message:
      "Primary product image updated successfully.",

    data: {
      product,
    },
  });
}