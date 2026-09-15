import type { Response } from "express";
import {
  createCustomerForOwner,
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
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

function getCustomerId(req: AuthenticatedRequest): string {
  const customerId = req.params.customerId;

  if (typeof customerId !== "string") {
    throw new Error("Invalid customer ID.");
  }

  return customerId;
}

export async function createCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = createCustomerSchema.parse(req.body);

  const customer = await createCustomerForOwner(
    req.user.id,
    input,
  );

  res.status(201).json({
    success: true,
    message: "Customer created successfully.",
    data: {
      customer,
    },
  });
}

export async function getCustomers(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query = customerListQuerySchema.parse(req.query);

  const result = await getCustomersForOwner(
    req.user.id,
    {
      page: query.page,
      limit: query.limit,
    },
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const customer = await getCustomerForOwner(
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

export async function updateCustomer(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = updateCustomerSchema.parse(req.body);

  const customer = await updateCustomerForOwner(
    req.user.id,
    getCustomerId(req),
    input,
  );

  res.status(200).json({
    success: true,
    message: "Customer updated successfully.",
    data: {
      customer,
    },
  });
}

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
    message: "Customer deactivated successfully.",
  });
}