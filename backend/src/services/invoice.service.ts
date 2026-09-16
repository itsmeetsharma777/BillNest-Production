import {
  createInvoice,
  createInvoiceItems,
  findInvoiceByIdForShop,
  findInvoiceItems,
  findInvoicesByShopId,
  updateInvoiceByIdForShop,
} from "../repositories/invoice.repository";
import { getNextSequence } from "../repositories/counter.repository";
import { findCustomerByIdForShop } from "../repositories/customer.repository";
import { getShopForOwner } from "./shop.service";
import { createNotificationForOwner } from "./notification.service";
import { ApiError } from "../utils/api-error";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

type PaymentMethod =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "credit";

interface InvoiceItemInput {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

interface CreateInvoiceInput {
  customerId: string;
  invoiceDate?: Date;
  dueDate?: Date;
  paymentMethod?: PaymentMethod;
  status?: InvoiceStatus;
  notes?: string;
  items: InvoiceItemInput[];
}

interface UpdateInvoiceInput {
  paymentMethod?: PaymentMethod;
  status?: InvoiceStatus;
  dueDate?: Date;
  amountPaid?: number;
  notes?: string;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateItemTotals(item: InvoiceItemInput) {
  const quantity = item.quantity;
  const unitPrice = roundMoney(item.unitPrice);
  const discount = roundMoney(item.discount ?? 0);
  const taxRate = item.taxRate ?? 0;

  const lineSubtotal = roundMoney(
    quantity * unitPrice,
  );

  if (discount > lineSubtotal) {
    throw new ApiError(
      400,
      `Discount cannot exceed the price of ${item.productName}.`,
      "INVALID_DISCOUNT",
    );
  }

  const taxableAmount = roundMoney(
    lineSubtotal - discount,
  );

  const lineTax = roundMoney(
    taxableAmount * (taxRate / 100),
  );

  const lineTotal = roundMoney(
    taxableAmount + lineTax,
  );

  return {
    quantity,
    unitPrice,
    discount,
    taxRate,
    lineSubtotal,
    lineTax,
    lineTotal,
  };
}

function generateInvoiceNumber(sequence: number): string {
  return `INV-${String(sequence).padStart(6, "0")}`;
}

export async function createInvoiceForOwner(
  ownerId: string,
  input: CreateInvoiceInput,
) {
  const shop = await getShopForOwner(ownerId);

  const customer = await findCustomerByIdForShop(
    input.customerId,
    shop._id.toString(),
  );

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  if (!customer.isActive) {
    throw new ApiError(
      400,
      "Cannot create an invoice for an inactive customer.",
      "CUSTOMER_INACTIVE",
    );
  }

  if (input.items.length === 0) {
    throw new ApiError(
      400,
      "Invoice must contain at least one item.",
      "INVOICE_ITEMS_REQUIRED",
    );
  }

  const calculatedItems = input.items.map((item) => {
    const totals = calculateItemTotals(item);

    return {
      productName: item.productName.trim(),
      ...(item.sku?.trim() && {
        sku: item.sku.trim(),
      }),
      ...totals,
    };
  });

  const subtotal = roundMoney(
    calculatedItems.reduce(
      (sum, item) => sum + item.lineSubtotal,
      0,
    ),
  );

  const discount = roundMoney(
    calculatedItems.reduce(
      (sum, item) => sum + item.discount,
      0,
    ),
  );

  const tax = roundMoney(
    calculatedItems.reduce(
      (sum, item) => sum + item.lineTax,
      0,
    ),
  );

  const total = roundMoney(
    calculatedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    ),
  );

  const amountPaid =
    input.status === "paid" ? total : 0;

  const amountDue = roundMoney(
    total - amountPaid,
  );

  const sequence = await getNextSequence(
    shop._id.toString(),
    "invoice",
  );

  const invoiceNumber =
    generateInvoiceNumber(sequence);

