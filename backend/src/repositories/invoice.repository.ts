import {
  Types,
  type ClientSession,
} from "mongoose";

import { InvoiceModel } from "../models/invoice.model";
import { InvoiceItemModel } from "../models/invoice-item.model";
import { ProductModel } from "../models/product.model";
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
    filter.status = options.status;
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
 * Resolve a catalog product for an invoice item.
 *
 * The current frontend sends the selected
 * product's name and selling price, but does
 * not yet send productId.
 *
 * We therefore use an exact match on:
 *
 *   shopId
 *   product name
 *   selling price
 *   active status
 *
 * If there is no matching catalog product,
 * the item is treated as a manually entered
 * item/service and inventory is not changed.
 *
 * If multiple products have the exact same
 * name and selling price, we refuse to guess.
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
        name: item.productName.trim(),
        sellingPrice: item.unitPrice,
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
    /*
     * No catalog match.
     *
     * This is allowed because BillNest
     * supports manually entered invoice items
     * and services.
     */
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
 * Decrease catalog inventory for one invoice item.
 *
 * The update is intentionally atomic:
 *
 *   stockQuantity >= quantity
 *          ↓
 *   stockQuantity -= quantity
 *
 * This prevents two simultaneous invoices
 * from pushing inventory below zero.
 */
async function decrementCatalogProductStock(
  shopId: Types.ObjectId,
  productId: Types.ObjectId,
  productName: string,
  quantity: number,
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

  const updatedProduct =
    await ProductModel.findOneAndUpdate(
      {
        _id: productId,
        shopId,
        isActive: true,

        /*
         * Critical inventory protection.
         *
         * MongoDB will only perform the
         * decrement if enough stock exists.
         */
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
        returnDocument: "after",
      },
    );

  if (!updatedProduct) {
    /*
     * Determine whether the product exists
     * but simply doesn't have enough stock.
     */
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

  return updatedProduct;
}

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
  /*
   * Inventory changes must happen inside
   * the same MongoDB transaction as invoice
   * creation.
   *
   * The current invoice service already
   * passes a session here.
   */
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

  /*
   * Find the invoice so we can determine
   * which shop owns these items.
   */
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

  /*
   * Keep the original invoice item data,
   * but enrich catalog-backed items with
   * productId.
   */
  const invoiceItems = [];

  for (const item of items) {
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
      /*
       * We found the catalog product that
       * corresponds to the selected item.
       */
      productId =
        catalogProduct._id;

      /*
       * Use the catalog SKU as the
       * authoritative historical SKU when
       * available.
       */
      if (
        catalogProduct.sku
      ) {
        sku =
          catalogProduct.sku;
      }

      /*
       * Decrease stock BEFORE inserting
       * the invoice item.
       *
       * Both operations are inside the
       * same transaction, so if invoice item
       * creation fails, the stock decrement
       * is also rolled back.
       */
      await decrementCatalogProductStock(
        shopId,
        catalogProduct._id,
        catalogProduct.name,
        item.quantity,
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