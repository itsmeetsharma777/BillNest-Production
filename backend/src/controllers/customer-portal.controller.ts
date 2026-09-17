import type { Request, Response } from "express";
import mongoose from "mongoose";

import {
  getCustomerDashboard,
  getCustomerInvoices,
  getCustomerInvoice,
  getCustomerWarranties,
  getCustomerWarranty,
} from "../services/customer-portal.service";

import { CustomerModel } from "../models/customer.model";
import { InvoiceModel } from "../models/invoice.model";
import { generateInvoicePdf } from "../services/invoice-pdf.service";

import { ApiError } from "../utils/api-error";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

function getUserId(
  request: AuthenticatedRequest,
): string {
  if (!request.user?.id) {
    throw new ApiError(
      401,
      "Authenticated user is missing.",
      "UNAUTHENTICATED",
    );
  }

  return request.user.id;
}

function getRouteParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new ApiError(
      400,
      `Missing route parameter: ${name}.`,
      "INVALID_ROUTE_PARAMETER",
    );
  }

  return value.trim();
}

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

export async function getDashboard(
  request: AuthenticatedRequest,
  response: Response,
) {
  const data =
    await getCustomerDashboard(
      getUserId(request),
    );

  response.status(200).json({
    success: true,
    data,
  });
}

export async function getInvoices(
  request: AuthenticatedRequest,
  response: Response,
) {
  const page = parsePositiveInteger(
    request.query.page,
    1,
    100000,
  );

  const limit = parsePositiveInteger(
    request.query.limit,
    20,
    100,
  );

  const status =
    typeof request.query.status ===
    "string"
      ? request.query.status
      : undefined;

  const validStatuses = [
    "draft",
    "paid",
    "partially_paid",
    "cancelled",
  ] as const;

  const invoiceStatus =
    status &&
    validStatuses.includes(
      status as (typeof validStatuses)[number],
    )
      ? (status as (typeof validStatuses)[number])
      : undefined;

  const data =
    await getCustomerInvoices(
      getUserId(request),
      {
        skip: (page - 1) * limit,
        limit,
        ...(invoiceStatus
          ? {
              status: invoiceStatus,
            }
          : {}),
      },
    );

  response.status(200).json({
    success: true,
    data,
  });
}

export async function getInvoice(
  request: AuthenticatedRequest,
  response: Response,
) {
  const invoiceId =
    getRouteParam(
      request.params.invoiceId,
      "invoiceId",
    );

  const data =
    await getCustomerInvoice(
      getUserId(request),
      invoiceId,
    );

  response.status(200).json({
    success: true,
    data,
  });
}

/**
 * Download an invoice PDF for the
 * authenticated customer.
 *
 * Security:
 * 1. Resolve the customer from the
 *    authenticated user.
 * 2. Find the requested invoice.
 * 3. Verify invoice.customerId matches
 *    the authenticated customer's profile.
 * 4. Generate the existing PDF using
 *    the invoice's shop.
 */
export async function downloadCustomerInvoicePdf(
  request: AuthenticatedRequest,
  response: Response,
) {
  const userId = getUserId(request);

  const invoiceId =
    getRouteParam(
      request.params.invoiceId,
      "invoiceId",
    );

  if (
    !mongoose.isValidObjectId(invoiceId)
  ) {
    throw new ApiError(
      400,
      "Invalid invoice ID.",
      "INVALID_INVOICE_ID",
    );
  }

  if (
    !mongoose.isValidObjectId(userId)
  ) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_USER_ID",
    );
  }

  const customer =
    await CustomerModel.findOne({
      userId: new mongoose.Types.ObjectId(
        userId,
      ),
      isActive: true,
    }).lean();

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  const invoice =
    await InvoiceModel.findOne({
      _id: new mongoose.Types.ObjectId(
        invoiceId,
      ),
      customerId: customer._id,
    }).lean();

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  const {
    document,
    invoiceNumber,
  } = await generateInvoicePdf(
    invoiceId,
    invoice.shopId.toString(),
  );

  const safeInvoiceNumber =
    invoiceNumber.replace(
      /[^a-zA-Z0-9-_]/g,
      "_",
    );

  const filename =
    `invoice-${safeInvoiceNumber}.pdf`;

  response.setHeader(
    "Content-Type",
    "application/pdf",
  );

  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  document.pipe(response);
  document.end();
}

export async function getWarranties(
  request: AuthenticatedRequest,
  response: Response,
) {
  const page = parsePositiveInteger(
    request.query.page,
    1,
    100000,
  );

  const limit = parsePositiveInteger(
    request.query.limit,
    20,
    100,
  );

  const status =
    typeof request.query.status ===
    "string"
      ? request.query.status
      : undefined;

  const validStatuses = [
    "active",
    "expiring_soon",
    "expired",
    "no_warranty",
  ] as const;

  const warrantyStatus =
    status &&
    validStatuses.includes(
      status as (typeof validStatuses)[number],
    )
      ? (status as (typeof validStatuses)[number])
      : undefined;

  const data =
    await getCustomerWarranties(
      getUserId(request),
      {
        skip: (page - 1) * limit,
        limit,
        ...(warrantyStatus
          ? {
              status: warrantyStatus,
            }
          : {}),
      },
    );

  response.status(200).json({
    success: true,
    data,
  });
}

export async function getWarranty(
  request: AuthenticatedRequest,
  response: Response,
) {
  const warrantyId =
    getRouteParam(
      request.params.warrantyId,
      "warrantyId",
    );

  const data =
    await getCustomerWarranty(
      getUserId(request),
      warrantyId,
    );

  response.status(200).json({
    success: true,
    data,
  });
}