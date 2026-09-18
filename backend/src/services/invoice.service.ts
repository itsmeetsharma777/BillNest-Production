import mongoose from "mongoose";

import {
  createInvoice,
  createInvoiceItems,
  findInvoiceByIdForShop,
  findInvoiceItems,
  findInvoiceItemsByInvoiceIds,
  findInvoicesByShopId,
  updateInvoiceByIdForShop,
} from "../repositories/invoice.repository";

import { getNextSequence } from "../repositories/counter.repository";

import {
  findCustomerByIdForShop,
  findCustomersByIdsForShop,
} from "../repositories/customer.repository";

import { getShopForOwner } from "./shop.service";

import {
  createNotificationForOwner,
} from "./notification.service";

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
  amountPaid?: number;
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
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function assertValidDate(
  value: Date | undefined,
  fieldName: string,
): void {
  if (
    value !== undefined &&
    Number.isNaN(value.getTime())
  ) {
    throw new ApiError(
      400,
      `${fieldName} must be a valid date.`,
      "INVALID_DATE",
    );
  }
}

function validateDueDate(
  issueDate: Date,
  dueDate: Date | undefined,
): void {
  assertValidDate(
    issueDate,
    "Invoice date",
  );

  assertValidDate(
    dueDate,
    "Due date",
  );

  if (
    dueDate !== undefined &&
    dueDate < issueDate
  ) {
    throw new ApiError(
      400,
      "Due date cannot be before invoice date.",
      "INVALID_DUE_DATE",
    );
  }
}

function calculateItemTotals(
  item: InvoiceItemInput,
) {
  const quantity = item.quantity;

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new ApiError(
      400,
      `Quantity for ${item.productName} must be greater than zero.`,
      "INVALID_QUANTITY",
    );
  }

  const unitPrice = roundMoney(
    item.unitPrice,
  );

  const discount = roundMoney(
    item.discount ?? 0,
  );

  const taxRate =
    item.taxRate ?? 0;

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    throw new ApiError(
      400,
      `Unit price for ${item.productName} is invalid.`,
      "INVALID_UNIT_PRICE",
    );
  }

  if (
    !Number.isFinite(discount) ||
    discount < 0
  ) {
    throw new ApiError(
      400,
      `Discount for ${item.productName} is invalid.`,
      "INVALID_DISCOUNT",
    );
  }

  if (
    !Number.isFinite(taxRate) ||
    taxRate < 0 ||
    taxRate > 100
  ) {
    throw new ApiError(
      400,
      `Tax rate for ${item.productName} must be between 0 and 100.`,
      "INVALID_TAX_RATE",
    );
  }

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

function generateInvoiceNumber(
  sequence: number,
): string {
  return `INV-${String(sequence).padStart(6, "0")}`;
}

function resolvePaymentState(
  total: number,
  requestedStatus:
    | InvoiceStatus
    | undefined,
  requestedAmountPaid:
    | number
    | undefined,
): {
  status: InvoiceStatus;
  amountPaid: number;
  amountDue: number;
} {
  if (
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new ApiError(
      400,
      "Invoice total is invalid.",
      "INVALID_INVOICE_TOTAL",
    );
  }

  const roundedTotal =
    roundMoney(total);

  if (
    requestedAmountPaid !== undefined
  ) {
    const amountPaid =
      roundMoney(
        requestedAmountPaid,
      );

    if (
      !Number.isFinite(amountPaid) ||
      amountPaid < 0
    ) {
      throw new ApiError(
        400,
        "Amount paid cannot be negative.",
        "INVALID_AMOUNT_PAID",
      );
    }

    if (amountPaid > roundedTotal) {
      throw new ApiError(
        400,
        "Amount paid cannot exceed invoice total.",
        "INVALID_AMOUNT_PAID",
      );
    }

    if (
      requestedStatus ===
      "cancelled"
    ) {
      return {
        status: "cancelled",
        amountPaid: 0,
        amountDue: roundedTotal,
      };
    }

    if (amountPaid === 0) {
      return {
        status: "draft",
        amountPaid: 0,
        amountDue: roundedTotal,
      };
    }

    if (
      amountPaid >= roundedTotal
    ) {
      return {
        status: "paid",
        amountPaid: roundedTotal,
        amountDue: 0,
      };
    }

    return {
      status: "partially_paid",
      amountPaid,
      amountDue: roundMoney(
        roundedTotal - amountPaid,
      ),
    };
  }

  if (
    requestedStatus === "paid"
  ) {
    return {
      status: "paid",
      amountPaid: roundedTotal,
      amountDue: 0,
    };
  }

  if (
    requestedStatus ===
    "partially_paid"
  ) {
    throw new ApiError(
      400,
      "Amount paid is required for a partially paid invoice.",
      "AMOUNT_PAID_REQUIRED",
    );
  }

  if (
    requestedStatus === "cancelled"
  ) {
    return {
      status: "cancelled",
      amountPaid: 0,
      amountDue: roundedTotal,
    };
  }

  return {
    status: "draft",
    amountPaid: 0,
    amountDue: roundedTotal,
  };
}

