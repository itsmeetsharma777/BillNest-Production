import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import {
  createInvoiceForOwner,
  getInvoiceForOwner,
  getInvoicesForOwner,
  updateInvoiceForOwner,
  markInvoiceAsPaidForOwner,
  cancelInvoiceForOwner,
} from "../services/invoice.service";

import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceListQuerySchema,
} from "../validators/invoice.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import { ApiError } from "../utils/api-error";

const markInvoicePaidSchema =
  z.object({
    paymentMethod: z
      .enum([
        "cash",
        "online",
        "cheque",
      ])
      .optional(),
  });

function getInvoiceId(
  req: AuthenticatedRequest,
): string {
  const invoiceId =
    req.params.invoiceId;

  if (
    typeof invoiceId !== "string" ||
    !mongoose.isValidObjectId(invoiceId)
  ) {
    throw new ApiError(
      400,
      "Invalid invoice ID.",
      "INVALID_INVOICE_ID",
    );
  }

  return invoiceId;
}

export async function createInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    createInvoiceSchema.parse(
      req.body,
    );

  const result =
    await createInvoiceForOwner(
      req.user.id,
      input,
    );

  res.status(201).json({
    success: true,
    message:
      "Invoice created successfully.",
    data: result,
  });
}

export async function getInvoices(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    invoiceListQuerySchema.parse(
      req.query,
    );

  const result =
    await getInvoicesForOwner(
      req.user.id,
      {
        page: query.page,
        limit: query.limit,
        status: query.status,
        customerId:
          query.customerId,
      },
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const result =
    await getInvoiceForOwner(
      req.user.id,
      getInvoiceId(req),
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function updateInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateInvoiceSchema.parse(
      req.body,
    );

  const invoice =
    await updateInvoiceForOwner(
      req.user.id,
      getInvoiceId(req),
      input,
    );

  res.status(200).json({
    success: true,
    message:
      "Invoice updated successfully.",
    data: {
      invoice,
    },
  });
}

export async function markInvoiceAsPaid(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    markInvoicePaidSchema.parse(
      req.body ?? {},
    );

  const invoice =
    await markInvoiceAsPaidForOwner(
      req.user.id,
      getInvoiceId(req),
      input.paymentMethod,
    );

  res.status(200).json({
    success: true,
    message:
      "Invoice marked as paid.",
    data: {
      invoice,
    },
  });
}

export async function cancelInvoice(
  req: AuthenticatedRequest,
  res: Response,
) {
  const invoice =
    await cancelInvoiceForOwner(
      req.user.id,
      getInvoiceId(req),
    );

  res.status(200).json({
    success: true,
    message:
      "Invoice cancelled successfully.",
    data: {
      invoice,
    },
  });
}