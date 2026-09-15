import { Types, type ClientSession } from "mongoose";
import { InvoiceModel } from "../models/invoice.model";
import { InvoiceItemModel } from "../models/invoice-item.model";

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
    status?: "draft" | "paid" | "partially_paid" | "cancelled";
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter: {
    shopId: Types.ObjectId;
    customerId?: Types.ObjectId;
    status?: "draft" | "paid" | "partially_paid" | "cancelled";
  } = {
    shopId: new Types.ObjectId(shopId),
  };

  if (options?.customerId) {
    filter.customerId = new Types.ObjectId(options.customerId);
  }

  if (options?.status) {
    filter.status = options.status;
  }

  return InvoiceModel.find(filter)
    .sort({ issueDate: -1 })
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
    status?: "draft" | "paid" | "partially_paid" | "cancelled";
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
  const [invoice] = await InvoiceModel.create(
    [data],
    { session },
  );

  return invoice;
}

export async function createInvoiceItems(
  items: Array<{
    invoiceId: string;
    productName: string;
    sku?: string;
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
  return InvoiceItemModel.insertMany(items, {
    session,
  });
}

export async function findInvoiceItems(invoiceId: string) {
  return InvoiceItemModel.find({ invoiceId })
    .sort({ createdAt: 1 });
}

export async function updateInvoiceByIdForShop(
  invoiceId: string,
  shopId: string,
  data: Partial<{
    status: "draft" | "paid" | "partially_paid" | "cancelled";
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

export async function deleteInvoiceItems(invoiceId: string) {
  return InvoiceItemModel.deleteMany({
    invoiceId,
  });
}