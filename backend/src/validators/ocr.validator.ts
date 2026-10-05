import { z } from "zod";

export const ocrDocumentTypeSchema =
  z.enum([
    "invoice",
    "receipt",
    "warranty",
    "product_document",
    "other",
  ]);

export const ocrOptionsSchema =
  z.object({
    documentType:
      ocrDocumentTypeSchema
        .optional(),
  });

export type OcrOptions =
  z.infer<
    typeof ocrOptionsSchema
  >;