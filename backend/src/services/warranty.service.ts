import {
  createWarranty,
  findWarrantyByIdForShop,
  findWarrantiesByShopId,
  findWarrantiesExpiringSoon,
  updateWarrantyByIdForShop,
} from "../repositories/warranty.repository";

import {
  findCustomerById,
} from "../repositories/customer.repository";

import {
  findInvoiceByIdForShop,
  findInvoiceItems,
} from "../repositories/invoice.repository";

import { getShopForOwner } from "./shop.service";

import { ApiError } from "../utils/api-error";

type WarrantyStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "no_warranty";

interface CreateWarrantyInput {
  customerId: string;
  invoiceId: string;
  invoiceItemId: string;
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

export function calculateWarrantyExpiryDate(
  startDate: Date,
  warrantyPeriodMonths: number,
): Date {
  if (
    Number.isNaN(startDate.getTime())
  ) {
    throw new ApiError(
      400,
      "Invalid warranty start date.",
      "INVALID_START_DATE",
    );
  }

  if (
    !Number.isFinite(
      warrantyPeriodMonths,
    ) ||
    warrantyPeriodMonths < 0
  ) {
    throw new ApiError(
      400,
      "Warranty period must be a valid non-negative number.",
      "INVALID_WARRANTY_PERIOD",
    );
  }

  const expiryDate =
    new Date(startDate);

  /*
   * Using setMonth() preserves the existing
   * business rule of adding calendar months.
   */
  expiryDate.setMonth(
    expiryDate.getMonth() +
      warrantyPeriodMonths,
  );

  return expiryDate;
}

export function getWarrantyStatus(
  expiryDate: Date,
  now = new Date(),
): WarrantyStatus {
  if (
    Number.isNaN(expiryDate.getTime())
  ) {
    throw new ApiError(
      400,
      "Invalid warranty expiry date.",
      "INVALID_EXPIRY_DATE",
    );
  }

  if (
    Number.isNaN(now.getTime())
  ) {
    throw new ApiError(
      400,
      "Invalid current date.",
      "INVALID_DATE",
    );
  }

  if (expiryDate <= now) {
    return "expired";
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const daysRemaining =
    (expiryDate.getTime() -
      now.getTime()) /
    millisecondsPerDay;

  if (daysRemaining <= 30) {
    return "expiring_soon";
  }

  return "active";
}

function validateText(
  value: string,
  fieldName: string,
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ApiError(
      400,
      `${fieldName} cannot be empty.`,
      "INVALID_WARRANTY_DATA",
    );
  }

  return trimmed;
}

function validateWarrantyPeriod(
  warrantyPeriodMonths: number,
): void {
  if (
    !Number.isFinite(
      warrantyPeriodMonths,
    ) ||
    warrantyPeriodMonths < 0
  ) {
    throw new ApiError(
      400,
      "Warranty period must be a valid non-negative number.",
      "INVALID_WARRANTY_PERIOD",
    );
  }
}

function validateStartDate(
  startDate: Date,
): void {
  if (
    Number.isNaN(startDate.getTime())
  ) {
    throw new ApiError(
      400,
      "Invalid warranty start date.",
      "INVALID_START_DATE",
    );
  }
}

/**
 * Re-validates the immutable ownership
 * relationships of an existing warranty.
 *
 * A warranty is permanently associated with:
 *
 *   shop
 *      ↓
 *   customer
 *      ↓
 *   invoice
 *      ↓
 *   invoice item
 *
 * Updates must never allow these relationships
 * to become inconsistent.
 */
async function validateExistingWarrantyReferences(
  shopId: string,
  warranty: {
    customerId: {
      toString(): string;
    };
    invoiceId: {
      toString(): string;
    };
    invoiceItemId: {
      toString(): string;
    };
  },
) {
  const customer =
    await findCustomerById(warranty.customerId.toString());

  if (!customer) {
    throw new ApiError(
      404,
      "Warranty customer was not found.",
      "WARRANTY_CUSTOMER_NOT_FOUND",
    );
  }

  const invoice =
    await findInvoiceByIdForShop(
      warranty.invoiceId.toString(),
      shopId,
    );

  if (!invoice) {
    throw new ApiError(
      404,
      "Warranty invoice was not found in this shop.",
      "WARRANTY_INVOICE_NOT_FOUND",
    );
  }

  if (
    invoice.customerId.toString() !==
    customer._id.toString()
  ) {
    throw new ApiError(
      409,
      "Warranty customer does not match the invoice customer.",
      "WARRANTY_CUSTOMER_INVOICE_MISMATCH",
    );
  }

  const invoiceItems =
    await findInvoiceItems(
      invoice._id.toString(),
    );

  const invoiceItem =
    invoiceItems.find(
      (item) =>
        item._id.toString() ===
        warranty.invoiceItemId.toString(),
    );

  if (!invoiceItem) {
    throw new ApiError(
      404,
      "Warranty invoice item was not found.",
      "WARRANTY_INVOICE_ITEM_NOT_FOUND",
    );
  }

  return {
    customer,
    invoice,
    invoiceItem,
  };
}

export async function createWarrantyForOwner(
  ownerId: string,
  input: CreateWarrantyInput,
) {
  const shop =
    await getShopForOwner(ownerId);

  const customer =
    await findCustomerById(input.customerId);

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  if (!customer.isActive) {
    throw new ApiError(
      400,
      "Cannot create a warranty for an inactive customer.",
      "CUSTOMER_INACTIVE",
    );
  }

  validateWarrantyPeriod(
    input.warrantyPeriodMonths,
  );

  validateStartDate(
    input.startDate,
  );

  const productName =
    validateText(
      input.productName,
      "Product name",
    );

  const invoice =
    await findInvoiceByIdForShop(
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

  const invoiceItems =
    await findInvoiceItems(
      invoice._id.toString(),
    );

  const invoiceItem =
    invoiceItems.find(
      (item) =>
        item._id.toString() ===
        input.invoiceItemId,
    );

  if (!invoiceItem) {
    throw new ApiError(
      404,
      "Invoice item not found for this invoice.",
      "INVOICE_ITEM_NOT_FOUND",
    );
  }

  /*
   * Warranty product must always match
   * the purchased invoice item.
   */
  if (
    productName !==
    invoiceItem.productName.trim()
  ) {
    throw new ApiError(
      400,
      "Warranty product name must match the invoice item.",
      "PRODUCT_NAME_MISMATCH",
    );
  }

  const expiryDate =
    calculateWarrantyExpiryDate(
      input.startDate,
      input.warrantyPeriodMonths,
    );

  const status: WarrantyStatus =
    input.warrantyPeriodMonths === 0
      ? "no_warranty"
      : getWarrantyStatus(
          expiryDate,
        );

  try {
    return await createWarranty({
      shopId:
        shop._id.toString(),

      customerId:
        customer._id.toString(),

      invoiceId:
        input.invoiceId,

      invoiceItemId:
        input.invoiceItemId,

      productName,

      ...(input.serialNumber?.trim() && {
        serialNumber:
          input.serialNumber.trim(),
      }),

      warrantyPeriodMonths:
        input.warrantyPeriodMonths,

      startDate:
        input.startDate,

      expiryDate,

      status,

      ...(input.terms?.trim() && {
        terms:
          input.terms.trim(),
      }),

      ...(input.notes?.trim() && {
        notes:
          input.notes.trim(),
      }),
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code ===
        11000
    ) {
      throw new ApiError(
        409,
        "A warranty already exists for this invoice item.",
        "WARRANTY_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

export async function getWarrantiesForOwner(
  ownerId: string,
  options?: {
    page?: number;
    limit?: number;
    customerId?: string;
    status?: WarrantyStatus;
  },
) {
  const shop =
    await getShopForOwner(ownerId);

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

  const skip =
    (page - 1) * limit;

  const warranties =
    await findWarrantiesByShopId(
      shop._id.toString(),
      {
        skip,
        limit: limit + 1,

        ...(options?.customerId && {
          customerId:
            options.customerId,
        }),

        ...(options?.status && {
          status:
            options.status,
        }),
      },
    );

  const hasMore =
    warranties.length > limit;

  if (hasMore) {
    warranties.pop();
  }

  return {
    warranties,

    pagination: {
      page,
      limit,
      hasMore,
    },
  };
}

export async function getWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

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

export async function updateWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
  input: UpdateWarrantyInput,
) {
  const shop =
    await getShopForOwner(ownerId);

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

  /*
   * SECURITY / DATA-INTEGRITY CHECK
   *
   * Re-resolve the warranty's customer,
   * invoice and invoice item from the
   * authenticated shop.
   *
   * This guarantees that an update cannot
   * leave the warranty attached to an
   * inconsistent purchase record.
   */
  const {
    invoiceItem,
  } =
    await validateExistingWarrantyReferences(
      shop._id.toString(),
      existingWarranty,
    );

  /*
   * The invoice item's product name is
   * authoritative.
   */
  const invoiceProductName =
    invoiceItem.productName.trim();

  if (
    input.productName !== undefined
  ) {
    const requestedProductName =
      validateText(
        input.productName,
        "Product name",
      );

    if (
      requestedProductName !==
      invoiceProductName
    ) {
      throw new ApiError(
        400,
        "Warranty product name must match the invoice item.",
        "PRODUCT_NAME_MISMATCH",
      );
    }
  }

  if (
    input.warrantyPeriodMonths !==
    undefined
  ) {
    validateWarrantyPeriod(
      input.warrantyPeriodMonths,
    );
  }

  if (
    input.startDate !== undefined
  ) {
    validateStartDate(
      input.startDate,
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
      : getWarrantyStatus(
          expiryDate,
        );

  /*
   * Always persist the authoritative
   * invoice-item product name rather than
   * trusting client input.
   *
   * This also repairs any old inconsistent
   * productName value when the warranty is
   * edited.
   */
  const updatedWarranty =
    await updateWarrantyByIdForShop(
      warrantyId,
      shop._id.toString(),
      {
        productName:
          invoiceProductName,

        ...(input.serialNumber !==
          undefined && {
          serialNumber:
            input.serialNumber.trim(),
        }),

        warrantyPeriodMonths,

        startDate,

        expiryDate,

        status,

        ...(input.terms !==
          undefined && {
          terms:
            input.terms.trim(),
        }),

        ...(input.notes !==
          undefined && {
          notes:
            input.notes.trim(),
        }),

        ...(input.isActive !==
          undefined && {
          isActive:
            input.isActive,
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

export async function deactivateWarrantyForOwner(
  ownerId: string,
  warrantyId: string,
) {
  const shop =
    await getShopForOwner(ownerId);

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

  if (!warranty.isActive) {
    throw new ApiError(
      400,
      "Warranty is already deactivated.",
      "WARRANTY_ALREADY_DEACTIVATED",
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

export async function getExpiringWarrantiesForOwner(
  ownerId: string,
  days = 30,
) {
  const shop =
    await getShopForOwner(ownerId);

  if (
    !Number.isFinite(days) ||
    days < 1
  ) {
    throw new ApiError(
      400,
      "Days must be a positive number.",
      "INVALID_DAYS",
    );
  }

  const safeDays = Math.min(
    Math.floor(days),
    365,
  );

  const startDate =
    new Date();

  const endDate =
    new Date(startDate);

  endDate.setDate(
    endDate.getDate() +
      safeDays,
  );

  return findWarrantiesExpiringSoon(
    shop._id.toString(),
    startDate,
    endDate,
  );
}