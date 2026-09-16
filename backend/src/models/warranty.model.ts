import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const warrantySchema =
  new Schema(
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
        required: true,
        index: true,
      },

      invoiceId: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
        index: true,
      },

      invoiceItemId: {
        type: Schema.Types.ObjectId,
        ref: "InvoiceItem",
        required: true,
        index: true,
      },

      productName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200,
      },

      serialNumber: {
        type: String,
        trim: true,
        maxlength: 150,
      },

      warrantyPeriodMonths: {
        type: Number,
        required: true,
        min: 0,
        max: 1200,
      },

      startDate: {
        type: Date,
        required: true,
      },

      expiryDate: {
        type: Date,
        required: true,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "expiring_soon",
          "expired",
          "no_warranty",
        ],
        required: true,
        default: "active",
        index: true,
      },

      terms: {
        type: String,
        trim: true,
        maxlength: 5000,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 2000,
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

warrantySchema.index(
  {
    shopId: 1,
    invoiceItemId: 1,
  },
  {
    unique: true,
  },
);

warrantySchema.index({
  shopId: 1,
  expiryDate: 1,
});

warrantySchema.index({
  shopId: 1,
  customerId: 1,
  expiryDate: 1,
});

warrantySchema.index({
  shopId: 1,
  status: 1,
});

export type Warranty =
  InferSchemaType<
    typeof warrantySchema
  >;

export const WarrantyModel =
  model(
    "Warranty",
    warrantySchema,
  );