import { Schema, model, type InferSchemaType } from "mongoose";

const invoiceSchema = new Schema(
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

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["draft", "paid", "partially_paid", "cancelled"],
      default: "draft",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "cheque"],
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    amountDue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ shopId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ shopId: 1, issueDate: -1 });
invoiceSchema.index({ shopId: 1, customerId: 1 });

export type Invoice = InferSchemaType<typeof invoiceSchema>;

export const InvoiceModel = model("Invoice", invoiceSchema);