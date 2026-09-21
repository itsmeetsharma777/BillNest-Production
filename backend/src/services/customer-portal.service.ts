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
 * Get ALL active customer profiles belonging
 * to the authenticated BillNest user.
 *
 * One customer account can have:
 *
 * Shop A -> Profile A
 * Shop B -> Profile B
 * Shop C -> Profile C
 */
async function getCustomersForUser(
  userId: string,
) {
  const userObjectId =
    toObjectId(
      userId,
      "user ID",
    );

  const customers =
    await CustomerModel.find({
      userId: userObjectId,
      isActive: true,
    })
      .sort({
        createdAt: 1,
      })
      .lean();

  if (
    customers.length === 0
  ) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  return customers;
}

/**
 * Customer dashboard.
 */
export async function getCustomerDashboard(
  userId: string,
) {
  const customers =
    await getCustomersForUser(
      userId,
    );

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
    );

  const shopIds = [
    ...new Set(
      customers.map(
        (customer) =>
          customer.shopId.toString(),
      ),
    ),
  ];

  const [
    shops,
    invoiceStats,
    invoices,
    warrantyStats,
    warranties,
  ] = await Promise.all([
    ShopModel.find({
      _id: {
        $in: shopIds,
      },
      isActive: true,
    }).lean(),

    InvoiceModel.aggregate([
      {
        $match: {
          customerId: {
            $in: customerIds,
          },
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
      customerId: {
        $in: customerIds,
      },

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
          customerId: {
            $in: customerIds,
          },

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
      customerId: {
        $in: customerIds,
      },

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

  /*
   * Keep `shop` for compatibility with the
   * existing customer dashboard frontend.
   *
   * It represents the first shop.
   *
   * `shops` contains ALL shops.
   */
  const firstShop =
    shops[0] ?? null;

  return {
    customer: {
      id:
        customers[0]._id,

      name:
        customers[0].name,

      email:
        customers[0].email,

      phone:
        customers[0].phone,

      address:
        customers[0].address,
    },

    /*
     * All customer profiles.
     */
    customerProfiles:
      customers.map(
        (customer) => ({
          id:
            customer._id,

          shopId:
            customer.shopId,

          name:
            customer.name,

          email:
            customer.email,

          phone:
            customer.phone,

          address:
            customer.address,
        }),
      ),

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

    /*
     * ALL shops connected to this customer.
     */
    shops: shops.map(
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
  const customers =
    await getCustomersForUser(
      userId,
    );

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
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
    customerId: {
      $in: Types.ObjectId[];
    };

    status?: InvoiceStatus;
  } = {
    customerId: {
      $in: customerIds,
    },
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
   * Add customer information.
   *
   * This also allows the frontend to know
   * which customer profile the invoice belongs to.
   */
  const customerById =
    new Map<
      string,
      (typeof customers)[number]
    >();

  for (
    const customer of customers
  ) {
    customerById.set(
      customer._id.toString(),
      customer,
    );
  }

  /*
   * Load shops for invoices.
   *
   * This is useful when the same customer
   * purchased from multiple shops.
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
            $in: invoiceShopIds,
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
        const customer =
          customerById.get(
            invoice.customerId.toString(),
          );

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
            customer?.name ??
            "Customer",

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
 * where the authenticated customer has
 * a customer profile.
 */
export async function getCustomerInvoice(
  userId: string,
  invoiceId: string,
) {
  const customers =
    await getCustomersForUser(
      userId,
    );

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
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

      customerId: {
        $in: customerIds,
      },
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
  const customers =
    await getCustomersForUser(
      userId,
    );

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
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
    customerId: {
      $in: Types.ObjectId[];
    };

    isActive: boolean;

    status?: WarrantyStatus;
  } = {
    customerId: {
      $in: customerIds,
    },

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
 * where the authenticated customer has
 * a customer profile.
 */
export async function getCustomerWarranty(
  userId: string,
  warrantyId: string,
) {
  const customers =
    await getCustomersForUser(
      userId,
    );

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
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

      customerId: {
        $in: customerIds,
      },

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

          customerId: {
            $in: customerIds,
          },
        }).lean()
      : null,

    ShopModel.findOne({
      _id:
        warranty.shopId,

      isActive: true,
    }).lean(),
  ]);

  return {
    warranty,

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