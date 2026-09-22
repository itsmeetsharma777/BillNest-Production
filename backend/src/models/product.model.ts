import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const productSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    sku: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    /*
     * ============================================================
     * ADVANCED CATALOG FOUNDATION
     * ============================================================
     *
     * These fields are optional for backward compatibility.
     *
     * Dedicated management functionality will be implemented
     * in the later Feature 22.x steps.
     */

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    barcode: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    unit: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },

    warrantyPeriodMonths: {
      type: Number,
      required: true,
      min: 0,
      max: 1200,
      default: 0,
    },

    description: {
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

/*
 * ============================================================
 * INDEXES
 * ============================================================
 */

productSchema.index({
  shopId: 1,
  name: 1,
});

productSchema.index({
  shopId: 1,
  category: 1,
});

productSchema.index({
  shopId: 1,
  brand: 1,
});

productSchema.index({
  shopId: 1,
  unit: 1,
});

productSchema.index({
  shopId: 1,
  isActive: 1,
});

/*
 * SKU must be unique within a shop.
 *
 * sparse = true allows multiple products to have
 * no SKU at all.
 */
productSchema.index(
  {
    shopId: 1,
    sku: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

/*
 * Barcode must also be unique within a shop.
 *
 * This allows the same barcode to technically exist
 * in different shops while preventing duplicate barcode
 * assignments inside one shop.
 *
 * sparse = true allows products without barcodes.
 */
productSchema.index(
  {
    shopId: 1,
    barcode: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

export type Product =
  InferSchemaType<typeof productSchema>;

export const ProductModel =
  model("Product", productSchema);