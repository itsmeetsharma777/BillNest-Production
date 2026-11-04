import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ShopModel } from "../models/shop.model";
import { ProductModel } from "../models/product.model";
import { CustomerModel } from "../models/customer.model";
import { InvoiceModel } from "../models/invoice.model";
import { InvoiceItemModel } from "../models/invoice-item.model";
import { WarrantyModel } from "../models/warranty.model";
import { ApiError } from "../utils/api-error";

type SearchResult = {
  id: string;
  type: "product" | "customer" | "invoice" | "warranty";
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(req: AuthenticatedRequest, res: Response) {
  const raw = req.query.q;
  if (typeof raw !== "string") {
    throw new ApiError(400, "Search query is required.", "SEARCH_QUERY_REQUIRED");
  }
  const query = raw.trim().slice(0, 80);
  if (query.length < 2) {
    return res.status(200).json({ success: true, data: { results: [], query } });
  }
  // Escape regex metacharacters so user text is treated as literal search input.
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const shop = await ShopModel.findOne({ ownerId: new mongoose.Types.ObjectId(req.user.id), isActive: true }).select("_id").lean();
  if (!shop) throw new ApiError(404, "Shop not found.", "SHOP_NOT_FOUND");
  const shopId = shop._id;

  const [products, shopCustomerIds, invoiceMatches, itemMatches, warranties] = await Promise.all([
    ProductModel.find({ shopId, isActive: true, $or: [{ name: regex }, { sku: regex }, { barcode: regex }] }).select("_id name sku barcode").sort({ name: 1 }).limit(6).lean(),
    InvoiceModel.distinct("customerId", { shopId }),
    InvoiceModel.find({ shopId, $or: [{ invoiceNumber: regex }] }).select("_id invoiceNumber customerId issueDate total status").sort({ issueDate: -1 }).limit(6).lean(),
    InvoiceItemModel.find({ productName: regex }).select("invoiceId productName").limit(12).lean(),
    WarrantyModel.find({ shopId, isActive: true, $or: [{ productName: regex }, { serialNumber: regex }] }).select("_id productName serialNumber status expiryDate").sort({ expiryDate: -1 }).limit(6).lean(),
  ]);

  const customerIds = shopCustomerIds.map((id) => id.toString());
  const matchingCustomers = customerIds.length
    ? await CustomerModel.find({ _id: { $in: shopCustomerIds }, isActive: true, $or: [{ name: regex }, { phone: regex }, { email: regex }] }).select("_id name phone email").sort({ name: 1 }).limit(6).lean()
    : [];

  const relevantItemInvoiceIds = itemMatches.map((item) => item.invoiceId);
  const relevantInvoices = relevantItemInvoiceIds.length
    ? await InvoiceModel.find({ shopId, _id: { $in: relevantItemInvoiceIds } }).select("_id invoiceNumber customerId issueDate total status").sort({ issueDate: -1 }).limit(6).lean()
    : [];
  const combinedInvoices = [...invoiceMatches, ...relevantInvoices];
  const uniqueInvoices = Array.from(new Map(combinedInvoices.map((invoice) => [invoice._id.toString(), invoice])).values()).slice(0, 6);
  const invoiceCustomerIds = [...new Set(uniqueInvoices.map((invoice) => invoice.customerId.toString()))];
  const invoiceCustomers = invoiceCustomerIds.length
    ? await CustomerModel.find({ _id: { $in: invoiceCustomerIds } }).select("_id name").lean()
    : [];
  const customerNameById = new Map(invoiceCustomers.map((customer) => [customer._id.toString(), customer.name]));

  const results: SearchResult[] = [
    ...products.map((item) => ({ id: item._id.toString(), type: "product" as const, title: item.name, subtitle: [item.sku ? "SKU " + item.sku : "", item.barcode ? "Barcode " + item.barcode : ""].filter(Boolean).join(" · ") || "Product", href: "/shopkeeper/products" })),
    ...matchingCustomers.map((item) => ({ id: item._id.toString(), type: "customer" as const, title: item.name, subtitle: [item.phone, item.email].filter(Boolean).join(" · ") || "Customer", href: "/shopkeeper/customers/" + item._id.toString() })),
    ...uniqueInvoices.map((item) => ({ id: item._id.toString(), type: "invoice" as const, title: item.invoiceNumber, subtitle: [customerNameById.get(item.customerId.toString()) ?? "Customer", item.status, "₹" + Number(item.total ?? 0).toLocaleString("en-IN")].join(" · "), href: "/shopkeeper/invoices/" + item._id.toString() })),
    ...warranties.map((item) => ({ id: item._id.toString(), type: "warranty" as const, title: item.productName, subtitle: [item.serialNumber ? "Serial " + item.serialNumber : "", item.status].filter(Boolean).join(" · ") || "Warranty", href: "/shopkeeper/warranties/" + item._id.toString() })),
  ].slice(0, 20);

  res.status(200).json({ success: true, data: { results, query } });
}
