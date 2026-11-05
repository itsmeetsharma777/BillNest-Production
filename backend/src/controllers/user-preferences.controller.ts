import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { UserPreferencesModel } from "../models/user-preferences.model";

const preferencesSchema = z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length <= 80, "Too many preference fields.");

export async function getUserPreferences(req: AuthenticatedRequest, res: Response) {
  const data = await UserPreferencesModel.findOne({ userId: req.user.id, role: req.user.role }).lean();
  res.status(200).json({ success: true, data: data?.preferences ?? {} });
}

export async function updateUserPreferences(req: AuthenticatedRequest, res: Response) {
  const preferences = preferencesSchema.parse(req.body?.preferences);
  const data = await UserPreferencesModel.findOneAndUpdate(
    { userId: req.user.id, role: req.user.role },
    { $set: { preferences, role: req.user.role }, $setOnInsert: { userId: req.user.id } },
    { upsert: true, new: true, runValidators: true },
  ).lean();
  res.status(200).json({ success: true, message: "Preferences saved.", data: data?.preferences ?? preferences });
}
