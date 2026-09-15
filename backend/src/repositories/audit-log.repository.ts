import { AuditLogModel } from "../models/audit-log.model";

export async function createAuditLog(data: {
  userId?: string;
  shopId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return AuditLogModel.create(data);
}

export async function findAuditLogsByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
    action?: string;
    entityType?: string;
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 50;

  const filter: {
    shopId: string;
    action?: string;
    entityType?: string;
  } = {
    shopId,
  };

  if (options?.action) {
    filter.action = options.action;
  }

  if (options?.entityType) {
    filter.entityType = options.entityType;
  }

  return AuditLogModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}