  const invoice = await createInvoice({
    shopId: shop._id.toString(),
    customerId: customer._id.toString(),
    invoiceNumber,
    issueDate: input.invoiceDate ?? new Date(),
    ...(input.dueDate && {
      dueDate: input.dueDate,
    }),
    status: input.status ?? "draft",
    paymentMethod: input.paymentMethod ?? "cash",
    subtotal,
    discount,
    tax,
    total,
    amountPaid,
    amountDue,
    ...(input.notes?.trim() && {
      notes: input.notes.trim(),
    }),
  });

  const items = await createInvoiceItems(
    calculatedItems.map((item) => ({
      invoiceId: invoice._id.toString(),
      productName: item.productName,
      ...(item.sku && {
        sku: item.sku,
      }),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      lineSubtotal: item.lineSubtotal,
      lineTax: item.lineTax,
      lineTotal: item.lineTotal,
    })),
  );

  /*
   * Create the real notification after the invoice
   * and invoice items have been successfully persisted.
   */
  await createNotificationForOwner(ownerId, {
    type: "invoice_created",
    title: "New invoice created",
    message: `Invoice ${invoice.invoiceNumber} was created for ${customer.name}.`,
    link: `/shopkeeper/invoices/${invoice._id.toString()}`,
    metadata: {
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      customerId: customer._id.toString(),
      total: invoice.total,
      status: invoice.status,
    },
  });

  /*
   * If an invoice is created directly as paid,
   * also create the payment notification.
   */
  if (invoice.status === "paid") {
    await createNotificationForOwner(ownerId, {
      type: "invoice_paid",
      title: "Invoice paid",
      message: `Invoice ${invoice.invoiceNumber} from ${customer.name} has been marked as paid.`,
      link: `/shopkeeper/invoices/${invoice._id.toString()}`,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        customerId: customer._id.toString(),
        amountPaid: invoice.amountPaid,
        paymentMethod: invoice.paymentMethod,
      },
    });
  }

  return {
    invoice,
    items,
  };
}

export async function getInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const invoice = await findInvoiceByIdForShop(
    invoiceId,
    shop._id.toString(),
  );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  const items = await findInvoiceItems(
    invoice._id.toString(),
  );

  return {
    invoice,
    items,
  };
}

export async function getInvoicesForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    customerId?: string;
  },
) {
  const shop = await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(options?.limit ?? 20, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const invoices = await findInvoicesByShopId(
    shop._id.toString(),
    {
      skip,
      limit,
      ...(options?.status && {
        status: options.status,
      }),
      ...(options?.customerId && {
        customerId: options.customerId,
      }),
    },
  );

  return {
    invoices,
    pagination: {
      page,
      limit,
      hasMore: invoices.length === limit,
    },
  };
}

export async function updateInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
  input: UpdateInvoiceInput,
) {
  const shop = await getShopForOwner(ownerId);

  const invoice = await findInvoiceByIdForShop(
    invoiceId,
    shop._id.toString(),
  );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  if (invoice.status === "cancelled") {
    throw new ApiError(
      400,
      "Cancelled invoices cannot be modified.",
      "INVOICE_CANCELLED",
    );
  }

  if (input.status === "cancelled") {
    return cancelInvoiceForOwner(
      ownerId,
      invoiceId,
    );
  }

  let amountPaid = invoice.amountPaid;

  if (input.amountPaid !== undefined) {
    if (input.amountPaid < 0) {
      throw new ApiError(
        400,
        "Amount paid cannot be negative.",
        "INVALID_AMOUNT_PAID",
      );
    }

    if (input.amountPaid > invoice.total) {
      throw new ApiError(
        400,
        "Amount paid cannot exceed invoice total.",
        "INVALID_AMOUNT_PAID",
      );
    }

    amountPaid = roundMoney(input.amountPaid);
  }

  let status = input.status;

  if (input.amountPaid !== undefined) {
    if (amountPaid === 0) {
      status = "draft";
    } else if (amountPaid >= invoice.total) {
      status = "paid";
    } else {
      status = "partially_paid";
    }
  }

  const amountDue = roundMoney(
    invoice.total - amountPaid,
  );

  const updatedInvoice =
    await updateInvoiceByIdForShop(
      invoiceId,
      shop._id.toString(),
      {
        ...(input.paymentMethod !== undefined && {
          paymentMethod: input.paymentMethod,
        }),
        ...(status !== undefined && {
          status,
        }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate,
        }),
        ...(input.amountPaid !== undefined && {
          amountPaid,
          amountDue,
        }),
        ...(input.notes !== undefined && {
          notes: input.notes.trim(),
        }),
      },
    );

  if (!updatedInvoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  /*
   * Only create an invoice_paid notification when
   * the invoice actually transitions into paid state.
   */
  if (
    invoice.status !== "paid" &&
    updatedInvoice.status === "paid"
  ) {
    const customer = await findCustomerByIdForShop(
      invoice.customerId.toString(),
      shop._id.toString(),
    );

    await createNotificationForOwner(ownerId, {
      type: "invoice_paid",
      title: "Invoice paid",
      message: `Invoice ${updatedInvoice.invoiceNumber} has been marked as paid.`,
      link: `/shopkeeper/invoices/${updatedInvoice._id.toString()}`,
      metadata: {
        invoiceId: updatedInvoice._id.toString(),
        invoiceNumber: updatedInvoice.invoiceNumber,
        customerId: updatedInvoice.customerId.toString(),
        customerName: customer?.name,
        amountPaid: updatedInvoice.amountPaid,
        paymentMethod: updatedInvoice.paymentMethod,
      },
    });
  }

  return updatedInvoice;
}

