import type { Response } from "express";

import mongoose from "mongoose";

import {
  createCustomerForOwner,
  getCustomerByPhoneForOwner,
  getCustomerForOwner,
  getCustomersForOwner,
  updateCustomerForOwner,
  deactivateCustomerForOwner,
} from "../services/customer.service";

import {
  createCustomerSchema,
  updateCustomerSchema,
  customerListQuerySchema,
} from "../validators/customer.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import { ApiError } from "../utils/api-error";

/*
 * =========================================================
 * CUSTOMER ID VALIDATION
 * =========================================================
 */

function getCustomerId(
  req: AuthenticatedRequest,
): string {
  const customerId =
    req.params.customerId;

  if (
    typeof customerId !==
      "string" ||
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

/*
 * =========================================================
 * CREATE CUSTOMER
 * =========================================================
 */

export async function createCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    createCustomerSchema.parse(
      req.body,
    );

  const customer =
    await createCustomerForOwner(
      req.user.id,
      input,
    );

  res.status(201).json({
    success: true,

    message:
      "Customer created or matched successfully.",

    data: {
      customer,
    },
  });
}

/*
 * =========================================================
 * LIST CUSTOMERS
 * =========================================================
 */

export async function getCustomers(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    customerListQuerySchema.parse(
      req.query,
    );

  const result =
    await getCustomersForOwner(
      req.user.id,
      {
        page:
          query.page,

        limit:
          query.limit,

        search:
          query.search,
      },
    );

  res.status(200).json({
    success: true,

    data: result,
  });
}

/*
 * =========================================================
 * GET CUSTOMER
 * =========================================================
 */

export async function getCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const customer =
    await getCustomerForOwner(
      req.user.id,
      getCustomerId(req),
    );

  res.status(200).json({
    success: true,

    data: {
      customer,
    },
  });
}

/*
 * =========================================================
 * FIND CUSTOMER BY PHONE
 * =========================================================
 */

export async function getCustomerByPhone(
  req: AuthenticatedRequest,
  res: Response,
) {
  const phone =
    req.query.phone;

  if (
    typeof phone !==
    "string"
  ) {
    throw new ApiError(
      400,
      "Phone number is required.",
      "PHONE_REQUIRED",
    );
  }

  const customer =
    await getCustomerByPhoneForOwner(
      req.user.id,
      phone,
    );

  res.status(200).json({
    success: true,

    data: {
      customer,
    },
  });
}

/*
 * =========================================================
 * UPDATE CUSTOMER
 * =========================================================
 */

export async function updateCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateCustomerSchema.parse(
      req.body,
    );

  const customer =
    await updateCustomerForOwner(
      req.user.id,
      getCustomerId(req),
      input,
    );

  res.status(200).json({
    success: true,

    message:
      "Customer updated successfully.",

    data: {
      customer,
    },
  });
}

/*
 * =========================================================
 * DELETE / DEACTIVATE CUSTOMER
 * =========================================================
 */

export async function deleteCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  await deactivateCustomerForOwner(
    req.user.id,
    getCustomerId(req),
  );

  res.status(200).json({
    success: true,

    message:
      "Customer deactivated successfully.",
  });
}