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
      uppercase: true,
      maxlength: 15,
      validate: { validator: (value: string) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value), message: 'Invalid GSTIN format.' },
    },

    gstEnabled: { type: Boolean, default: false },
    gstPriceMode: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },
    defaultGstRate: { type: Number, min: 0, max: 100, default: 0 },
    gstStateCode: { type: String, trim: true, match: /^[0-9]{2}$/ },

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