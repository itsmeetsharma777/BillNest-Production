import { Schema, model, type InferSchemaType } from "mongoose";

const userPreferencesSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  role: { type: String, enum: ["shopkeeper", "customer"], required: true },
  preferences: { type: Schema.Types.Mixed, required: true, default: {} },
}, { timestamps: true, minimize: false });

export type UserPreferencesDocument = InferSchemaType<typeof userPreferencesSchema>;
export const UserPreferencesModel = model("UserPreferences", userPreferencesSchema);
