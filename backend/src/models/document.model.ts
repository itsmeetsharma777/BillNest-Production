import { Schema, model, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },

    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      index: true,
    },

    warrantyId: {
      type: Schema.Types.ObjectId,
      ref: "Warranty",
      index: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },

    type: {
      type: String,
      enum: [
        "invoice",
        "warranty",
        "receipt",
        "product_document",
        "other",
      ],
      required: true,
      index: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },

    sizeBytes: {
      type: Number,
      min: 0,
    },

    storageKey: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({ shopId: 1, createdAt: -1 });
documentSchema.index({ shopId: 1, customerId: 1 });
documentSchema.index({ shopId: 1, invoiceId: 1 });

export type Document = InferSchemaType<typeof documentSchema>;

export const DocumentModel = model("Document", documentSchema);