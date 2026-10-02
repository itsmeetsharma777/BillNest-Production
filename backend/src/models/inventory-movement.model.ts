import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

const inventoryMovementSchema =
  new Schema(
    {
      /*
       * ============================================================
       * SHOP
       * ============================================================
       *
       * Every inventory movement belongs to exactly one shop.
       *
       * This is the primary tenant-isolation field.
       */
      shopId: {
        type: Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
      },

      /*
       * ============================================================
       * PRODUCT
       * ============================================================
       *
       * The product whose stock changed.
       */
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true,
      },

      variantId: {
        type: Schema.Types.ObjectId,
        ref: "ProductVariant",
        index: true,
      },

      /*
       * ============================================================
       * PRODUCT SNAPSHOT
       * ============================================================
       *
       * Keep historical information even if the Product document
       * is renamed or its SKU changes later.
       */
      productName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200,
      },

      sku: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      /*
       * ============================================================
       * MOVEMENT TYPE
       * ============================================================
       *
       * Quantity is always stored as a positive number.
       *
       * The movement type determines whether it represents
       * stock entering or leaving the inventory.
       */
      movementType: {
        type: String,
        enum: [
          "initial_stock",
          "purchase",
          "sale",
          "sale_reversal",
          "adjustment_in",
          "adjustment_out",
          "correction",
        ],
        required: true,
        index: true,
      },

      /*
       * ============================================================
       * QUANTITY
       * ============================================================
       *
       * Always positive.
       *
       * Example:
       *
       * sale           -> quantity 2
       * sale_reversal  -> quantity 2
       * adjustment_in  -> quantity 5
       * adjustment_out -> quantity 3
       */
      quantity: {
        type: Number,
        required: true,
        min: 0.001,
      },

      /*
       * ============================================================
       * STOCK SNAPSHOT
       * ============================================================
       *
       * These fields make the audit history easy to understand.
       *
       * Example:
       *
       * previousStock = 10
       * quantity      = 3
       * newStock      = 7
       */
      previousStock: {
        type: Number,
        required: true,
        min: 0,
      },

      newStock: {
        type: Number,
        required: true,
        min: 0,
      },

      /*
       * ============================================================
       * REFERENCE
       * ============================================================
       *
       * Links the movement to the operation that caused it.
       *
       * Examples:
       *
       * invoice
       * invoice_cancellation
       * product_creation
       * stock_adjustment
       * manual_correction
       */
      referenceType: {
        type: String,
        enum: [
          "invoice",
          "invoice_cancellation",
          "product_creation",
          "stock_adjustment",
          "manual_correction",
        ],
      },

      referenceId: {
        type: Schema.Types.ObjectId,
        index: true,
      },

      /*
       * ============================================================
       * REASON
       * ============================================================
       *
       * Human-readable explanation for manual movements.
       */
      reason: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      /*
       * ============================================================
       * CREATED BY
       * ============================================================
       *
       * The authenticated user responsible for the movement.
       */
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    },
    {
      timestamps: true,
    },
  );

/*
 * ================================================================
 * INDEXES
 * ================================================================
 */

/*
 * Product history:
 *
 * "Show me all inventory movements for this product."
 */
inventoryMovementSchema.index({
  shopId: 1,
  productId: 1,
  variantId: 1,
  createdAt: -1,
});

/*
 * Shop-wide inventory history:
 *
 * "Show me the latest inventory movements for my shop."
 */
inventoryMovementSchema.index({
  shopId: 1,
  createdAt: -1,
});

/*
 * Movement-type filtering:
 *
 * "Show me all sales / adjustments / reversals."
 */
inventoryMovementSchema.index({
  shopId: 1,
  movementType: 1,
  createdAt: -1,
});

/*
 * Reference lookup:
 *
 * "Show me the inventory movements caused by this invoice."
 */
inventoryMovementSchema.index({
  shopId: 1,
  referenceType: 1,
  referenceId: 1,
});

export type InventoryMovement =
  InferSchemaType<
    typeof inventoryMovementSchema
  >;

export const InventoryMovementModel =
  model(
    "InventoryMovement",
    inventoryMovementSchema,
  );