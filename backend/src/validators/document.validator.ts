import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-fA-F0-9]{24}$/,
    "Invalid MongoDB ID.",
  );

const documentTypeSchema = z.enum([
  "invoice",
  "warranty",
  "receipt",
  "product_document",
  "other",
]);

export const documentMetadataSchema =
  z.object({
    customerId:
      objectIdSchema.optional(),

    invoiceId:
      objectIdSchema.optional(),

    warrantyId:
      objectIdSchema.optional(),

    name: z
      .string()
      .trim()
      .min(
        1,
        "Document name is required.",
      )
      .max(
        255,
        "Document name cannot exceed 255 characters.",
      ),

    type: documentTypeSchema,
  });

export const documentListQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    customerId:
      objectIdSchema.optional(),

    invoiceId:
      objectIdSchema.optional(),

    warrantyId:
      objectIdSchema.optional(),

    type:
      documentTypeSchema.optional(),
  });