async function notifyInvoicePaid(
  ownerId: string,
  invoice: {
    _id: mongoose.Types.ObjectId;
    invoiceNumber: string;
    customerId: mongoose.Types.ObjectId;
    amountPaid: number;
    paymentMethod?:
      | PaymentMethod
      | null;
  },
  customerName?: string,
): Promise<void> {
  await createNotificationForOwner(
    ownerId,
    {
      type: "invoice_paid",
      title: "Invoice paid",
      message: customerName
        ? `Invoice ${invoice.invoiceNumber} from ${customerName} has been marked as paid.`
        : `Invoice ${invoice.invoiceNumber} has been marked as paid.`,
      link: `/shopkeeper/invoices/${invoice._id.toString()}`,
      metadata: {
        invoiceId:
          invoice._id.toString(),

        invoiceNumber:
          invoice.invoiceNumber,

        customerId:
          invoice.customerId.toString(),

        ...(customerName !==
          undefined && {
          customerName,
        }),

        amountPaid:
          invoice.amountPaid,

        paymentMethod:
          invoice.paymentMethod,
      },
    },
  );
}

export async function createInvoiceForOwner(
  ownerId: string,
  input: CreateInvoiceInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  const customer =
    await findCustomerByIdForShop(
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

  if (
    !input.items ||
    input.items.length === 0
  ) {
    throw new ApiError(
      400,
      "Invoice must contain at least one item.",
      "INVOICE_ITEMS_REQUIRED",
    );
  }

  const issueDate =
    input.invoiceDate ??
    new Date();

  validateDueDate(
    issueDate,
    input.dueDate,
  );

  const calculatedItems =
    input.items.map((item) => {
      const productName =
        item.productName.trim();

      if (!productName) {
        throw new ApiError(
          400,
          "Product name cannot be empty.",
          "INVALID_PRODUCT_NAME",
        );
      }

      const totals =
        calculateItemTotals({
          ...item,
          productName,
        });

      return {
        productName,

        ...(item.sku?.trim() && {
          sku: item.sku.trim(),
        }),

        ...totals,
      };
    });

  const subtotal = roundMoney(
    calculatedItems.reduce(
      (sum, item) =>
        sum + item.lineSubtotal,
      0,
    ),
  );

  const discount = roundMoney(
    calculatedItems.reduce(
      (sum, item) =>
        sum + item.discount,
      0,
    ),
  );

  const tax = roundMoney(
    calculatedItems.reduce(
      (sum, item) =>
        sum + item.lineTax,
      0,
    ),
  );

  const total = roundMoney(
    calculatedItems.reduce(
      (sum, item) =>
        sum + item.lineTotal,
      0,
    ),
  );

  const paymentState =
    resolvePaymentState(
      total,
      input.status,
      input.amountPaid,
    );

  const session =
    await mongoose.startSession();

  try {
    const transactionResult =
      await session.withTransaction(
        async () => {
          const sequence =
            await getNextSequence(
              shop._id.toString(),
              "invoice",
              session,
            );

          const invoiceNumber =
            generateInvoiceNumber(
              sequence,
            );

          const invoice =
            await createInvoice(
              {
                shopId:
                  shop._id.toString(),

                customerId:
                  customer._id.toString(),

                invoiceNumber,

                issueDate,

                ...(input.dueDate && {
                  dueDate:
                    input.dueDate,
                }),

                status:
                  paymentState.status,

                paymentMethod:
                  input.paymentMethod ??
                  "cash",

                subtotal,
                discount,
                tax,
                total,

                amountPaid:
                  paymentState.amountPaid,

                amountDue:
                  paymentState.amountDue,

                ...(input.notes?.trim() && {
                  notes:
                    input.notes.trim(),
                }),
              },
              session,
            );

          const items =
            await createInvoiceItems(
              calculatedItems.map(
                (item) => ({
                  invoiceId:
                    invoice._id.toString(),

                  productName:
                    item.productName,

                  ...(item.sku && {
                    sku: item.sku,
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
                }),
              ),
              session,
            );

          return {
            invoice,
            items,
          };
        },
      );

    if (!transactionResult) {
      throw new ApiError(
        500,
        "Invoice transaction failed.",
        "INVOICE_TRANSACTION_FAILED",
      );
    }

    const {
      invoice,
      items,
    } = transactionResult;

    await createNotificationForOwner(
      ownerId,
      {
        type: "invoice_created",
        title: "New invoice created",
        message: `Invoice ${invoice.invoiceNumber} was created for ${customer.name}.`,
        link: `/shopkeeper/invoices/${invoice._id.toString()}`,
        metadata: {
          invoiceId:
            invoice._id.toString(),

          invoiceNumber:
            invoice.invoiceNumber,

          customerId:
            customer._id.toString(),

          total: invoice.total,
          status: invoice.status,
        },
      },
    );

    if (
      invoice.status === "paid"
    ) {
      await notifyInvoicePaid(
        ownerId,
        invoice,
        customer.name,
      );
    }

    return {
      invoice,
      items,
    };
  } finally {
    await session.endSession();
  }
}

export async function getInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const invoice =
    await findInvoiceByIdForShop(
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

  const items =
    await findInvoiceItems(
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
  const shop =
    await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      options?.limit ?? 20,
      1,
    ),
    100,
  );

  const skip =
    (page - 1) * limit;

  const invoices =
    await findInvoicesByShopId(
      shop._id.toString(),
      {
        skip,

        /*
         * Fetch one extra invoice so we
         * can accurately determine whether
         * another page exists.
         */
        limit: limit + 1,

        ...(options?.status && {
          status: options.status,
        }),

        ...(options?.customerId && {
          customerId:
            options.customerId,
        }),
      },
    );

  const hasMore =
    invoices.length > limit;

  if (hasMore) {
    invoices.pop();
  }

  /*
   * Load product names and customer names
   * for the current page in two batch queries.
   * This avoids an N+1 query for invoices.
   */
  const invoiceIds =
    invoices.map((invoice) =>
      invoice._id.toString(),
    );

  const customerIds = [
    ...new Set(
      invoices.map((invoice) =>
        invoice.customerId.toString(),
      ),
    ),
  ];

  const [
    invoiceItems,
    customers,
  ] = await Promise.all([
    findInvoiceItemsByInvoiceIds(
      invoiceIds,
    ),
    findCustomersByIdsForShop(
      customerIds,
      shop._id.toString(),
    ),
  ]);

  const productNamesByInvoice =
    new Map<string, string[]>();

  for (const item of invoiceItems) {
    const invoiceId =
      item.invoiceId.toString();

    const existing =
      productNamesByInvoice.get(
        invoiceId,
      ) ?? [];

    if (item.productName) {
      existing.push(
        item.productName,
      );
    }

    productNamesByInvoice.set(
      invoiceId,
      existing,
    );
  }

  const customerNamesById =
    new Map<string, string>();

  for (const customer of customers) {
    customerNamesById.set(
      customer._id.toString(),
      customer.name,
    );
  }

  const invoicesWithDetails =
    invoices.map((invoice) => ({
      ...invoice.toObject(),

      customerName:
        customerNamesById.get(
          invoice.customerId.toString(),
        ) ?? "Customer",

      productNames:
        productNamesByInvoice.get(
          invoice._id.toString(),
        ) ?? [],
    }));

  return {
    invoices: invoicesWithDetails,

    pagination: {
      page,
      limit,
      hasMore,
    },
  };
}

export async function updateInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
  input: UpdateInvoiceInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  const invoice =
    await findInvoiceByIdForShop(
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

  if (
    invoice.status === "cancelled"
  ) {
    throw new ApiError(
      400,
      "Cancelled invoices cannot be modified.",
      "INVOICE_CANCELLED",
    );
  }

  if (
    input.status === "cancelled"
  ) {
    return cancelInvoiceForOwner(
      ownerId,
      invoiceId,
    );
  }

  if (
    input.dueDate !== undefined
  ) {
    validateDueDate(
      invoice.issueDate,
      input.dueDate,
    );
  }

  /*
   * If amountPaid is provided, the
   * server determines the resulting
   * payment state.
   */
  if (
    input.amountPaid !== undefined
  ) {
    const paymentState =
      resolvePaymentState(
        invoice.total,
        input.status,
        input.amountPaid,
      );

    const updatedInvoice =
      await updateInvoiceByIdForShop(
        invoiceId,
        shop._id.toString(),
        {
          ...(input.paymentMethod !==
            undefined && {
            paymentMethod:
              input.paymentMethod,
          }),

          status:
            paymentState.status,

          amountPaid:
            paymentState.amountPaid,

          amountDue:
            paymentState.amountDue,

          ...(input.dueDate !==
            undefined && {
            dueDate:
              input.dueDate,
          }),

          ...(input.notes !==
            undefined && {
            notes:
              input.notes.trim(),
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

    if (
      invoice.status !== "paid" &&
      updatedInvoice.status === "paid"
    ) {
      const customer =
        await findCustomerByIdForShop(
          invoice.customerId.toString(),
          shop._id.toString(),
        );

      await notifyInvoicePaid(
        ownerId,
        updatedInvoice,
        customer?.name,
      );
    }

    return updatedInvoice;
  }

  /*
   * Status-only update.
   */
  if (
    input.status !== undefined
  ) {
    let amountPaid =
      roundMoney(
        invoice.amountPaid,
      );

    let amountDue =
      roundMoney(
        invoice.amountDue,
      );

    const status =
      input.status;

    if (status === "paid") {
      amountPaid =
        roundMoney(invoice.total);

      amountDue = 0;
    } else if (
      status === "draft"
    ) {
      amountPaid = 0;

      amountDue =
        roundMoney(invoice.total);
    } else if (
      status === "partially_paid"
    ) {
      if (
        invoice.amountPaid <= 0 ||
        invoice.amountPaid >=
          invoice.total
      ) {
        throw new ApiError(
          400,
          "A partially paid invoice must have a payment amount between zero and the invoice total.",
          "INVALID_PARTIAL_PAYMENT",
        );
      }

      amountPaid =
        roundMoney(
          invoice.amountPaid,
        );

      amountDue =
        roundMoney(
          invoice.total -
            amountPaid,
        );
    }

    const updatedInvoice =
      await updateInvoiceByIdForShop(
        invoiceId,
        shop._id.toString(),
        {
          status,
          amountPaid,
          amountDue,

          ...(input.paymentMethod !==
            undefined && {
            paymentMethod:
              input.paymentMethod,
          }),

          ...(input.dueDate !==
            undefined && {
            dueDate:
              input.dueDate,
          }),

          ...(input.notes !==
            undefined && {
            notes:
              input.notes.trim(),
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

    if (
      invoice.status !== "paid" &&
      updatedInvoice.status === "paid"
    ) {
      const customer =
        await findCustomerByIdForShop(
          invoice.customerId.toString(),
          shop._id.toString(),
        );

      await notifyInvoicePaid(
        ownerId,
        updatedInvoice,
        customer?.name,
      );
    }

    return updatedInvoice;
  }

  /*
   * Non-payment update.
   */
  const updatedInvoice =
    await updateInvoiceByIdForShop(
      invoiceId,
      shop._id.toString(),
      {
        ...(input.paymentMethod !==
          undefined && {
          paymentMethod:
            input.paymentMethod,
        }),

        ...(input.dueDate !==
          undefined && {
          dueDate:
            input.dueDate,
        }),

        ...(input.notes !==
          undefined && {
          notes:
            input.notes.trim(),
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

  return updatedInvoice;
}

export async function markInvoiceAsPaidForOwner(
  ownerId: string,
  invoiceId: string,
  paymentMethod?: PaymentMethod,
) {
  const shop =
    await getShopForOwner(ownerId);

  const invoice =
    await findInvoiceByIdForShop(
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

  if (
    invoice.status === "cancelled"
  ) {
    throw new ApiError(
      400,
      "Cancelled invoices cannot be marked as paid.",
      "INVOICE_CANCELLED",
    );
  }

  const wasAlreadyPaid =
    invoice.status === "paid";

  const updatedInvoice =
    await updateInvoiceByIdForShop(
      invoiceId,
      shop._id.toString(),
      {
        status: "paid",

        amountPaid:
          roundMoney(invoice.total),

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
    const customer =
      await findCustomerByIdForShop(
        invoice.customerId.toString(),
        shop._id.toString(),
      );

    await notifyInvoicePaid(
      ownerId,
      updatedInvoice,
      customer?.name,
    );
  }

  return updatedInvoice;
}

export async function cancelInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

  const invoice =
    await findInvoiceByIdForShop(
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

  if (
    invoice.status === "cancelled"
  ) {
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

        amountPaid: 0,

        amountDue:
          roundMoney(invoice.total),
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