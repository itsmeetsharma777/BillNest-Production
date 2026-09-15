import {
  createWarranty,
  findWarrantyByIdForShop,
  findWarrantiesByShopId,
  findWarrantiesExpiringSoon,
  updateWarrantyByIdForShop,
} from "../repositories/warranty.repository";

import { findCustomerByIdForShop } from "../repositories/customer.repository";

import { findInvoiceByIdForShop } from "../repositories/invoice.repository";

import { getShopForOwner } from "./shop.service";

import { ApiError } from "../utils/api-error";

type WarrantyStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "no_warranty";

interface CreateWarrantyInput {
  customerId: string;
  invoiceId?: string;
  invoiceItemId?: string;
  productName: string;
  serialNumber?: string;
  warrantyPeriodMonths: number;
  startDate: Date;
  terms?: string;
  notes?: string;
}

interface UpdateWarrantyInput {
  productName?: string;
  serialNumber?: string;
  warrantyPeriodMonths?: number;
  startDate?: Date;
  terms?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Calculate warranty expiry date from start date
 * and warranty duration in months.
 */
export function calculateWarrantyExpiryDate(
  startDate: Date,
  warrantyPeriodMonths: number,
): Date {
  const expiryDate = new Date(startDate);

  expiryDate.setMonth(
    expiryDate.getMonth() + warrantyPeriodMonths,
  );

  return expiryDate;
}

/**
 * Determine the current warranty status.
 *
 * Rules:
 * - Expired: expiry date has passed
 * - Expiring soon: expires within 30 days
 * - Active: more than 30 days remaining
 */
export function getWarrantyStatus(
  expiryDate: Date,
  now = new Date(),
): WarrantyStatus {
  if (expiryDate <= now) {
    return "expired";
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const daysRemaining =
    (expiryDate.getTime() - now.getTime()) /
    millisecondsPerDay;

  if (daysRemaining <= 30) {
    return "expiring_soon";
  }

  return "active";
}

/**
 * Create a warranty for a shop owner.
 */
export async function createWarrantyForOwner(
  ownerId: string,
  input: CreateWarrantyInput,
) {
  const shop = await getShopForOwner(ownerId);

  const customer = await findCustomerByIdForShop(
    input.customerId,
    shop._id.toString(),
  );

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  if (input.warrantyPeriodMonths < 0) {
    throw new ApiError(
      400,
      "Warranty period cannot be negative.",
      "INVALID_WARRANTY_PERIOD",
    );
  }

  if (
    Number.isNaN(input.startDate.getTime())
  ) {
    throw new ApiError(
      400,
      "Invalid warranty start date.",
      "INVALID_START_DATE",
    );
  }

  /**
   * If an invoice is supplied, make sure:
   * 1. It exists.
   * 2. It belongs to the same shop.
   * 3. It belongs to the selected customer.
   */
  if (input.invoiceId) {
    const invoice = await findInvoiceByIdForShop(
      input.invoiceId,
      shop._id.toString(),
    );

    if (!invoice) {
      throw new ApiError(
        404,
        "Invoice not found.",
        "INVOICE_NOT_FOUND",
      );
    }

    if (
      invoice.customerId.toString() !==
      customer._id.toString()
    ) {
      throw new ApiError(
        400,
        "Invoice does not belong to this customer.",
        "CUSTOMER_INVOICE_MISMATCH",
      );
    }
  }

  const expiryDate =
    calculateWarrantyExpiryDate(
      input.startDate,
      input.warrantyPeriodMonths,
    );

  const status: WarrantyStatus =
    input.warrantyPeriodMonths === 0
      ? "no_warranty"
      : getWarrantyStatus(expiryDate);

  return createWarranty({
    shopId: shop._id.toString(),
    customerId: customer._id.toString(),

    ...(input.invoiceId && {
      invoiceId: input.invoiceId,
    }),

    ...(input.invoiceItemId && {
      invoiceItemId: input.invoiceItemId,
    }),

    productName: input.productName,

    ...(input.serialNumber && {
      serialNumber: input.serialNumber,
    }),

    warrantyPeriodMonths:
      input.warrantyPeriodMonths,

    startDate: input.startDate,
    expiryDate,
    status,

    ...(input.terms && {
      terms: input.terms,
    }),

    ...(input.notes && {
      notes: input.notes,
    }),
  });
}

/**
 * Get warranties belonging to the owner's shop.
 */
export async function getWarrantiesForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: WarrantyStatus;
  },
) {
  const shop = await getShopForOwner(ownerId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(
      options?.limit ?? 20,
      1,
    ),
    100,
  );

  const skip = (page - 1) * limit;

  const warranties =
    await findWarrantiesByShopId(
      shop._id.toString(),
      {
        skip,
        limit,
        customerId: options?.customerId,
        status: options?.status,
      },
    );

  return {
    warranties,
    pagination: {
      page,
      limit,
      hasMore: warranties.length === limit,
    },
  };
}

