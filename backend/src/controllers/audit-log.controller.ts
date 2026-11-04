import type { Request, Response } from "express";
import mongoose from "mongoose";
import { AuditLogModel } from "../models/audit-log.model";
import { ShopModel } from "../models/shop.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/api-error";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().trim().max(120).optional(),
});

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  const query = querySchema.parse(req.query);
  const shop = await ShopModel.findOne({ ownerId: req.user.id }).select("_id").lean();
  if (!shop) throw new ApiError(404, "Shop not found.", "SHOP_NOT_FOUND");

  const filter: Record<string, unknown> = { shopId: shop._id };
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(query.from);
    if (query.to) createdAt.$lte = new Date(query.to);
    filter.createdAt = createdAt;
  }
  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), $options: "i" } },
      { entityType: { $regex: query.search.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), $options: "i" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total, actions, entityTypes] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit)
      .select("userId action entityType entityId metadata ipAddress userAgent createdAt")
      .populate("userId", "name email").lean(),
    AuditLogModel.countDocuments(filter),
    AuditLogModel.distinct("action", { shopId: shop._id }),
    AuditLogModel.distinct("entityType", { shopId: shop._id }),
  ]);

  res.status(200).json({ success: true, data: {
    items, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit),
    actions: actions.sort(), entityTypes: entityTypes.sort(),
  }});
}
