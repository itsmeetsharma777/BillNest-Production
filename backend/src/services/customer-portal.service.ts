import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";
import { InvoiceModel } from "../models/invoice.model";
import { InvoiceItemModel } from "../models/invoice-item.model";
import { WarrantyModel } from "../models/warranty.model";
import { ShopModel } from "../models/shop.model";
import { ApiError } from "../utils/api-error";

type InvoiceStatus =
  | "draft"
  | "paid"
  | "partially_paid"
  | "cancelled";

type WarrantyStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "no_warranty";

function toObjectId(
  value: string,
  fieldName: string,
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}.`,
      "INVALID_ID",
    );
  }

  return new Types.ObjectId(value);
}

async function getCustomerForUser(userId: string) {
  const userObjectId = toObjectId(userId, "user ID");

  const customer = await CustomerModel.findOne({
    userId: userObjectId,
    isActive: true,
  }).lean();

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  return customer;
}

/**
 * Customer dashboard.
 *
 * Everything is derived from the authenticated user's
 * linked customer profile. No customerId is accepted
 * from the client.
 */
export async function getCustomerDashboard(
  userId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  const customerId = customer._id;

  const [
    shop,
    invoiceStats,
    invoices,
    warrantyStats,
    warranties,
  ] = await Promise.all([
    ShopModel.findOne({
      _id: customer.shopId,
      isActive: true,
    }).lean(),

    InvoiceModel.aggregate([
      {
        $match: {
          customerId,
        },
      },
      {
        $group: {
          _id: null,

          totalInvoices: {
            $sum: 1,
          },

          totalSpent: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$status",
                    "cancelled",
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          totalPaid: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$status",
                    "cancelled",
                  ],
                },
                "$amountPaid",
                0,
              ],
            },
          },

          totalDue: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$status",
                    "cancelled",
                  ],
                },
                "$amountDue",
                0,
              ],
            },
          },
        },
      },
    ]),

    InvoiceModel.find({
      customerId,
      status: {
        $ne: "cancelled",
      },
    })
      .sort({
        issueDate: -1,
        createdAt: -1,
      })
      .limit(5)
      .lean(),

    WarrantyModel.aggregate([
      {
        $match: {
          customerId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,

          totalWarranties: {
            $sum: 1,
          },

          activeWarranties: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "active",
                      "expiring_soon",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },

          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "expiring_soon",
                  ],
                },
                1,
                0,
              ],
            },
          },

          expired: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "expired",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    WarrantyModel.find({
      customerId,
      isActive: true,
    })
      .sort({
        expiryDate: 1,
      })
      .limit(5)
      .lean(),
  ]);

  const invoiceSummary =
    invoiceStats[0] ?? {
      totalInvoices: 0,
      totalSpent: 0,
      totalPaid: 0,
      totalDue: 0,
    };

  const warrantySummary =
    warrantyStats[0] ?? {
      totalWarranties: 0,
      activeWarranties: 0,
      expiringSoon: 0,
      expired: 0,
    };

  return {
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    },

    shop: shop
      ? {
          id: shop._id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email,
          address: shop.address,
          logoUrl: shop.logoUrl,
        }
      : null,

    summary: {
      invoices: invoiceSummary,
      warranties: warrantySummary,
    },

    recentInvoices: invoices,

    upcomingWarranties: warranties,
  };
}

/**
 * Get invoices belonging only to the authenticated
 * customer's profile.
 */
export async function getCustomerInvoices(
  userId: string,
  options?: {
    skip?: number;
    limit?: number;
    status?: InvoiceStatus;
  },
) {
  const customer =
    await getCustomerForUser(userId);

  const skip = Math.max(
    0,
    options?.skip ?? 0,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      options?.limit ?? 20,
    ),
  );

  const filter: {
    customerId: Types.ObjectId;
    status?: InvoiceStatus;
  } = {
    customerId: customer._id,
  };

  if (options?.status) {
    filter.status = options.status;
  }

  const [invoices, total] =
    await Promise.all([
      InvoiceModel.find(filter)
        .sort({
          issueDate: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      InvoiceModel.countDocuments(filter),
    ]);

  return {
    invoices,

    pagination: {
      page:
        Math.floor(skip / limit) + 1,
      limit,
      total,
      hasMore:
        skip + invoices.length < total,
    },
  };
}

/**
 * Get one invoice only when it belongs to the
 * authenticated customer.
 */
export async function getCustomerInvoice(
  userId: string,
  invoiceId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  const invoiceObjectId =
    toObjectId(invoiceId, "invoice ID");

  const invoice =
    await InvoiceModel.findOne({
      _id: invoiceObjectId,
      customerId: customer._id,
    }).lean();

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  const [
    items,
    shop,
  ] = await Promise.all([
    InvoiceItemModel.find({
      invoiceId: invoice._id,
    })
      .sort({
        createdAt: 1,
      })
      .lean(),

    ShopModel.findOne({
      _id: invoice.shopId,
      isActive: true,
    }).lean(),
  ]);

  return {
    invoice,

    items,

    shop: shop
      ? {
          id: shop._id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email,
          address: shop.address,
          taxId: shop.taxId,
          logoUrl: shop.logoUrl,
        }
      : null,
  };
}

/**
 * Get warranties belonging only to the authenticated
 * customer's profile.
 */
export async function getCustomerWarranties(
  userId: string,
  options?: {
    skip?: number;
    limit?: number;
    status?: WarrantyStatus;
  },
) {
  const customer =
    await getCustomerForUser(userId);

  const skip = Math.max(
    0,
    options?.skip ?? 0,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      options?.limit ?? 20,
    ),
  );

  const filter: {
    customerId: Types.ObjectId;
    isActive: boolean;
    status?: WarrantyStatus;
  } = {
    customerId: customer._id,
    isActive: true,
  };

  if (options?.status) {
    filter.status = options.status;
  }

  const [
    warranties,
    total,
  ] = await Promise.all([
    WarrantyModel.find(filter)
      .sort({
        expiryDate: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    WarrantyModel.countDocuments(filter),
  ]);

  return {
    warranties,

    pagination: {
      page:
        Math.floor(skip / limit) + 1,
      limit,
      total,
      hasMore:
        skip + warranties.length < total,
    },
  };
}

/**
 * Get one warranty only when it belongs to the
 * authenticated customer.
 */
export async function getCustomerWarranty(
  userId: string,
  warrantyId: string,
) {
  const customer =
    await getCustomerForUser(userId);

  const warrantyObjectId =
    toObjectId(warrantyId, "warranty ID");

  const warranty =
    await WarrantyModel.findOne({
      _id: warrantyObjectId,
      customerId: customer._id,
      isActive: true,
    }).lean();

  if (!warranty) {
    throw new ApiError(
      404,
      "Warranty not found.",
      "WARRANTY_NOT_FOUND",
    );
  }

  const [
    invoice,
    shop,
  ] = await Promise.all([
    warranty.invoiceId
      ? InvoiceModel.findOne({
          _id: warranty.invoiceId,
          customerId: customer._id,
        }).lean()
      : null,

    ShopModel.findOne({
      _id: warranty.shopId,
      isActive: true,
    }).lean(),
  ]);

  return {
    warranty,

    invoice: invoice
      ? {
          id: invoice._id,
          invoiceNumber:
            invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          total: invoice.total,
          amountPaid: invoice.amountPaid,
          amountDue: invoice.amountDue,
        }
      : null,

    shop: shop
      ? {
          id: shop._id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email,
          address: shop.address,
          taxId: shop.taxId,
          logoUrl: shop.logoUrl,
        }
      : null,
  };
}