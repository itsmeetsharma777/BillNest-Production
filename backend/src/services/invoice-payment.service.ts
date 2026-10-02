import mongoose from "mongoose";

import {
  findInvoiceByIdForShop,
} from "../repositories/invoice.repository";

import {
  findPaymentsByInvoiceId,
  recordPaymentAtomically,
} from "../repositories/invoice-payment.repository";

import {
  findCustomerById,
} from "../repositories/customer.repository";

import { getShopForOwner } from "./shop.service";

import {
  createNotificationForOwner,
} from "./notification.service";

import { ApiError } from "../utils/api-error";

type PaymentMethod =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "credit";

interface RecordPaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

export async function recordPaymentForOwner(
  ownerId: string,
  invoiceId: string,
  input: RecordPaymentInput,
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
    invoice.status ===
    "cancelled"
  ) {
    throw new ApiError(
      400,
      "Cancelled invoices cannot receive payments.",
      "INVOICE_CANCELLED",
    );
  }

  if (
    invoice.status === "paid" ||
    invoice.amountDue <= 0
  ) {
    throw new ApiError(
      400,
      "This invoice is already fully paid.",
      "INVOICE_ALREADY_PAID",
    );
  }

  const amount =
    roundMoney(input.amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new ApiError(
      400,
      "Payment amount must be greater than zero.",
      "INVALID_PAYMENT_AMOUNT",
    );
  }

  if (
    amount > invoice.amountDue
  ) {
    throw new ApiError(
      400,
      `Payment cannot exceed the remaining balance of ₹${roundMoney(invoice.amountDue).toFixed(2)}.`,
      "PAYMENT_EXCEEDS_BALANCE",
    );
  }

  const session =
    await mongoose.startSession();

  try {
    const result =
      await session.withTransaction(
        async () => {
          const paymentResult =
            await recordPaymentAtomically(
              {
                invoiceId,
                shopId:
                  shop._id.toString(),
                amount,
                paymentMethod:
                  input.paymentMethod,
                notes: input.notes,
              },
              session,
            );

          if (!paymentResult) {
            throw new ApiError(
              409,
              "The invoice balance changed before the payment could be recorded. Please refresh and try again.",
              "PAYMENT_BALANCE_CHANGED",
            );
          }

          return paymentResult;
        },
      );

    if (!result) {
      throw new ApiError(
        500,
        "Unable to record payment.",
        "PAYMENT_TRANSACTION_FAILED",
      );
    }

    const customer =
      await findCustomerById(invoice.customerId.toString());

    if (
      result.invoice.status ===
      "paid"
    ) {
      await createNotificationForOwner(
        ownerId,
        {
          type: "invoice_paid",
          title: "Invoice paid",
          message: customer?.name
            ? `Invoice ${invoice.invoiceNumber} from ${customer.name} has been fully paid.`
            : `Invoice ${invoice.invoiceNumber} has been fully paid.`,
          link: `/shopkeeper/invoices/${invoice._id.toString()}`,
          metadata: {
            invoiceId:
              invoice._id.toString(),

            invoiceNumber:
              invoice.invoiceNumber,

            customerId:
              invoice.customerId.toString(),

            amountPaid:
              result.invoice.amountPaid,

            paymentMethod:
              result.invoice.paymentMethod,
          },
        },
      );
    } else {
      await createNotificationForOwner(
        ownerId,
        {
          type: "invoice_created",
          title: "Payment received",
          message: customer?.name
            ? `₹${amount.toFixed(2)} received from ${customer.name} for invoice ${invoice.invoiceNumber}.`
            : `₹${amount.toFixed(2)} payment received for invoice ${invoice.invoiceNumber}.`,
          link: `/shopkeeper/invoices/${invoice._id.toString()}`,
          metadata: {
            invoiceId:
              invoice._id.toString(),

            invoiceNumber:
              invoice.invoiceNumber,

            customerId:
              invoice.customerId.toString(),

            paymentAmount:
              amount,

            amountDue:
              result.invoice.amountDue,
          },
        },
      );
    }

    return result;
  } finally {
    await session.endSession();
  }
}

export async function getInvoicePaymentsForOwner(
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

  const payments =
    await findPaymentsByInvoiceId(
      invoiceId,
      shop._id.toString(),
    );

  const additionalPaymentsTotal =
    roundMoney(
      payments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0,
      ),
    );

  /*
   * Older invoices may already have an
   * amountPaid value but no payment-history
   * documents. Represent the original
   * payment as an initial payment so the
   * customer does not lose historical data.
   */
  const initialPaymentAmount =
    roundMoney(
      Math.max(
        0,
        invoice.amountPaid -
          additionalPaymentsTotal,
      ),
    );

  const history = payments.map(
    (payment) => ({
      id:
        payment._id.toString(),

      amount:
        payment.amount,

      paymentMethod:
        payment.paymentMethod,

      paidAt:
        payment.paidAt,

      notes:
        payment.notes,
    }),
  );

  if (
    initialPaymentAmount > 0
  ) {
    history.push({
      id: `initial-${invoice._id.toString()}`,

      amount:
        initialPaymentAmount,

      paymentMethod:
        invoice.paymentMethod ??
        "cash",

      paidAt:
        invoice.createdAt ??
        invoice.issueDate,

      notes:
        "Initial payment recorded when the invoice was created.",
    });
  }

  history.sort(
    (a, b) =>
      new Date(b.paidAt).getTime() -
      new Date(a.paidAt).getTime(),
  );

  return {
    invoice: {
      id:
        invoice._id.toString(),

      invoiceNumber:
        invoice.invoiceNumber,

      total:
        invoice.total,

      amountPaid:
        invoice.amountPaid,

      amountDue:
        invoice.amountDue,

      status:
        invoice.status,
    },

    payments: history,
  };
}