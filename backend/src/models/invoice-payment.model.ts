import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const invoicePaymentSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "online",
        "cheque",
      ],
      required: true,
    },

    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      maxlength: 100,
      unique: true,
      sparse: true,
    },

    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

invoicePaymentSchema.index({
  shopId: 1,
  invoiceId: 1,
  paidAt: -1,
});

invoicePaymentSchema.index({
  shopId: 1,
  customerId: 1,
  paidAt: -1,
});

export type InvoicePayment =
  InferSchemaType<
    typeof invoicePaymentSchema
  >;

export const InvoicePaymentModel =
  model(
    "InvoicePayment",
    invoicePaymentSchema,
  );