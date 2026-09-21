import {
  Types,
  type ClientSession,
} from "mongoose";

import { InvoiceModel } from "../models/invoice.model";
import {
  InvoicePaymentModel,
} from "../models/invoice-payment.model";

type PaymentMethod =
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "credit";

export async function findPaymentsByInvoiceId(
  invoiceId: string,
  shopId: string,
) {
  return InvoicePaymentModel.find({
    invoiceId:
      new Types.ObjectId(invoiceId),

    shopId:
      new Types.ObjectId(shopId),
  }).sort({
    paidAt: -1,
    createdAt: -1,
  });
}

export async function recordPaymentAtomically(
  {
    invoiceId,
    shopId,
    amount,
    paymentMethod,
    notes,
  }: {
    invoiceId: string;
    shopId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  },
  session: ClientSession,
) {
  const invoice =
    await InvoiceModel.findOneAndUpdate(
      {
        _id: invoiceId,
        shopId,
        status: {
          $in: [
            "draft",
            "partially_paid",
          ],
        },

        amountDue: {
          $gte: amount,
        },
      },
      {
        $inc: {
          amountPaid: amount,
          amountDue: -amount,
        },

        $set: {
          paymentMethod,
        },
      },
      {
        session,
        returnDocument: "after",
        runValidators: true,
      },
    );

  if (!invoice) {
    return null;
  }

  const roundedAmountPaid =
    Math.round(
      (invoice.amountPaid +
        Number.EPSILON) *
        100,
    ) / 100;

  const roundedAmountDue =
    Math.max(
      0,
      Math.round(
        (invoice.amountDue +
          Number.EPSILON) *
          100,
      ) / 100,
    );

  const finalStatus =
    roundedAmountDue === 0
      ? "paid"
      : "partially_paid";

  invoice.status =
    finalStatus;

  invoice.amountPaid =
    roundedAmountPaid;

  invoice.amountDue =
    roundedAmountDue;

  await invoice.save({
    session,
  });

  const [payment] =
    await InvoicePaymentModel.create(
      [
        {
          shopId:
            invoice.shopId,

          invoiceId:
            invoice._id,

          customerId:
            invoice.customerId,

          amount,

          paymentMethod,

          paidAt: new Date(),

          ...(notes?.trim() && {
            notes:
              notes.trim(),
          }),
        },
      ],
      {
        session,
      },
    );

  return {
    invoice,
    payment,
  };
}