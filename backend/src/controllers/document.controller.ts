import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  createDocumentForOwner,
  deactivateDocumentForOwner,
  getDocumentForOwner,
  getDocumentsForOwner,
} from "../services/document.service";

import {
  documentListQuerySchema,
  documentMetadataSchema,
} from "../validators/document.validator";

function getDocumentId(
  req: AuthenticatedRequest,
): string {
  const {
    documentId,
  } = req.params;

  if (
    typeof documentId !==
      "string" ||
    !documentId.trim()
  ) {
    throw new Error(
      "Document ID is required.",
    );
  }

  return documentId;
}

export async function createDocumentController(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message:
        "A document file is required.",
      code: "FILE_REQUIRED",
    });

    return;
  }

  const parsed =
    documentMetadataSchema.safeParse(
      req.body,
    );

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message:
        "Invalid document metadata.",
      code: "VALIDATION_ERROR",
      errors:
        parsed.error.flatten()
          .fieldErrors,
    });

    return;
  }

  const document =
    await createDocumentForOwner(
      req.user.id,
      {
        buffer: req.file.buffer,

        mimeType:
          req.file.mimetype,

        originalName:
          req.file.originalname,

        sizeBytes:
          req.file.size,
      },
      parsed.data,
    );

  res.status(201).json({
    success: true,
    message:
      "Document uploaded successfully.",
    data: document,
  });
}

export async function getDocumentsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const parsed =
    documentListQuerySchema.safeParse(
      req.query,
    );

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message:
        "Invalid document query.",
      code: "VALIDATION_ERROR",
      errors:
        parsed.error.flatten()
          .fieldErrors,
    });

    return;
  }

  const documents =
    await getDocumentsForOwner(
      req.user.id,
      parsed.data,
    );

  res.status(200).json({
    success: true,
    data: documents,
  });
}

export async function getDocumentController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const document =
    await getDocumentForOwner(
      req.user.id,
      getDocumentId(req),
    );

  res.status(200).json({
    success: true,
    data: document,
  });
}

export async function deleteDocumentController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const document =
    await deactivateDocumentForOwner(
      req.user.id,
      getDocumentId(req),
    );

  res.status(200).json({
    success: true,
    message:
      "Document deleted successfully.",
    data: document,
  });
}