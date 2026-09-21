import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const invoiceItemSchema = new Schema(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    /*
     * When an invoice item comes from the
     * shop's product catalog, this stores
     * the original Product document ID.
     *
     * It is optional because BillNest also
     * supports manually entered services/items.
     */
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      index: true,
    },

    /*
     * Historical snapshot of the product name.
     *
     * We intentionally keep this even when
     * productId exists so old invoices remain
     * unchanged if the product is edited later.
     */
    productName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    /*
     * Historical snapshot of the SKU.
     */
    sku: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    serialNumber: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lineSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTax: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

invoiceItemSchema.index({
  invoiceId: 1,
});

invoiceItemSchema.index({
  productId: 1,
});

export type InvoiceItem =
  InferSchemaType<typeof invoiceItemSchema>;

export const InvoiceItemModel =
  model(
    "InvoiceItem",
    invoiceItemSchema,
  );