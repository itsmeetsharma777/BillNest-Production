import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
  getCustomerAccount,
  updateCustomerAccount,
} from "../services/customer-account.service";

import {
  updateCustomerAccountSchema,
} from "../validators/customer-account.validator";

function getUserId(
  req: AuthenticatedRequest,
) {
  if (!req.user?.id) {
    throw new Error(
      "Authenticated user is missing.",
    );
  }

  return req.user.id;
}

export async function getAccount(
  req: AuthenticatedRequest,
  res: Response,
) {
  const account =
    await getCustomerAccount(
      getUserId(req),
    );

  res.status(200).json({
    success: true,
    data: account,
  });
}

export async function updateAccount(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateCustomerAccountSchema.parse(
      req.body,
    );

  const account =
    await updateCustomerAccount(
      getUserId(req),
      input,
    );

  res.status(200).json({
    success: true,
    message:
      "Account settings updated successfully.",
    data: account,
  });
}
