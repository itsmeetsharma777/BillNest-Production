import { Schema, model, type InferSchemaType } from "mongoose";

const customerBillSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
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

    storageKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },

    documentType: {
      type: String,
      enum: [
        "invoice",
        "receipt",
        "warranty",
        "product_document",
        "other",
      ],
      default: "invoice",
      index: true,
    },

    extractedData: {
      type: Schema.Types.Mixed,
      default: {},
    },

    rawOcrText: {
      type: String,
      default: "",
      maxlength: 50000,
    },

    contentHash: {
      type: String,
      required: true,
      index: true,
    },

    ocrStatus: {
      type: String,
      enum: [
        "processed",
        "needs_review",
        "failed",
      ],
      default: "processed",
      index: true,
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

customerBillSchema.index({
  customerId: 1,
  createdAt: -1,
});

customerBillSchema.index({
  customerId: 1,
  contentHash: 1,
});

export type CustomerBill =
  InferSchemaType<
    typeof customerBillSchema
  >;

export const CustomerBillModel =
  model(
    "CustomerBill",
    customerBillSchema,
  );
