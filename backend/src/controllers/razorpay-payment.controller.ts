import type { Response } from "express";
import mongoose from "mongoose";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  createRazorpayOrderForOwner,
  verifyRazorpayPaymentForOwner,
} from "../services/razorpay-payment.service";

import { ApiError } from "../utils/api-error";

function getInvoiceId(
  req: AuthenticatedRequest,
): string {
  const invoiceId =
    req.params.invoiceId;

  if (
    typeof invoiceId !== "string" ||
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

  return invoiceId;
}

export async function createRazorpayOrder(
  req: AuthenticatedRequest,
  res: Response,
) {
  const amount =
    Number(req.body?.amount);

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

  const result =
    await createRazorpayOrderForOwner(
      req.user.id,
      getInvoiceId(req),
      amount,
    );

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function verifyRazorpayPayment(
  req: AuthenticatedRequest,
  res: Response,
) {
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = req.body ?? {};

  if (
    typeof razorpayPaymentId !==
      "string" ||
    typeof razorpayOrderId !==
      "string" ||
    typeof razorpaySignature !==
      "string" ||
    !razorpayPaymentId.trim() ||
    !razorpayOrderId.trim() ||
    !razorpaySignature.trim()
  ) {
    throw new ApiError(
      400,
      "Razorpay payment verification data is incomplete.",
      "RAZORPAY_VERIFICATION_DATA_INVALID",
    );
  }

  const result =
    await verifyRazorpayPaymentForOwner(
      req.user.id,
      getInvoiceId(req),
      {
        razorpayPaymentId:
          razorpayPaymentId.trim(),
        razorpayOrderId:
          razorpayOrderId.trim(),
        razorpaySignature:
          razorpaySignature.trim(),
      },
    );

  res.status(200).json({
    success: true,
    message:
      result.alreadyProcessed
        ? "Razorpay payment was already processed."
        : "Razorpay payment verified and recorded successfully.",
    data: result,
  });
}
