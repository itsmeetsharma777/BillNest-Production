import {
  Types,
  type ClientSession,
} from "mongoose";

import { InvoiceModel } from "../models/invoice.model";
import { InvoiceItemModel } from "../models/invoice-item.model";
import { ProductModel } from "../models/product.model";
import { ShopModel } from "../models/shop.model";
import {
  InventoryMovementModel,
} from "../models/inventory-movement.model";

import { ApiError } from "../utils/api-error";

export async function findInvoiceByIdForShop(
  invoiceId: string,
  shopId: string,
) {
  return InvoiceModel.findOne({
    _id: invoiceId,
    shopId,
  });
}

export async function findInvoicesByShopId(
  shopId: string,
  options?: {
    skip?: number;
    limit?: number;
    customerId?: string;
    status?:
      | "draft"
      | "paid"
      | "partially_paid"
      | "cancelled";
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter: {
    shopId: Types.ObjectId;
    customerId?: Types.ObjectId;
    status?:
      | "draft"
      | "paid"
      | "partially_paid"
      | "cancelled";
  } = {
    shopId: new Types.ObjectId(shopId),
  };

  if (options?.customerId) {
    filter.customerId =
      new Types.ObjectId(
        options.customerId,
      );
  }

  if (options?.status) {
    filter.status =
      options.status;
  }

  return InvoiceModel.find(filter)
    .sort({
      issueDate: -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);
}

export async function createInvoice(
  data: {
    shopId: string;
    customerId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date;
    status?:
      | "draft"
      | "paid"
      | "partially_paid"
      | "cancelled";
    paymentMethod?:
      | "cash"
      | "upi"
      | "card"
      | "bank_transfer"
      | "credit";
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    notes?: string;
  },
  session?: ClientSession,
) {
  const [invoice] =
    await InvoiceModel.create(
      [data],
      { session },
    );

  return invoice;
}

/**
 * ============================================================
 * RESOLVE CATALOG PRODUCT
 * ============================================================
 */
async function findCatalogProductForInvoiceItem(
  shopId: Types.ObjectId,
  item: {
    productName: string;
    unitPrice: number;
  },
  session: ClientSession,
) {
  const products =
    await ProductModel.find(
      {
        shopId,
        name:
          item.productName.trim(),
        sellingPrice:
          item.unitPrice,
        isActive: true,
      },
      {
        _id: 1,
        name: 1,
        sku: 1,
        stockQuantity: 1,
        isActive: 1,
      },
      {
        session,
      },
    ).limit(2);

  if (products.length === 0) {
    return null;
  }

  if (products.length > 1) {
    throw new ApiError(
      409,
      `Multiple active products named "${item.productName}" have the same selling price. Please edit the product catalog so the product can be identified uniquely.`,
      "PRODUCT_MATCH_AMBIGUOUS",
    );
  }

  return products[0];
}

/**
 * ============================================================
 * CREATE INVENTORY MOVEMENT
 * ============================================================
 *
 * This repository-level helper is used only from inside
 * trusted invoice transactions.
 */
async function createInvoiceInventoryMovement(
  shopId: Types.ObjectId,
  productId: Types.ObjectId,
  movementType:
    | "sale"
    | "sale_reversal",
  quantity: number,
  previousStock: number,
  newStock: number,
  referenceType:
    | "invoice"
    | "invoice_cancellation",
  referenceId: string,
  reason: string,
  session: ClientSession,
) {
  const shop =
    await ShopModel.findOne(
      {
        _id: shopId,
      },
      {
        ownerId: 1,
      },
      {
        session,
      },
    );

  if (!shop) {
    throw new ApiError(
      404,
      "Shop not found while recording inventory movement.",
      "SHOP_NOT_FOUND",
    );
  }

  const product =
    await ProductModel.findOne(
      {
        _id: productId,
        shopId,
      },
      {
        name: 1,
        sku: 1,
      },
      {
        session,
      },
    );

  if (!product) {
    throw new ApiError(
      404,
      "Product not found while recording inventory movement.",
      "PRODUCT_NOT_FOUND",
    );
  }

  const movement =
    new InventoryMovementModel({
      shopId,

      productId,

      productName:
        product.name,

      ...(product.sku && {
        sku:
          product.sku,
      }),

      movementType,

      quantity,

      previousStock,

      newStock,

      referenceType,

      referenceId,

      reason,

      createdBy:
        shop.ownerId,
    });

  return movement.save({
    session,
  });
}

/**
 * ============================================================
 * DECREASE CATALOG PRODUCT STOCK
 * ============================================================
 */
async function decrementCatalogProductStock(
  shopId: Types.ObjectId,
  productId: Types.ObjectId,
  productName: string,
  quantity: number,
  invoiceId: string,
  session: ClientSession,
) {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new ApiError(
      400,
      `Invalid quantity for ${productName}.`,
      "INVALID_PRODUCT_QUANTITY",
    );
  }

  /**
   * We need the stock BEFORE the update so the
   * movement ledger can accurately record:
   *
   * previousStock
   * newStock
   */
  const productBefore =
    await ProductModel.findOne(
      {
        _id: productId,
        shopId,
        isActive: true,
      },
      {
        stockQuantity: 1,
        name: 1,
        isActive: 1,
      },
      {
        session,
      },
    );

  if (!productBefore) {
    const product =
      await ProductModel.findOne(
        {
          _id: productId,
          shopId,
        },
        {
          stockQuantity: 1,
          isActive: 1,
          name: 1,
        },
        {
          session,
        },
      );

    if (!product) {
      throw new ApiError(
        404,
        `Product "${productName}" was not found in your shop.`,
        "PRODUCT_NOT_FOUND",
      );
    }

    if (!product.isActive) {
      throw new ApiError(
        400,
        `Product "${productName}" is inactive and cannot be sold.`,
        "PRODUCT_INACTIVE",
      );
    }

    throw new ApiError(
      400,
      `Insufficient stock for "${productName}". Available: ${product.stockQuantity}, requested: ${quantity}.`,
      "INSUFFICIENT_STOCK",
    );
  }

  if (
    productBefore.stockQuantity <
    quantity
  ) {
    throw new ApiError(
      400,
      `Insufficient stock for "${productName}". Available: ${productBefore.stockQuantity}, requested: ${quantity}.`,
      "INSUFFICIENT_STOCK",
    );
  }

  const previousStock =
    productBefore.stockQuantity;

  const newStock =
    previousStock - quantity;

  /**
   * Atomic stock update.
   *
   * The stock condition is repeated here so
   * concurrent invoice creation cannot make
   * inventory negative.
   */
  const updatedProduct =
    await ProductModel.findOneAndUpdate(
      {
        _id: productId,
        shopId,
        isActive: true,
        stockQuantity: {
          $gte: quantity,
        },
      },
      {
        $inc: {
          stockQuantity:
            -quantity,
        },
      },
      {
        session,
        returnDocument:
          "after",
      },
    );

  if (!updatedProduct) {
    throw new ApiError(
      400,
      `Insufficient stock for "${productName}".`,
      "INSUFFICIENT_STOCK",
    );
  }

  /**
   * ==========================================================
   * AUTOMATIC SALE MOVEMENT
   * ==========================================================
   */
  await createInvoiceInventoryMovement(
    shopId,
    productId,
    "sale",
    quantity,
    previousStock,
    newStock,
    "invoice",
    invoiceId,
    "Stock sold through invoice.",
    session,
  );

  return updatedProduct;
}

/**
 * ============================================================
 * RESTORE CATALOG PRODUCT STOCK
 * ============================================================
 *
 * Used when an invoice is cancelled.
 */
export async function restoreCatalogProductStock(
  shopId: Types.ObjectId,
  productId: Types.ObjectId,
  productName: string,
  quantity: number,
  invoiceId: string,
  session: ClientSession,
) {
  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new ApiError(
      400,
      `Invalid quantity while restoring stock for ${productName}.`,
      "INVALID_RESTORE_QUANTITY",
    );
  }

  const productBefore =
    await ProductModel.findOne(
      {
        _id: productId,
        shopId,
      },
      {
        stockQuantity: 1,
        name: 1,
        isActive: 1,
      },
      {
        session,
      },
    );

  if (!productBefore) {
    throw new ApiError(
      404,
      `Product "${productName}" could not be found while restoring stock.`,
      "PRODUCT_NOT_FOUND",
    );
  }

  const previousStock =
    productBefore.stockQuantity;

  const newStock =
    previousStock + quantity;

  const updatedProduct =
    await ProductModel.findOneAndUpdate(
      {
        _id: productId,
        shopId,
      },
      {
        $inc: {
          stockQuantity:
            quantity,
        },
      },
      {
        session,
        returnDocument:
          "after",
      },
    );

  if (!updatedProduct) {
    throw new ApiError(
      404,
      `Product "${productName}" could not be found while restoring stock.`,
      "PRODUCT_NOT_FOUND",
    );
  }

  /**
   * ==========================================================
   * AUTOMATIC SALE REVERSAL
   * ==========================================================
   */
  await createInvoiceInventoryMovement(
    shopId,
    productId,
    "sale_reversal",
    quantity,
    previousStock,
    newStock,
    "invoice_cancellation",
    invoiceId,
    "Stock restored because invoice was cancelled.",
    session,
  );

  return updatedProduct;
}

