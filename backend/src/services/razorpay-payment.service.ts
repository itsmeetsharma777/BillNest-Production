import crypto from "node:crypto";

import mongoose from "mongoose";

import { env } from "../config/env";
import { InvoiceModel } from "../models/invoice.model";
import { InvoicePaymentModel } from "../models/invoice-payment.model";
import {
  findInvoiceByIdForShop,
} from "../repositories/invoice.repository";
import { getShopForOwner } from "./shop.service";
import { recordPaymentForOwner } from "./invoice-payment.service";
import { ApiError } from "../utils/api-error";

const RAZORPAY_API_URL =
  "https://api.razorpay.com/v1";

interface RazorpayOrderResponse {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
}

interface RazorpayPaymentResponse {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: string;
  order_id?: string | null;
  captured?: boolean;
}

function roundMoney(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function requireRazorpayConfig(): {
  keyId: string;
  keySecret: string;
} {
  if (
    !env.RAZORPAY_KEY_ID ||
    !env.RAZORPAY_KEY_SECRET
  ) {
    throw new ApiError(
      503,
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.",
      "RAZORPAY_NOT_CONFIGURED",
    );
  }

  return {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  };
}

function razorpayAuthHeader(
  keyId: string,
  keySecret: string,
): string {
  return `Basic ${Buffer.from(
    `${keyId}:${keySecret}`,
  ).toString("base64")}`;
}

async function razorpayRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const {
    keyId,
    keySecret,
  } = requireRazorpayConfig();

  const response = await fetch(
    `${RAZORPAY_API_URL}${path}`,
    {
      ...options,
      headers: {
        Authorization:
          razorpayAuthHeader(
            keyId,
            keySecret,
          ),
        "Content-Type":
          "application/json",
        ...(options.headers ?? {}),
      },
    },
  );

  const body =
    (await response.json().catch(
      () => null,
    )) as
      | (T & {
          error?: {
            description?: string;
          };
        })
      | null;

  if (!response.ok) {
    throw new ApiError(
      502,
      body?.error?.description ??
        "Razorpay request failed.",
      "RAZORPAY_API_ERROR",
    );
  }

  if (!body) {
    throw new ApiError(
      502,
      "Razorpay returned an empty response.",
      "RAZORPAY_EMPTY_RESPONSE",
    );
  }

  return body as T;
}

async function getInvoiceForOwner(
  ownerId: string,
  invoiceId: string,
) {
  if (
    !mongoose.isValidObjectId(
      invoiceId,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid invoice ID.",
      "INVALID_INVOICE_ID",
    );
  }

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

  return {
    shop,
    invoice,
  };
}

export async function createRazorpayOrderForOwner(
  ownerId: string,
  invoiceId: string,
  requestedAmount: number,
) {
  const {
    shop,
    invoice,
  } = await getInvoiceForOwner(
    ownerId,
    invoiceId,
  );

  if (
    invoice.status === "cancelled"
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
    roundMoney(requestedAmount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new ApiError(
      400,
      "Online payment amount must be greater than zero.",
      "INVALID_PAYMENT_AMOUNT",
    );
  }

  if (
    amount > invoice.amountDue
  ) {
    throw new ApiError(
      400,
      `Payment cannot exceed the remaining balance of ₹${invoice.amountDue.toFixed(2)}.`,
      "PAYMENT_EXCEEDS_BALANCE",
    );
  }

  const amountInPaise =
    Math.round(amount * 100);

  const order =
    await razorpayRequest<RazorpayOrderResponse>(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify({
          amount:
            amountInPaise,
          currency: "INR",
          receipt:
            invoice.invoiceNumber.slice(
              0,
              40,
            ),
          partial_payment: false,
          notes: {
            billnest_invoice_id:
              invoice._id.toString(),
            billnest_shop_id:
              shop._id.toString(),
          },
        }),
      },
    );

  await InvoiceModel.updateOne(
    {
      _id: invoice._id,
      shopId: shop._id,
    },
    {
      $set: {
        paymentMethod: "online",
        razorpayOrderId:
          order.id,
      },
    },
  );

  return {
    keyId:
      requireRazorpayConfig().keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    invoiceId:
      invoice._id.toString(),
    invoiceNumber:
      invoice.invoiceNumber,
  };
}

