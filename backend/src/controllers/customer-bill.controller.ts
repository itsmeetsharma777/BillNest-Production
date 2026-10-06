import type { Request, Response } from "express";

import {
  createCustomerBillForUser,
  getCustomerBillsForUser,
  getCustomerBillForUser,
  updateCustomerBillForUser,
} from "../services/customer-bill.service";

import { ApiError } from "../utils/api-error";

interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;
  };
}

function getUserId(
  request: AuthenticatedRequest,
) {
  if (!request.user?.id) {
    throw new ApiError(
      401,
      "Authenticated user is missing.",
      "UNAUTHENTICATED",
    );
  }

  return request.user.id;
}

export async function uploadCustomerBill(
  request: AuthenticatedRequest,
  response: Response,
) {
  if (!request.file) {
    throw new ApiError(
      400,
      "Bill image is required.",
      "BILL_FILE_REQUIRED",
    );
  }

  const bill =
    await createCustomerBillForUser(
      getUserId(request),
      {
        buffer:
          request.file.buffer,
        mimeType:
          request.file.mimetype,
        originalName:
          request.file.originalname,
        sizeBytes:
          request.file.size,
      },
    );

  response.status(201).json({
    success: true,
    data: {
      bill,
    },
  });
}

export async function getCustomerBills(
  request: AuthenticatedRequest,
  response: Response,
) {
  const bills =
    await getCustomerBillsForUser(
      getUserId(request),
    );

  response.status(200).json({
    success: true,
    data: {
      bills,
    },
  });
}

export async function getCustomerBill(
  request: AuthenticatedRequest,
  response: Response,
) {
  const billId =
    typeof request.params.billId ===
    "string"
      ? request.params.billId
      : "";

  if (!billId) {
    throw new ApiError(
      400,
      "Bill ID is required.",
      "BILL_ID_REQUIRED",
    );
  }

  const bill =
    await getCustomerBillForUser(
      getUserId(request),
      billId,
    );

  response.status(200).json({
    success: true,
    data: {
      bill,
    },
  });
}


export async function updateCustomerBill(
  request: AuthenticatedRequest,
  response: Response,
) {
  const billId =
    typeof request.params.billId === "string"
      ? request.params.billId
      : "";

  if (!billId) {
    throw new ApiError(
      400,
      "Bill ID is required.",
      "BILL_ID_REQUIRED",
    );
  }

  const body =
    request.body &&
    typeof request.body === "object"
      ? request.body as {
          documentType?: string;
          extractedData?: Record<string, unknown>;
        }
      : {};

  const bill =
    await updateCustomerBillForUser(
      getUserId(request),
      billId,
      {
        documentType:
          typeof body.documentType === "string"
            ? body.documentType
            : undefined,
        extractedData:
          body.extractedData &&
          typeof body.extractedData === "object"
            ? body.extractedData
            : undefined,
      },
    );

  response.status(200).json({
    success: true,
    data: {
      bill,
    },
  });
}