/**
 * ============================================================
 * CREATE INVOICE ITEMS
 * ============================================================
 */
export async function createInvoiceItems(
  items: Array<{
    invoiceId: string;
    productName: string;
    sku?: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    lineSubtotal: number;
    lineTax: number;
    lineTotal: number;
  }>,
  session?: ClientSession,
) {
  if (!session) {
    return InvoiceItemModel.insertMany(
      items,
      {
        session,
      },
    );
  }

  if (items.length === 0) {
    return [];
  }

  const invoice =
    await InvoiceModel.findById(
      items[0].invoiceId,
      {
        shopId: 1,
      },
      {
        session,
      },
    );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found while creating invoice items.",
      "INVOICE_NOT_FOUND",
    );
  }

  const shopId =
    invoice.shopId;

  const invoiceItems = [];

  for (
    const item of items
  ) {
    const catalogProduct =
      await findCatalogProductForInvoiceItem(
        shopId,
        {
          productName:
            item.productName,

          unitPrice:
            item.unitPrice,
        },
        session,
      );

    let productId:
      | Types.ObjectId
      | undefined;

    let sku =
      item.sku?.trim();

    if (catalogProduct) {
      productId =
        catalogProduct._id;

      if (
        catalogProduct.sku
      ) {
        sku =
          catalogProduct.sku;
      }

      await decrementCatalogProductStock(
        shopId,
        catalogProduct._id,
        catalogProduct.name,
        item.quantity,
        item.invoiceId,
        session,
      );
    }

    invoiceItems.push({
      invoiceId:
        item.invoiceId,

      ...(productId && {
        productId,
      }),

      productName:
        item.productName,

      ...(sku && {
        sku,
      }),

      ...(item.serialNumber && {
        serialNumber:
          item.serialNumber,
      }),

      quantity:
        item.quantity,

      unitPrice:
        item.unitPrice,

      discount:
        item.discount,

      taxRate:
        item.taxRate,

      lineSubtotal:
        item.lineSubtotal,

      lineTax:
        item.lineTax,

      lineTotal:
        item.lineTotal,
    });
  }

  return InvoiceItemModel.insertMany(
    invoiceItems,
    {
      session,
      ordered: true,
    },
  );
}

