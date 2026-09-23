import mongoose from "mongoose";

import {
  ProductModel,
} from "../models/product.model";

import {
  deleteProductImageFromStorage,
  uploadProductImageToStorage,
} from "./storage.service";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

const MAX_PRODUCT_IMAGES = 5;

function assertProductId(
  productId: string,
) {
  if (
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
}

async function getProductForOwner(
  ownerId: string,
  productId: string,
) {
  assertProductId(
    productId,
  );

  const shop =
    await getShopForOwner(
      ownerId,
    );

  const product =
    await ProductModel.findOne({
      _id: productId,
      shopId: shop._id,
    });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found.",
      "PRODUCT_NOT_FOUND",
    );
  }

  return {
    shop,
    product,
  };
}

/*
 * ============================================================
 * ADD PRODUCT IMAGE
 * ============================================================
 */

export async function addProductImageForOwner(
  ownerId: string,
  productId: string,
  file:
    | Express.Multer.File
    | undefined,
) {
  if (!file) {
    throw new ApiError(
      400,
      "Product image is required.",
      "PRODUCT_IMAGE_REQUIRED",
    );
  }

  const {
    shop,
    product,
  } =
    await getProductForOwner(
      ownerId,
      productId,
    );

  if (
    product.images.length >=
    MAX_PRODUCT_IMAGES
  ) {
    throw new ApiError(
      400,
      `A product can have a maximum of ${MAX_PRODUCT_IMAGES} images.`,
      "PRODUCT_IMAGE_LIMIT_REACHED",
    );
  }

  const uploaded =
    await uploadProductImageToStorage({
      buffer:
        file.buffer,

      shopId:
        shop._id.toString(),

      productId:
        product._id.toString(),
    });

  try {
    const isPrimary =
      product.images.length === 0;

    product.images.push({
      url:
        uploaded.url,

      publicId:
        uploaded.publicId,

      width:
        uploaded.width,

      height:
        uploaded.height,

      alt:
        product.name,

      isPrimary,
    });

    await product.save();

    return product;
  } catch (error) {
    await deleteProductImageFromStorage(
      uploaded.publicId,
    ).catch(
      () => undefined,
    );

    throw error;
  }
}

/*
 * ============================================================
 * DELETE PRODUCT IMAGE
 * ============================================================
 */

export async function deleteProductImageForOwner(
  ownerId: string,
  productId: string,
  imageId: string,
) {
  const {
    product,
  } =
    await getProductForOwner(
      ownerId,
      productId,
    );

  const image =
    product.images.id(
      imageId,
    );

  if (!image) {
    throw new ApiError(
      404,
      "Product image not found.",
      "PRODUCT_IMAGE_NOT_FOUND",
    );
  }

  const wasPrimary =
    Boolean(
      image.isPrimary,
    );

  image.deleteOne();

  if (
    wasPrimary &&
    product.images.length > 1
  ) {
    const replacement =
      product.images.find(
        (item) =>
          item._id.toString() !==
          imageId,
      );

    if (replacement) {
      replacement.isPrimary =
        true;
    }
  }

  await product.save();

  await deleteProductImageFromStorage(
    image.publicId,
  ).catch(
    (error) => {
      console.error(
        "[Product Images] Cloudinary delete failed:",
        error,
      );
    },
  );

  return product;
}

/*
 * ============================================================
 * SET PRIMARY PRODUCT IMAGE
 * ============================================================
 */

export async function setPrimaryProductImageForOwner(
  ownerId: string,
  productId: string,
  imageId: string,
) {
  const {
    product,
  } =
    await getProductForOwner(
      ownerId,
      productId,
    );

  const image =
    product.images.id(
      imageId,
    );

  if (!image) {
    throw new ApiError(
      404,
      "Product image not found.",
      "PRODUCT_IMAGE_NOT_FOUND",
    );
  }

  product.images.forEach(
    (item) => {
      item.isPrimary =
        item._id.toString() ===
        imageId;
    },
  );

  await product.save();

  return product;
}