export async function markInvoiceAsPaidForOwner(
  ownerId: string,
  invoiceId: string,
  paymentMethod?: PaymentMethod,
) {
  const shop = await getShopForOwner(ownerId);

  const invoice = await findInvoiceByIdForShop(
    invoiceId,
    shop._id.toString(),
  );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  if (invoice.status === "cancelled") {
    throw new ApiError(
      400,
      "Cancelled invoices cannot be marked as paid.",
      "INVOICE_CANCELLED",
    );
  }

  /*
   * Don't create another payment notification if
   * the invoice was already fully paid.
   */
  const wasAlreadyPaid =
    invoice.status === "paid";

  const updatedInvoice =
    await updateInvoiceByIdForShop(
      invoiceId,
      shop._id.toString(),
      {
        status: "paid",
        amountPaid: roundMoney(invoice.total),
        amountDue: 0,
        ...(paymentMethod && {
          paymentMethod,
        }),
      },
    );

  if (!updatedInvoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  if (!wasAlreadyPaid) {
    const customer = await findCustomerByIdForShop(
      invoice.customerId.toString(),
      shop._id.toString(),
    );

    await createNotificationForOwner(ownerId, {
      type: "invoice_paid",
      title: "Invoice paid",
      message: `Invoice ${updatedInvoice.invoiceNumber} has been marked as paid.`,
      link: `/shopkeeper/invoices/${updatedInvoice._id.toString()}`,
      metadata: {
        invoiceId: updatedInvoice._id.toString(),
        invoiceNumber: updatedInvoice.invoiceNumber,
        customerId: updatedInvoice.customerId.toString(),
        customerName: customer?.name,
        amountPaid: updatedInvoice.amountPaid,
        paymentMethod: updatedInvoice.paymentMethod,
      },
    });
  }

  return updatedInvoice;
}

export async function cancelInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const invoice = await findInvoiceByIdForShop(
    invoiceId,
    shop._id.toString(),
  );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  if (invoice.status === "cancelled") {
    throw new ApiError(
      400,
      "Invoice is already cancelled.",
      "INVOICE_ALREADY_CANCELLED",
    );
  }

  const updatedInvoice =
    await updateInvoiceByIdForShop(
      invoiceId,
      shop._id.toString(),
      {
        status: "cancelled",
      },
    );

  if (!updatedInvoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  return updatedInvoice;
}