export async function findInvoiceItems(
  invoiceId: string,
) {
  return InvoiceItemModel.find({
    invoiceId,
  }).sort({
    createdAt: 1,
  });
}

export async function findInvoiceItemsForCancellation(
  invoiceId: string,
  session: ClientSession,
) {
  return InvoiceItemModel.find(
    {
      invoiceId,
    },
    {
      productId: 1,
      productName: 1,
      quantity: 1,
    },
    {
      session,
    },
  ).sort({
    createdAt: 1,
  });
}

export async function updateInvoiceByIdForShop(
  invoiceId: string,
  shopId: string,
  data: Partial<{
    status:
      | "draft"
      | "paid"
      | "partially_paid"
      | "cancelled";

    paymentMethod:
      | "cash"
      | "upi"
      | "card"
      | "bank_transfer"
      | "credit";

    dueDate: Date;

    amountPaid: number;

    amountDue: number;

    notes: string;
  }>,
) {
  return InvoiceModel.findOneAndUpdate(
    {
      _id: invoiceId,
      shopId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function updateInvoiceByIdForShopInTransaction(
  invoiceId: string,
  shopId: string,
  data: Partial<{
    status:
      | "draft"
      | "paid"
      | "partially_paid"
      | "cancelled";

    paymentMethod:
      | "cash"
      | "upi"
      | "card"
      | "bank_transfer"
      | "credit";

    dueDate: Date;

    amountPaid: number;

    amountDue: number;

    notes: string;
  }>,
  session: ClientSession,
) {
  return InvoiceModel.findOneAndUpdate(
    {
      _id: invoiceId,
      shopId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
}

export async function deleteInvoiceItems(
  invoiceId: string,
) {
  return InvoiceItemModel.deleteMany({
    invoiceId,
  });
}

export async function findInvoiceItemsByInvoiceIds(
  invoiceIds: string[],
) {
  if (invoiceIds.length === 0) {
    return [];
  }

  return InvoiceItemModel.find({
    invoiceId: {
      $in: invoiceIds,
    },
  })
    .select({
      invoiceId: 1,
      productId: 1,
      productName: 1,
      serialNumber: 1,
    })
    .sort({
      createdAt: 1,
    });
}