import type { Response } from "express";

import {
  createWarrantyForOwner,
  getWarrantiesForOwner,
  getWarrantyForOwner,
  updateWarrantyForOwner,
  deactivateWarrantyForOwner,
  getExpiringWarrantiesForOwner,
} from "../services/warranty.service";

import {
  createWarrantySchema,
  updateWarrantySchema,
  warrantyListQuerySchema,
  expiringWarrantyQuerySchema,
} from "../validators/warranty.validator";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

function getWarrantyId(req: AuthenticatedRequest): string {
  const warrantyId = req.params.warrantyId;

  if (typeof warrantyId !== "string") {
    throw new Error("Invalid warranty ID.");
  }

  return warrantyId;
}

export async function createWarranty(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = createWarrantySchema.parse(req.body);

  const warranty = await createWarrantyForOwner(
    req.user.id,
    input,
  );

  res.status(201).json({
    success: true,
    message: "Warranty created successfully.",
    data: {
      warranty,
    },
  });
}

export async function getWarranties(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query = warrantyListQuerySchema.parse(req.query);

  const result = await getWarrantiesForOwner(
    req.user.id,
    {
      page: query.page,
      limit: query.limit,
      customerId: query.customerId,
      status: query.status,
    },
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getWarranty(
  req: AuthenticatedRequest,
  res: Response,
) {
  const warranty = await getWarrantyForOwner(
    req.user.id,
    getWarrantyId(req),
  );

  res.status(200).json({
    success: true,
    data: {
      warranty,
    },
  });
}

export async function updateWarranty(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = updateWarrantySchema.parse(req.body);

  const warranty = await updateWarrantyForOwner(
    req.user.id,
    getWarrantyId(req),
    input,
  );

  res.status(200).json({
    success: true,
    message: "Warranty updated successfully.",
    data: {
      warranty,
    },
  });
}

export async function deactivateWarranty(
  req: AuthenticatedRequest,
  res: Response,
) {
  const warranty = await deactivateWarrantyForOwner(
    req.user.id,
    getWarrantyId(req),
  );

  res.status(200).json({
    success: true,
    message: "Warranty deactivated successfully.",
    data: {
      warranty,
    },
  });
}

export async function getExpiringWarranties(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query = expiringWarrantyQuerySchema.parse(req.query);

  const warranties =
    await getExpiringWarrantiesForOwner(
      req.user.id,
      query.days,
    );

  res.status(200).json({
    success: true,
    data: {
      warranties,
    },
  });
}