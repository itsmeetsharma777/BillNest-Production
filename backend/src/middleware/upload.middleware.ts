import multer from "multer";

import { ApiError } from "../utils/api-error";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const allowedMimeTypes =
  new Set([
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/webp",

    "text/plain",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize:
      MAX_FILE_SIZE,

    files: 1,
  },

  fileFilter: (
    _req,
    file,
    callback,
  ) => {
    if (
      !allowedMimeTypes.has(
        file.mimetype.toLowerCase(),
      )
    ) {
      callback(
        new ApiError(
          400,
          "Unsupported file type.",
          "UNSUPPORTED_FILE_TYPE",
        ),
      );

      return;
    }

    callback(
      null,
      true,
    );
  },
});

export const uploadDocumentFile =
  upload.single("file");

/*
 * ============================================================
 * PRODUCT IMAGE UPLOAD
 * ============================================================
 *
 * Product images intentionally use a separate Multer instance.
 *
 * This prevents Feature 22.6 from changing the existing
 * document-upload rules.
 *
 * Supported:
 *
 * JPG
 * PNG
 * WebP
 *
 * Maximum:
 *
 * 5 MB per image
 * 1 image per request
 */

const productImageStorage =
  multer.memoryStorage();

const productImageUpload =
  multer({
    storage:
      productImageStorage,

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files: 1,
    },

    fileFilter: (
      _req,
      file,
      callback,
    ) => {
      const allowedImageTypes =
        new Set([
          "image/jpeg",
          "image/png",
          "image/webp",
        ]);

      if (
        !allowedImageTypes.has(
          file.mimetype.toLowerCase(),
        )
      ) {
        callback(
          new ApiError(
            400,
            "Only JPG, PNG, and WebP product images are supported.",
            "UNSUPPORTED_PRODUCT_IMAGE_TYPE",
          ),
        );

        return;
      }

      callback(
        null,
        true,
      );
    },
  });

export const uploadProductImage =
  productImageUpload.single(
    "image",
  );