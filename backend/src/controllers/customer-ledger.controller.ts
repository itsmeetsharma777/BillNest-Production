import type { Response } from "express";
import mongoose from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
  getCustomerLedgerForOwner,
  getCustomerOwnLedger,
} from "../services/customer-ledger.service";

import { ApiError } from "../utils/api-error";

function getCustomerId(
  req: AuthenticatedRequest,
): string {
  const customerId =
    req.params.customerId;

  if (
    typeof customerId !== "string" ||
    !mongoose.isValidObjectId(
      customerId,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid customer ID.",
      "INVALID_CUSTOMER_ID",
    );
  }

  return customerId;
}

export async function getCustomerLedger(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data =
    await getCustomerLedgerForOwner(
      req.user.id,
      getCustomerId(req),
    );

  res.status(200).json({
    success: true,
    data,
  });
}

export async function getOwnCustomerLedger(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data =
    await getCustomerOwnLedger(
      req.user.id,
    );

  res.status(200).json({
    success: true,
    data,
  });
}