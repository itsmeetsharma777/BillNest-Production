import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { bulkProductStatusSchema, productImportSchema } from "../validators/product-catalog.validator";
import {
  bulkUpdateProductStatusForOwner,
  exportProductsForOwner,
  getProductCatalogAnalyticsForOwner,
  importProductsForOwner,
} from "../services/product-catalog.service";

export async function bulkUpdateProductStatus(req: AuthenticatedRequest, res: Response) {
  const input = bulkProductStatusSchema.parse(req.body);
  const result = await bulkUpdateProductStatusForOwner(
    req.user.id,
    input.productIds,
    input.action === "activate",
  );
  res.json({
    success: true,
    message: `${result.modifiedCount} product(s) updated successfully.`,
    data: result,
  });
}

export async function exportProducts(req: AuthenticatedRequest, res: Response) {
  const csv = await exportProductsForOwner(req.user.id);
  res.status(200);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="billnest-products.csv"');
  res.send(csv);
}

export async function importProducts(req: AuthenticatedRequest, res: Response) {
  const input = productImportSchema.parse(req.body);
  const result = await importProductsForOwner(req.user.id, input.csv);
  res.status(result.failedCount > 0 ? 207 : 201).json({
    success: result.failedCount === 0,
    message: `${result.importedCount} product(s) imported; ${result.failedCount} failed.`,
    data: result,
  });
}

export async function getProductCatalogAnalytics(req: AuthenticatedRequest, res: Response) {
  const analytics = await getProductCatalogAnalyticsForOwner(req.user.id);
  res.json({ success: true, data: { analytics } });
}
