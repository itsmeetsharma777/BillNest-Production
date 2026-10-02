import { Types } from "mongoose";
import {
  bulkUpdateProductStatusForShop,
  findAllProductsByShopId,
  findProductsByIdsForShop,
  getCatalogAnalyticsByShopId,
} from "../repositories/product.repository";
import { getShopForOwner } from "./shop.service";
import { createProductForOwner } from "./product.service";
import { ApiError } from "../utils/api-error";

const HEADERS = [
  "name","sku","category","brand","barcode","unit",
  "purchasePrice","sellingPrice","stockQuantity","lowStockThreshold",
  "warrantyPeriodMonths","description","hasVariants",
] as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(csv: string) {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) throw new ApiError(400, "CSV file is empty.", "CSV_EMPTY");

  const header = parseCsvLine(lines[0]).map((value) => value.trim());
  const normalized = header.map((value) => value.toLowerCase());
  for (const required of ["name", "purchaseprice", "sellingprice", "stockquantity"]) {
    if (!normalized.includes(required)) {
      throw new ApiError(400, `CSV is missing required column "${required}".`, "CSV_COLUMN_MISSING");
    }
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    normalized.forEach((key, index) => { row[key] = (values[index] ?? "").trim(); });
    rows.push({ line: i + 1, row });
  }
  return rows;
}

function numberField(row: Record<string, string>, key: string, line: number, integer = false) {
  const value = Number(row[key] ?? "");
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new ApiError(400, `Invalid ${key} at CSV line ${line}.`, "CSV_INVALID_NUMBER");
  }
  return value;
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function bulkUpdateProductStatusForOwner(
  ownerId: string,
  productIds: string[],
  isActive: boolean,
) {
  const invalid = productIds.filter((id) => !Types.ObjectId.isValid(id));
  if (invalid.length) throw new ApiError(400, "One or more product IDs are invalid.", "INVALID_PRODUCT_IDS");

  const shop = await getShopForOwner(ownerId);
  const products = await findProductsByIdsForShop(productIds, shop._id.toString());
  if (products.length !== productIds.length) {
    throw new ApiError(404, "One or more selected products do not belong to your shop.", "PRODUCTS_NOT_FOUND");
  }
  const result = await bulkUpdateProductStatusForShop(productIds, shop._id.toString(), isActive);
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
}

export async function exportProductsForOwner(ownerId: string) {
  const shop = await getShopForOwner(ownerId);
  const products = await findAllProductsByShopId(shop._id.toString());
  const header = HEADERS.join(",");
  const rows = products.map((product) => [
    product.name, product.sku, product.category, product.brand, product.barcode,
    product.unit, product.purchasePrice, product.sellingPrice, product.stockQuantity,
    product.lowStockThreshold, product.warrantyPeriodMonths, product.description,
    product.hasVariants ? "true" : "false",
  ].map(csvEscape).join(","));
  return [header, ...rows].join("\r\n");
}

export async function importProductsForOwner(ownerId: string, csv: string) {
  if (Buffer.byteLength(csv, "utf8") > 2 * 1024 * 1024) {
    throw new ApiError(413, "CSV file cannot exceed 2 MB.", "CSV_TOO_LARGE");
  }

  const rows = parseCsv(csv);
  if (rows.length > 500) throw new ApiError(400, "Import is limited to 500 products per file.", "CSV_TOO_MANY_ROWS");

  const created: string[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  for (const { line, row } of rows) {
    try {
      if (!row.name) throw new ApiError(400, "Product name is required.", "CSV_NAME_REQUIRED");
      const result = await createProductForOwner(ownerId, {
        name: row.name,
        sku: row.sku || undefined,
        category: row.category || undefined,
        brand: row.brand || undefined,
        barcode: row.barcode || undefined,
        unit: row.unit || undefined,
        purchasePrice: numberField(row, "purchaseprice", line),
        sellingPrice: numberField(row, "sellingprice", line),
        stockQuantity: numberField(row, "stockquantity", line),
        lowStockThreshold: row.lowstockthreshold ? numberField(row, "lowstockthreshold", line) : 5,
        warrantyPeriodMonths: row.warrantyperiodmonths ? numberField(row, "warrantyperiodmonths", line, true) : 0,
        description: row.description || undefined,
      });
      created.push(result.product._id.toString());
    } catch (error) {
      errors.push({
        line,
        message: error instanceof Error ? error.message : "Unable to import this row.",
      });
    }
  }

  return { importedCount: created.length, failedCount: errors.length, createdProductIds: created, errors };
}

export async function getProductCatalogAnalyticsForOwner(ownerId: string) {
  const shop = await getShopForOwner(ownerId);
  return getCatalogAnalyticsByShopId(shop._id.toString());
}
