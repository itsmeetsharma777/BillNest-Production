import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const productImageSchema =
  new Schema(
    {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      publicId: {
        type: String,
        required: true,
        trim: true,
      },

      alt: {
        type: String,
        trim: true,
        maxlength: 200,
      },

      width: {
        type: Number,
        min: 1,
      },

      height: {
        type: Number,
        min: 1,
      },

      isPrimary: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: true,
    },
  );

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
     * Dedicated management functionality is implemented
     * throughout Feature 22.x.
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

    /*
     * ============================================================
     * PRODUCT IMAGES
     * ============================================================
     *
     * Maximum 5 images are supported per product.
     *
     * The first uploaded image becomes the primary image.
     *
     * Existing products automatically remain compatible because
     * this field defaults to an empty array.
     */

    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: (
          images: unknown[],
        ) =>
          images.length <= 5,

        message:
          "A product can have a maximum of 5 images.",
      },
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
 * DERIVED PRICING METRICS
 * ============================================================
 *
 * These values are calculated from purchasePrice and
 * sellingPrice. They are intentionally NOT stored in MongoDB.
 *
 * profitAmount
 * = selling price - purchase price
 *
 * profitMarginPercent
 * = profit / selling price × 100
 *
 * markupPercent
 * = profit / purchase price × 100
 *
 * Negative profit is preserved so products sold below cost
 * remain visible as a loss.
 */

productSchema.virtual(
  "profitAmount",
).get(function () {
  return (
    Math.round(
      (
        this.sellingPrice -
        this.purchasePrice +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
});

productSchema.virtual(
  "profitMarginPercent",
).get(function () {
  if (this.sellingPrice <= 0) {
    return 0;
  }

  const profit =
    this.sellingPrice -
    this.purchasePrice;

  return (
    Math.round(
      (
        (profit /
          this.sellingPrice) *
        100 +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
});

productSchema.virtual(
  "markupPercent",
).get(function () {
  if (this.purchasePrice <= 0) {
    return 0;
  }

  const profit =
    this.sellingPrice -
    this.purchasePrice;

  return (
    Math.round(
      (
        (profit /
          this.purchasePrice) *
        100 +
        Number.EPSILON
      ) * 100,
    ) / 100
  );
});

productSchema.set(
  "toJSON",
  {
    virtuals: true,
  },
);

productSchema.set(
  "toObject",
  {
    virtuals: true,
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
  InferSchemaType<
    typeof productSchema
  >;

export const ProductModel =
  model(
    "Product",
    productSchema,
  );