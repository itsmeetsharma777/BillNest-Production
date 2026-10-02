import { Schema, model, type InferSchemaType } from "mongoose";

const productVariantSchema = new Schema(
  {
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    attributes: { type: Map, of: String, required: true },
    sku: { type: String, trim: true, maxlength: 100 },
    barcode: { type: String, trim: true, maxlength: 100 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    warrantyPeriodMonths: { type: Number, required: true, min: 0, max: 1200, default: 0 },
    imageUrl: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

productVariantSchema.index({ shopId: 1, productId: 1, isActive: 1 });
productVariantSchema.index({ shopId: 1, sku: 1 }, { unique: true, sparse: true, name: "product_variant_shop_sku_unique" });
productVariantSchema.index({ shopId: 1, barcode: 1 }, { unique: true, sparse: true, name: "product_variant_shop_barcode_unique" });
productVariantSchema.virtual("profitAmount").get(function () { return Math.round((this.sellingPrice - this.purchasePrice + Number.EPSILON) * 100) / 100; });
productVariantSchema.virtual("profitMarginPercent").get(function () { if (this.sellingPrice <= 0) return 0; return Math.round((((this.sellingPrice - this.purchasePrice) / this.sellingPrice) * 100 + Number.EPSILON) * 100) / 100; });
productVariantSchema.virtual("markupPercent").get(function () { if (this.purchasePrice <= 0) return 0; return Math.round((((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100 + Number.EPSILON) * 100) / 100; });
productVariantSchema.virtual("isLowStock").get(function () { return this.isActive && this.stockQuantity <= this.lowStockThreshold; });
productVariantSchema.set("toJSON", { virtuals: true });
productVariantSchema.set("toObject", { virtuals: true });

export type ProductVariant = InferSchemaType<typeof productVariantSchema>;
export const ProductVariantModel = model("ProductVariant", productVariantSchema);
