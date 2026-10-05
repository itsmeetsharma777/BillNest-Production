import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  extractInvoiceDataFromImage,
} from "../services/ocr.service";

import {
  ocrOptionsSchema,
} from "../validators/ocr.validator";

export async function processOcrDocument(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.file) {
    res.status(400).json({
      success: false,

      message:
        "An image file is required.",

      code:
        "OCR_FILE_REQUIRED",
    });

    return;
  }

  const parsed =
    ocrOptionsSchema.safeParse(
      req.body ?? {},
    );

  if (!parsed.success) {
    res.status(400).json({
      success: false,

      message:
        "Invalid OCR options.",

      code:
        "OCR_VALIDATION_ERROR",

      errors:
        parsed.error.flatten()
          .fieldErrors,
    });

    return;
  }

  const result =
    await extractInvoiceDataFromImage(
      {
        buffer:
          req.file.buffer,

        mimeType:
          req.file.mimetype,

        originalName:
          req.file.originalname,
      },

      parsed.data
        .documentType,
    );

  res.status(200).json({
    success: true,

    message:
      "Document processed successfully.",

    data: {
      file: {
        originalName:
          req.file.originalname,

        mimeType:
          req.file.mimetype,

        sizeBytes:
          req.file.size,
      },

      extracted:
        result,
    },
  });
}