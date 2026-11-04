import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogModel } from "../models/audit-log.model";
import { ShopModel } from "../models/shop.model";

/** Best-effort audit writer: audit failures never break the business operation. */
export async function writeAuditLog(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const shop = await ShopModel.findOne({ ownerId: req.user.id }).select("_id").lean();
    if (!shop) return;

    const safeMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([key]) =>
        !/(password|token|secret|authorization|cookie|gstin|phone|email|address|paymentcredential)/i.test(key),
      ),
    );

    await AuditLogModel.create({
      userId: req.user.id,
      shopId: shop._id,
      action: action.slice(0, 100),
      entityType: entityType.slice(0, 100),
      ...(entityId ? { entityId } : {}),
      metadata: safeMetadata,
      ipAddress: req.ip?.slice(0, 100),
      userAgent: req.get("user-agent")?.slice(0, 1000),
    });
  } catch (error) {
    // Do not let secondary logging failures change business transaction outcomes.
    console.error("[Audit Log] Unable to record event:", error);
  }
}
