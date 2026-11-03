import type { Response } from "express";
import { InvoiceModel } from "../models/invoice.model";
import { getShopForOwner } from "../services/shop.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/api-error";

export async function getGstSummary(req: AuthenticatedRequest, res: Response) {
  const fromRaw = typeof req.query.from === "string" ? req.query.from : undefined;
  const toRaw = typeof req.query.to === "string" ? req.query.to : undefined;
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;

  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    throw new ApiError(400, "Report dates must be valid ISO dates.", "INVALID_REPORT_DATE");
  }
  if (from && to && from > to) {
    throw new ApiError(400, "From date cannot be after to date.", "INVALID_REPORT_RANGE");
  }

  const shop = await getShopForOwner(req.user.id);
  const filter: Record<string, unknown> = { shopId: shop._id, status: { $ne: "cancelled" } };
  if (from || to) {
    const issueDate: Record<string, Date> = {};
    if (from) issueDate.$gte = from;
    if (to) {
      const end = new Date(to);
      if (toRaw && /^\d{4}-\d{2}-\d{2}$/.test(toRaw)) end.setHours(23, 59, 59, 999);
      issueDate.$lte = end;
    }
    filter.issueDate = issueDate;
  }

  const invoices = await InvoiceModel.find(filter).select("invoiceNumber issueDate subtotal discount tax cgst sgst igst total status").sort({ issueDate: 1 }).lean();
  const summary = invoices.reduce((acc, invoice) => ({
    invoiceCount: acc.invoiceCount + 1,
    taxableAmount: acc.taxableAmount + Math.max(0, (invoice.subtotal || 0) - (invoice.discount || 0)),
    totalTax: acc.totalTax + (invoice.tax || 0),
    cgst: acc.cgst + (invoice.cgst || 0),
    sgst: acc.sgst + (invoice.sgst || 0),
    igst: acc.igst + (invoice.igst || 0),
    invoiceTotal: acc.invoiceTotal + (invoice.total || 0),
  }), { invoiceCount: 0, taxableAmount: 0, totalTax: 0, cgst: 0, sgst: 0, igst: 0, invoiceTotal: 0 });

  res.status(200).json({ success: true, data: { from: fromRaw ?? null, to: toRaw ?? null, summary, invoices } });
}
