import {
  createAuditLog,
  findAuditLogsByShopId,
} from "../repositories/audit-log.repository";

import { getShopForOwner } from "./shop.service";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "payment"
  | "cancel"
  | "upload";

type AuditEntityType =
  | "user"
  | "shop"
  | "customer"
  | "invoice"
  | "warranty"
  | "document"
  | "notification"
  | "system";

interface CreateAuditLogInput {
  userId: string;
  shopId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry.
 *
 * This function is intentionally small because the audit
 * repository is responsible for persistence while the
 * service provides the application-level interface.
 */
export async function createAuditLogEntry(
  input: CreateAuditLogInput,
) {
  return createAuditLog({
    userId: input.userId,

    ...(input.shopId && {
      shopId: input.shopId,
    }),

    action: input.action,
    entityType: input.entityType,

    ...(input.entityId && {
      entityId: input.entityId,
    }),

    ...(input.metadata && {
      metadata: input.metadata,
    }),

    ...(input.ipAddress && {
      ipAddress: input.ipAddress,
    }),

    ...(input.userAgent && {
      userAgent: input.userAgent,
    }),
  });
}

/**
 * Get audit logs belonging to the owner's shop.
 */
export async function getAuditLogsForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
  },
) {
  const shop = await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      options?.limit ?? 20,
      1,
    ),
    100,
  );

  const skip = (page - 1) * limit;

  const logs = await findAuditLogsByShopId(
    shop._id.toString(),
    {
      skip,
      limit,
    },
  );

  return {
    logs,
    pagination: {
      page,
      limit,
      hasMore: logs.length === limit,
    },
  };
}