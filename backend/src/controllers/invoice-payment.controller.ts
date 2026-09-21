import type { Response } from "express";
import mongoose from "mongoose";

import {
  recordPaymentForOwner,
  getInvoicePaymentsForOwner,
} from "../services/invoice-payment.service";

import {
  recordInvoicePaymentSchema,
} from "../validators/invoice-payment.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

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

export async function recordInvoicePayment(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    recordInvoicePaymentSchema.parse(
      req.body,
    );

  const result =
    await recordPaymentForOwner(
      req.user.id,
      getInvoiceId(req),
      input,
    );

  res.status(201).json({
    success: true,

    message:
      result.invoice.status ===
      "paid"
        ? "Payment recorded. Invoice is now fully paid."
        : "Payment recorded successfully.",

    data: result,
  });
}

export async function getInvoicePayments(
  req: AuthenticatedRequest,
  res: Response,
) {
  const result =
    await getInvoicePaymentsForOwner(
      req.user.id,
      getInvoiceId(req),
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}