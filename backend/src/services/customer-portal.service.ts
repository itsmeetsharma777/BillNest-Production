import { Types } from "mongoose";

import {
  CustomerModel,
} from "../models/customer.model";

import {
  InvoiceModel,
} from "../models/invoice.model";

import {
  InvoiceItemModel,
} from "../models/invoice-item.model";

import {
  WarrantyModel,
} from "../models/warranty.model";

import {
  ShopModel,
} from "../models/shop.model";

import {
  ApiError,
} from "../utils/api-error";

import {
  createWarrantyPublicToken,
  verifyWarrantyPublicToken,
} from "../utils/warranty-public-token";

import { env } from "../config/env";

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
  if (
    !Types.ObjectId.isValid(
      value,
    )
  ) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}.`,
      "INVALID_ID",
    );
  }

  return new Types.ObjectId(
    value,
  );
}

/**
 * Get the ONE global customer profile
 * linked to the authenticated customer account.
 *
 * BillNest now uses a global customer model.
 *
 * Customer:
 *   Customer A
 *
 * can have invoices/warranties from:
 *   Shop A
 *   Shop B
 *   Shop C
 *
 * There is no longer one customer profile
 * per shop.
 */
async function getCustomerForUser(
  userId: string,
) {
  const userObjectId =
    toObjectId(
      userId,
      "user ID",
    );

  const customer =
    await CustomerModel.findOne({
      userId: userObjectId,
      isActive: true,
    })
      .sort({
        createdAt: 1,
      })
      .lean();

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
 * Get all shops where the customer has
 * business records.
 *
 * Shops are derived from invoices and
 * warranties instead of customer.shopId.
 */
async function getShopsForCustomer(
  customerId: Types.ObjectId,
) {
  const [
    invoiceShopIds,
    warrantyShopIds,
  ] = await Promise.all([
    InvoiceModel.distinct(
      "shopId",
      {
        customerId,
      },
    ),

    WarrantyModel.distinct(
      "shopId",
      {
        customerId,
        isActive: true,
      },
    ),
  ]);

  const shopIdStrings = [
    ...invoiceShopIds,
    ...warrantyShopIds,
  ]
    .filter(
      (
        shopId,
      ) => Boolean(shopId),
    )
    .map(
      (shopId) =>
        shopId.toString(),
    );

  const uniqueShopIds = [
    ...new Set(
      shopIdStrings,
    ),
  ].map(
    (shopId) =>
      new Types.ObjectId(
        shopId,
      ),
  );

  if (
    uniqueShopIds.length === 0
  ) {
    return [];
  }

  return ShopModel.find({
    _id: {
      $in: uniqueShopIds,
    },

    isActive: true,
  })
    .sort({
      name: 1,
    })
    .lean();
}

/**
 * Customer dashboard.
 *
 * All invoices and warranties belonging
 * to the global customer are included,
 * regardless of which shop created them.
 */
export async function getCustomerDashboard(
  userId: string,
) {
  const customer =
    await getCustomerForUser(
      userId,
    );

  const customerId =
    customer._id;

  const [
    shops,
    invoiceStats,
    invoices,
    warrantyStats,
    warranties,
  ] = await Promise.all([
    getShopsForCustomer(
      customerId,
    ),

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

                {
                  $ifNull: [
                    "$total",
                    0,
                  ],
                },

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

                {
                  $ifNull: [
                    "$amountPaid",
                    0,
                  ],
                },

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

                {
                  $ifNull: [
                    "$amountDue",
                    0,
                  ],
                },

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

  const firstShop =
    shops[0] ?? null;

  return {
    customer: {
      id:
        customer._id,

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      address:
        customer.address,
    },

    /*
     * Backward-compatible customerProfiles
     * response.
     *
     * There is now exactly ONE global
     * customer profile.
     *
     * shopId has intentionally been removed.
     */
    customerProfiles: [
      {
        id:
          customer._id,

        name:
          customer.name,

        email:
          customer.email,

        phone:
          customer.phone,

        address:
          customer.address,
      },
    ],

    shop: firstShop
      ? {
          id:
            firstShop._id,

          name:
            firstShop.name,

          phone:
            firstShop.phone,

          email:
            firstShop.email,

          address:
            firstShop.address,

          logoUrl:
            firstShop.logoUrl,
        }
      : null,

    shops:
      shops.map(
        (shop) => ({
          id:
            shop._id,

          name:
            shop.name,

          phone:
            shop.phone,

          email:
            shop.email,

          address:
            shop.address,

          logoUrl:
            shop.logoUrl,
        }),
      ),

    summary: {
      invoices:
        invoiceSummary,

      warranties:
        warrantySummary,
    },

    recentInvoices:
      invoices,

    upcomingWarranties:
      warranties,
  };
}

/**
 * Get ALL invoices belonging to the
 * authenticated customer across ALL shops.
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
    await getCustomerForUser(
      userId,
    );

  const customerId =
    customer._id;

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
    customerId,
  };

  if (
    options?.status
  ) {
    filter.status =
      options.status;
  }

  const [
    invoices,
    total,
  ] = await Promise.all([
    InvoiceModel.find(
      filter,
    )
      .sort({
        issueDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    InvoiceModel.countDocuments(
      filter,
    ),
  ]);

  /*
   * Load invoice items in one query.
   */
  const invoiceIds =
    invoices.map(
      (invoice) =>
        invoice._id,
    );

  const invoiceItems =
    invoiceIds.length > 0
      ? await InvoiceItemModel.find({
          invoiceId: {
            $in: invoiceIds,
          },
        })
          .sort({
            createdAt: 1,
          })
          .lean()
      : [];

  /*
   * Product names by invoice.
   */
  const productNamesByInvoice =
    new Map<
      string,
      string[]
    >();

  for (
    const item of invoiceItems
  ) {
    const invoiceId =
      item.invoiceId.toString();

    const existing =
      productNamesByInvoice.get(
        invoiceId,
      ) ?? [];

    if (
      item.productName &&
      !existing.includes(
        item.productName,
      )
    ) {
      existing.push(
        item.productName,
      );
    }

    productNamesByInvoice.set(
      invoiceId,
      existing,
    );
  }

  /*
   * Load shops belonging to the
   * invoices.
   */
  const invoiceShopIds = [
    ...new Set(
      invoices.map(
        (invoice) =>
          invoice.shopId.toString(),
      ),
    ),
  ];

  const shops =
    invoiceShopIds.length > 0
      ? await ShopModel.find({
          _id: {
            $in:
              invoiceShopIds.map(
                (shopId) =>
                  new Types.ObjectId(
                    shopId,
                  ),
              ),
          },

          isActive: true,
        }).lean()
      : [];

  const shopById =
    new Map<
      string,
      (typeof shops)[number]
    >();

  for (
    const shop of shops
  ) {
    shopById.set(
      shop._id.toString(),
      shop,
    );
  }

  const invoicesWithProducts =
    invoices.map(
      (invoice) => {
        const shop =
          shopById.get(
            invoice.shopId.toString(),
          );

        return {
          ...invoice,

          productNames:
            productNamesByInvoice.get(
              invoice._id.toString(),
            ) ?? [],

          customerName:
            customer.name,

          customerId:
            invoice.customerId,

          shop: shop
            ? {
                id:
                  shop._id,

                name:
                  shop.name,

                phone:
                  shop.phone,

                email:
                  shop.email,

                address:
                  shop.address,

                logoUrl:
                  shop.logoUrl,
              }
            : null,
        };
      },
    );

  return {
    invoices:
      invoicesWithProducts,

    pagination: {
      page:
        Math.floor(
          skip / limit,
        ) + 1,

      limit,

      total,

      hasMore:
        skip +
          invoices.length <
        total,
    },
  };
}

/**
 * Get one invoice belonging to ANY shop
 * where the authenticated customer owns
 * the global customer record.
 */
export async function getCustomerInvoice(
  userId: string,
  invoiceId: string,
) {
  const customer =
    await getCustomerForUser(
      userId,
    );

  const invoiceObjectId =
    toObjectId(
      invoiceId,
      "invoice ID",
    );

  const invoice =
    await InvoiceModel.findOne({
      _id:
        invoiceObjectId,

      customerId:
        customer._id,
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
      invoiceId:
        invoice._id,
    })
      .sort({
        createdAt: 1,
      })
      .lean(),

    ShopModel.findOne({
      _id:
        invoice.shopId,

      isActive: true,
    }).lean(),
  ]);

  return {
    invoice,

    items,

    customer: {
      id:
        customer._id,

      name:
        customer.name,

      phone:
        customer.phone,

      email:
        customer.email,

      address:
        customer.address,
    },

    shop: shop
      ? {
          id:
            shop._id,

          name:
            shop.name,

          phone:
            shop.phone,

          email:
            shop.email,

          address:
            shop.address,

          taxId:
            shop.taxId,

          logoUrl:
            shop.logoUrl,
        }
      : null,
  };
}

/**
 * Get warranties belonging to the
 * authenticated customer across ALL shops.
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
    await getCustomerForUser(
      userId,
    );

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
    customerId:
      customer._id,

    isActive: true,
  };

  if (
    options?.status
  ) {
    filter.status =
      options.status;
  }

  const [
    warranties,
    total,
  ] = await Promise.all([
    WarrantyModel.find(
      filter,
    )
      .sort({
        expiryDate: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    WarrantyModel.countDocuments(
      filter,
    ),
  ]);

  return {
    warranties,

    pagination: {
      page:
        Math.floor(
          skip / limit,
        ) + 1,

      limit,

      total,

      hasMore:
        skip +
          warranties.length <
        total,
    },
  };
}

/**
 * Get one warranty belonging to ANY shop
 * where the authenticated customer owns
 * the global customer record.
 */
export async function getCustomerWarranty(
  userId: string,
  warrantyId: string,
) {
  const customer =
    await getCustomerForUser(
      userId,
    );

  const warrantyObjectId =
    toObjectId(
      warrantyId,
      "warranty ID",
    );

  const warranty =
    await WarrantyModel.findOne({
      _id:
        warrantyObjectId,

      customerId:
        customer._id,

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
          _id:
            warranty.invoiceId,

          customerId:
            customer._id,
        }).lean()
      : null,

    ShopModel.findOne({
      _id:
        warranty.shopId,

      isActive: true,
    }).lean(),
  ]);

  const publicVerificationToken =
    createWarrantyPublicToken(
      warranty._id.toString(),
    );

  const publicVerificationUrl =
    `${env.FRONTEND_URL}/warranty-card/${warranty._id.toString()}/${publicVerificationToken}`;

  return {
    warranty,

    publicVerificationUrl,

    invoice: invoice
      ? {
          id:
            invoice._id,

          invoiceNumber:
            invoice.invoiceNumber,

          issueDate:
            invoice.issueDate,

          dueDate:
            invoice.dueDate,

          status:
            invoice.status,

          total:
            invoice.total,

          amountPaid:
            invoice.amountPaid,

          amountDue:
            invoice.amountDue,
        }
      : null,

    shop: shop
      ? {
          id:
            shop._id,

          name:
            shop.name,

          phone:
            shop.phone,

          email:
            shop.email,

          address:
            shop.address,

          taxId:
            shop.taxId,

          logoUrl:
            shop.logoUrl,
        }
      : null,
  };
}

/**
 * Public warranty-card verification.
 *
 * This endpoint is intentionally unauthenticated so a
 * customer can scan the QR code on any device.
 *
 * The HMAC token prevents someone from changing the
 * warranty ID in the URL and reading another warranty.
 */
export async function getPublicWarranty(
  warrantyId: string,
  token: string,
) {
  if (
    !Types.ObjectId.isValid(
      warrantyId,
    ) ||
    !verifyWarrantyPublicToken(
      warrantyId,
      token,
    )
  ) {
    throw new ApiError(
      404,
      "Warranty card not found.",
      "WARRANTY_CARD_NOT_FOUND",
    );
  }

  const warranty =
    await WarrantyModel.findOne({
      _id:
        new Types.ObjectId(
          warrantyId,
        ),
      isActive: true,
    }).lean();

  if (!warranty) {
    throw new ApiError(
      404,
      "Warranty card not found.",
      "WARRANTY_CARD_NOT_FOUND",
    );
  }

  const [
    customer,
    shop,
  ] = await Promise.all([
    CustomerModel.findById(
      warranty.customerId,
    ).lean(),

    ShopModel.findOne({
      _id:
        warranty.shopId,
      isActive: true,
    }).lean(),
  ]);

  return {
    warranty: {
      id:
        warranty._id,
      productName:
        warranty.productName,
      serialNumber:
        warranty.serialNumber,
      warrantyPeriodMonths:
        warranty.warrantyPeriodMonths,
      startDate:
        warranty.startDate,
      expiryDate:
        warranty.expiryDate,
      status:
        warranty.status,
      terms:
        warranty.terms,
      notes:
        warranty.notes,
    },

    customer: customer
      ? {
          name:
            customer.name,
        }
      : null,

    shop: shop
      ? {
          name:
            shop.name,
          phone:
            shop.phone,
          email:
            shop.email,
          address:
            shop.address,
          logoUrl:
            shop.logoUrl,
        }
      : null,
  };
}
