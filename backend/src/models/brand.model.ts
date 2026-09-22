import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const brandSchema = new Schema(
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
      maxlength: 100,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    manufacturer: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    website: {
      type: String,
      trim: true,
      maxlength: 300,
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

/**
 * Fast brand listing for a shop.
 */
brandSchema.index({
  shopId: 1,
  isActive: 1,
});

/**
 * Brand search.
 */
brandSchema.index({
  shopId: 1,
  name: 1,
});

/**
 * Manufacturer search.
 */
brandSchema.index({
  shopId: 1,
  manufacturer: 1,
});

/**
 * Prevent duplicate brand names
 * inside the same shop.
 *
 * Case-insensitive through normalizedName.
 *
 * Nike
 * NIKE
 * nike
 *
 * are treated as the same brand.
 */
brandSchema.index(
  {
    shopId: 1,
    normalizedName: 1,
  },
  {
    unique: true,
  },
);

export type Brand =
  InferSchemaType<
    typeof brandSchema
  >;

export const BrandModel =
  model(
    "Brand",
    brandSchema,
  );