/**
 * Get one warranty belonging to the owner's shop.
 */
export async function getWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const warranty =
    await findWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
    );

  if (!warranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  return warranty;
}

/**
 * Update a warranty belonging to the owner's shop.
 */
export async function updateWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
  input: UpdateWarrantyInput,
) {
  const shop = await getShopForOwner(ownerId);

  const existingWarranty =
    await findWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
    );

  if (!existingWarranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  if (
    input.warrantyPeriodMonths !== undefined &&
    input.warrantyPeriodMonths < 0
  ) {
    throw new ApiError(
      400,
      "Warranty period cannot be negative.",
      "INVALID_WARRANTY_PERIOD",
    );
  }

  if (
    input.startDate &&
    Number.isNaN(
      input.startDate.getTime(),
    )
  ) {
    throw new ApiError(
      400,
      "Invalid warranty start date.",
      "INVALID_START_DATE",
    );
  }

  const startDate =
    input.startDate ??
    existingWarranty.startDate;

  const warrantyPeriodMonths =
    input.warrantyPeriodMonths ??
    existingWarranty.warrantyPeriodMonths;

  const expiryDate =
    calculateWarrantyExpiryDate(
      startDate,
      warrantyPeriodMonths,
    );

  const status: WarrantyStatus =
    warrantyPeriodMonths === 0
      ? "no_warranty"
      : getWarrantyStatus(expiryDate);

  const updatedWarranty =
    await updateWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
      {
        ...(input.productName !== undefined && {
          productName: input.productName,
        }),

        ...(input.serialNumber !== undefined && {
          serialNumber: input.serialNumber,
        }),

        warrantyPeriodMonths,
        startDate,
        expiryDate,
        status,

        ...(input.terms !== undefined && {
          terms: input.terms,
        }),

        ...(input.notes !== undefined && {
          notes: input.notes,
        }),

        ...(input.isActive !== undefined && {
          isActive: input.isActive,
        }),
      },
    );

  if (!updatedWarranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  return updatedWarranty;
}

/**
 * Deactivate a warranty.
 */
export async function deactivateWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const warranty =
    await findWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
    );

  if (!warranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  const updatedWarranty =
    await updateWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
      {
        isActive: false,
      },
    );

  if (!updatedWarranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  return updatedWarranty;
}

/**
 * Get warranties that are going to expire
 * within the requested number of days.
 */
export async function getExpiringWarrantiesForOwner(
  ownerId: string,
  days = 30,
) {
  const shop = await getShopForOwner(ownerId);

  const safeDays = Math.min(
    Math.max(days, 1),
    365,
  );

  const startDate = new Date();

  const endDate = new Date(startDate);

  endDate.setDate(
    endDate.getDate() + safeDays,
  );

  return findWarrantiesExpiringSoon(
    shop._id.toString(),
    startDate,
    endDate,
  );
}