export async function verifyRazorpayPaymentForOwner(
  ownerId: string,
  invoiceId: string,
  input: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  },
) {
  const {
    invoice,
  } = await getInvoiceForOwner(
    ownerId,
    invoiceId,
  );

  const existingPayment =
    await InvoicePaymentModel.findOne({
      shopId: invoice.shopId,
      razorpayPaymentId:
        input.razorpayPaymentId,
    });

  if (existingPayment) {
    return {
      alreadyProcessed: true,
      invoiceId:
        invoice._id.toString(),
      paymentId:
        existingPayment._id.toString(),
    };
  }

  /*
   * IMPORTANT:
   * Never trust the order ID returned by the browser
   * for signature generation. Use the order ID stored
   * on the BillNest invoice.
   */
  const trustedOrderId =
    invoice.razorpayOrderId;

  if (
    !trustedOrderId ||
    trustedOrderId !==
      input.razorpayOrderId
  ) {
    throw new ApiError(
      400,
      "The Razorpay order does not belong to this invoice.",
      "RAZORPAY_ORDER_MISMATCH",
    );
  }

  const {
    keySecret,
  } =
    requireRazorpayConfig();

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        keySecret,
      )
      .update(
        `${trustedOrderId}|${input.razorpayPaymentId}`,
      )
      .digest("hex");

  const generatedSignatureBuffer =
    Buffer.from(
      generatedSignature,
      "utf8",
    );

  const providedSignatureBuffer =
    Buffer.from(
      input.razorpaySignature,
      "utf8",
    );

  const signaturesMatch =
    generatedSignatureBuffer.length ===
      providedSignatureBuffer.length &&
    crypto.timingSafeEqual(
      generatedSignatureBuffer,
      providedSignatureBuffer,
    );

  if (!signaturesMatch) {
    throw new ApiError(
      400,
      "Razorpay payment signature verification failed.",
      "RAZORPAY_SIGNATURE_INVALID",
    );
  }

  const payment =
    await razorpayRequest<RazorpayPaymentResponse>(
      `/payments/${encodeURIComponent(
        input.razorpayPaymentId,
      )}`,
      {
        method: "GET",
      },
    );

  if (
    payment.order_id !==
    trustedOrderId
  ) {
    throw new ApiError(
      400,
      "Razorpay payment is linked to a different order.",
      "RAZORPAY_PAYMENT_ORDER_MISMATCH",
    );
  }

  if (
    payment.currency !== "INR"
  ) {
    throw new ApiError(
      400,
      "Only INR Razorpay payments are supported.",
      "RAZORPAY_CURRENCY_INVALID",
    );
  }

  if (
    payment.status !== "captured" &&
    payment.captured !== true
  ) {
    throw new ApiError(
      400,
      "Razorpay payment has not been captured yet.",
      "RAZORPAY_PAYMENT_NOT_CAPTURED",
    );
  }

  const amount =
    roundMoney(
      payment.amount / 100,
    );

  if (
    amount <= 0 ||
    amount > invoice.amountDue
  ) {
    throw new ApiError(
      400,
      "The captured Razorpay amount is invalid for this invoice.",
      "RAZORPAY_AMOUNT_INVALID",
    );
  }

  const result =
    await recordPaymentForOwner(
      ownerId,
      invoiceId,
      {
        amount,
        paymentMethod:
          "online",
        referenceNumber:
          input.razorpayPaymentId,
        razorpayOrderId:
          trustedOrderId,
        razorpayPaymentId:
          input.razorpayPaymentId,
      },
    );

  await InvoiceModel.updateOne(
    {
      _id: invoice._id,
      shopId: invoice.shopId,
      razorpayOrderId:
        trustedOrderId,
    },
    {
      $unset: {
        razorpayOrderId: 1,
      },
    },
  );

  return {
    alreadyProcessed: false,
    invoice:
      result.invoice,
    payment:
      result.payment,
  };
}
