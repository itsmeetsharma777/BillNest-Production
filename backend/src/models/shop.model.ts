import { Schema, model, type InferSchemaType } from "mongoose";

const shopSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    address: {
      line1: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      line2: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "India",
      },
    },

    taxId: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    logoUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
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

export type Shop = InferSchemaType<typeof shopSchema>;

export const ShopModel = model("Shop", shopSchema);