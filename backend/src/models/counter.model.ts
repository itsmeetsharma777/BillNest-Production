import { Schema, model, type InferSchemaType } from "mongoose";

const counterSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    sequence: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

counterSchema.index(
  { shopId: 1, key: 1 },
  { unique: true },
);

export type Counter = InferSchemaType<typeof counterSchema>;

export const CounterModel = model("Counter", counterSchema);