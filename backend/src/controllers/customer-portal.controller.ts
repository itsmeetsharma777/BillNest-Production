import type { Request, Response } from "express";

import {
  getCustomerDashboard,
  getCustomerInvoices,
  getCustomerInvoice,
  getCustomerWarranties,
  getCustomerWarranty,
} from "../services/customer-portal.service";

import { ApiError } from "../utils/api-error";

interface AuthenticatedRequest
  extends Request {
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

  return Math.min(
    parsed,
    maximum,
  );
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