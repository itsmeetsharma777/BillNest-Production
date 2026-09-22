import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const categorySchema = new Schema(
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
 * Fast category listing for a shop.
 */
categorySchema.index({
  shopId: 1,
  isActive: 1,
});

/**
 * Category search.
 */
categorySchema.index({
  shopId: 1,
  name: 1,
});

/**
 * Prevent duplicate category names
 * inside the same shop.
 *
 * normalizedName makes this case-insensitive:
 *
 * Electronics
 * electronics
 * ELECTRONICS
 *
 * are treated as the same category.
 */
categorySchema.index(
  {
    shopId: 1,
    normalizedName: 1,
  },
  {
    unique: true,
  },
);

export type Category =
  InferSchemaType<
    typeof categorySchema
  >;

export const CategoryModel =
  model(
    "Category",
    categorySchema,
  );