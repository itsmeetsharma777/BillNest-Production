import type {
  Response,
} from "express";

import mongoose from "mongoose";

import {
  createProductForOwner,
  deleteProductForOwner,
  getProductForOwner,
  getProductsForOwner,
  updateProductForOwner,
} from "../services/product.service";

import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from "../validators/product.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import { ApiError } from "../utils/api-error";

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

export async function createProduct(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    createProductSchema.parse(
      req.body,
    );

  const product =
    await createProductForOwner(
      req.user.id,
      input,
    );

  res.status(201).json({
    success: true,

    message:
      "Product created successfully.",

    data: {
      product,
    },
  });
}

export async function getProducts(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    productListQuerySchema.parse(
      req.query,
    );

  const result =
    await getProductsForOwner(
      req.user.id,
      query,
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getProduct(
  req: AuthenticatedRequest,
  res: Response,
) {
  const product =
    await getProductForOwner(
      req.user.id,
      getProductId(req),
    );

  res.status(200).json({
    success: true,

    data: {
      product,
    },
  });
}

export async function updateProduct(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateProductSchema.parse(
      req.body,
    );

  const product =
    await updateProductForOwner(
      req.user.id,
      getProductId(req),
      input,
    );

  res.status(200).json({
    success: true,

    message:
      "Product updated successfully.",

    data: {
      product,
    },
  });
}

export async function deleteProduct(
  req: AuthenticatedRequest,
  res: Response,
) {
  const product =
    await deleteProductForOwner(
      req.user.id,
      getProductId(req),
    );

  res.status(200).json({
    success: true,

    message:
      "Product deactivated successfully.",

    data: {
      product,
    },
  });
}