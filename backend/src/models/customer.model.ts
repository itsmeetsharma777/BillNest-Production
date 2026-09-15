import { Schema, model, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
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

customerSchema.index({ shopId: 1, email: 1 });
customerSchema.index({ shopId: 1, phone: 1 });

export type Customer = InferSchemaType<typeof customerSchema>;

export const CustomerModel = model("Customer", customerSchema);