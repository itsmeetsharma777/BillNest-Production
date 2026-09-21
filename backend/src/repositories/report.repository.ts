import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";
import { InvoiceItemModel } from "../models/invoice-item.model";
import { InvoiceModel } from "../models/invoice.model";
import { InvoicePaymentModel } from "../models/invoice-payment.model";
import { ProductModel } from "../models/product.model";
import { WarrantyModel } from "../models/warranty.model";

export type ReportDateRange = {
  startDate?: Date;
  endDate?: Date;
};

function buildDateFilter(
  field: string,
  range: ReportDateRange,
) {
  const filter: Record<string, unknown> = {};

  if (range.startDate || range.endDate) {
    const dateCondition: Record<
      string,
      Date
    > = {};

    if (range.startDate) {
      dateCondition.$gte =
        range.startDate;
    }

    if (range.endDate) {
      dateCondition.$lte =
        range.endDate;
    }

    filter[field] = dateCondition;
  }

  return filter;
}

export async function getReportSummary(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "issueDate",
      range,
    );

  const result =
    await InvoiceModel.aggregate([
      {
        $match: {
          shopId: shopObjectId,
          ...dateFilter,
        },
      },

      {
        $group: {
          _id: null,

          totalInvoices: {
            $sum: 1,
          },

          totalSales: {
            $sum: {
              $cond: [
                {
                  $not: [
                    {
                      $in: [
                        "$status",
                        [
                          "draft",
                          "cancelled",
                        ],
                      ],
                    },
                  ],
                },
                "$total",
                0,
              ],
            },
          },

          totalSubtotal: {
            $sum: {
              $cond: [
                {
                  $not: [
                    {
                      $in: [
                        "$status",
                        [
                          "draft",
                          "cancelled",
                        ],
                      ],
                    },
                  ],
                },
                "$subtotal",
                0,
              ],
            },
          },

          totalDiscount: {
            $sum: {
              $cond: [
                {
                  $not: [
                    {
                      $in: [
                        "$status",
                        [
                          "draft",
                          "cancelled",
                        ],
                      ],
                    },
                  ],
                },
                "$discount",
                0,
              ],
            },
          },

          totalTax: {
            $sum: {
              $cond: [
                {
                  $not: [
                    {
                      $in: [
                        "$status",
                        [
                          "draft",
                          "cancelled",
                        ],
                      ],
                    },
                  ],
                },
                "$tax",
                0,
              ],
            },
          },

          amountOutstanding: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        "$status",
                        "cancelled",
                      ],
                    },
                    {
                      $ne: [
                        "$status",
                        "draft",
                      ],
                    },
                  ],
                },
                "$amountDue",
                0,
              ],
            },
          },

          draftInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "draft",
                  ],
                },
                1,
                0,
              ],
            },
          },

          paidInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "paid",
                  ],
                },
                1,
                0,
              ],
            },
          },

          partiallyPaidInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "partially_paid",
                  ],
                },
                1,
                0,
              ],
            },
          },

          cancelledInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "cancelled",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

  return (
    result[0] ?? {
      totalInvoices: 0,
      totalSales: 0,
      totalSubtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      amountOutstanding: 0,
      draftInvoices: 0,
      paidInvoices: 0,
      partiallyPaidInvoices: 0,
      cancelledInvoices: 0,
    }
  );
}

export async function getPaymentSummary(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "paidAt",
      range,
    );

  const result =
    await InvoicePaymentModel.aggregate([
      {
        $match: {
          shopId: shopObjectId,
          ...dateFilter,
        },
      },

      {
        $group: {
          _id: null,

          totalCollected: {
            $sum: "$amount",
          },

          paymentCount: {
            $sum: 1,
          },
        },
      },
    ]);

  return (
    result[0] ?? {
      totalCollected: 0,
      paymentCount: 0,
    }
  );
}

export async function getPaymentMethodBreakdown(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "paidAt",
      range,
    );

  return InvoicePaymentModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        ...dateFilter,
      },
    },

    {
      $group: {
        _id: "$paymentMethod",

        count: {
          $sum: 1,
        },

        amount: {
          $sum: "$amount",
        },
      },
    },

    {
      $sort: {
        amount: -1,
      },
    },
  ]);
}

export async function getSalesTrend(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "issueDate",
      range,
    );

  return InvoiceModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,

        status: {
          $nin: [
            "draft",
            "cancelled",
          ],
        },

        ...dateFilter,
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$issueDate",
          },
        },

        sales: {
          $sum: "$total",
        },

        invoices: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

export async function getPaymentTrend(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "paidAt",
      range,
    );

  return InvoicePaymentModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,
        ...dateFilter,
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$paidAt",
          },
        },

        amount: {
          $sum: "$amount",
        },

        payments: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);
}

export async function getTopProducts(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "issueDate",
      range,
    );

  return InvoiceModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,

        status: {
          $nin: [
            "draft",
            "cancelled",
          ],
        },

        ...dateFilter,
      },
    },

    {
      $lookup: {
        from:
          InvoiceItemModel.collection.name,

        localField: "_id",

        foreignField: "invoiceId",

        as: "items",
      },
    },

    {
      $unwind: "$items",
    },

    {
      $group: {
        _id: {
          $ifNull: [
            "$items.productId",
            "$items.productName",
          ],
        },

        productName: {
          $first:
            "$items.productName",
        },

        sku: {
          $first:
            "$items.sku",
        },

        quantity: {
          $sum:
            "$items.quantity",
        },

        revenue: {
          $sum:
            "$items.lineTotal",
        },
      },
    },

    {
      $sort: {
        revenue: -1,
      },
    },

    {
      $limit: 10,
    },
  ]);
}

export async function getTopCustomers(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "issueDate",
      range,
    );

  return InvoiceModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,

        status: {
          $nin: [
            "draft",
            "cancelled",
          ],
        },

        ...dateFilter,
      },
    },

    {
      $group: {
        _id: "$customerId",

        totalPurchases: {
          $sum: "$total",
        },

        invoiceCount: {
          $sum: 1,
        },

        totalPaid: {
          $sum: "$amountPaid",
        },

        totalDue: {
          $sum: "$amountDue",
        },
      },
    },

    {
      $lookup: {
        from:
          CustomerModel.collection.name,

        localField: "_id",

        foreignField: "_id",

        as: "customer",
      },
    },

    {
      $unwind: {
        path: "$customer",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 1,

        name: {
          $ifNull: [
            "$customer.name",
            "Unknown customer",
          ],
        },

        email: {
          $ifNull: [
            "$customer.email",
            null,
          ],
        },

        phone: {
          $ifNull: [
            "$customer.phone",
            null,
          ],
        },

        totalPurchases: 1,

        invoiceCount: 1,

        totalPaid: 1,

        totalDue: 1,
      },
    },

    {
      $sort: {
        totalPurchases: -1,
      },
    },

    {
      $limit: 10,
    },
  ]);
}

export async function getOutstandingInvoices(
  shopId: string,
  range: ReportDateRange,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const dateFilter =
    buildDateFilter(
      "issueDate",
      range,
    );

  return InvoiceModel.aggregate([
    {
      $match: {
        shopId: shopObjectId,

        status: {
          $in: [
            "paid",
            "partially_paid",
            "draft",
          ],
        },

        amountDue: {
          $gt: 0,
        },

        ...dateFilter,
      },
    },

    {
      $lookup: {
        from:
          CustomerModel.collection.name,

        localField: "customerId",

        foreignField: "_id",

        as: "customer",
      },
    },

    {
      $unwind: {
        path: "$customer",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 1,

        invoiceNumber: 1,

        issueDate: 1,

        dueDate: 1,

        status: 1,

        total: 1,

        amountPaid: 1,

        amountDue: 1,

        customerName: {
          $ifNull: [
            "$customer.name",
            "Unknown customer",
          ],
        },
      },
    },

    {
      $sort: {
        amountDue: -1,
        dueDate: 1,
      },
    },

    {
      $limit: 20,
    },
  ]);
}

export async function getWarrantySummary(
  shopId: string,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const result =
    await WarrantyModel.aggregate([
      {
        $match: {
          shopId: shopObjectId,
          isActive: true,
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: 1,
          },

          active: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "active",
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

          noWarranty: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "no_warranty",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

  return (
    result[0] ?? {
      total: 0,
      active: 0,
      expiringSoon: 0,
      expired: 0,
      noWarranty: 0,
    }
  );
}

export async function getInventorySummary(
  shopId: string,
) {
  const shopObjectId =
    new Types.ObjectId(shopId);

  const result =
    await ProductModel.aggregate([
      {
        $match: {
          shopId: shopObjectId,
        },
      },

      {
        $group: {
          _id: null,

          totalProducts: {
            $sum: 1,
          },

          activeProducts: {
            $sum: {
              $cond: [
                "$isActive",
                1,
                0,
              ],
            },
          },

          inactiveProducts: {
            $sum: {
              $cond: [
                "$isActive",
                0,
                1,
              ],
            },
          },

          totalStockUnits: {
            $sum: "$stockQuantity",
          },

          lowStockProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$isActive",
                        true,
                      ],
                    },
                    {
                      $lte: [
                        "$stockQuantity",
                        "$lowStockThreshold",
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          outOfStockProducts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$isActive",
                        true,
                      ],
                    },
                    {
                      $lte: [
                        "$stockQuantity",
                        0,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

  return (
    result[0] ?? {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalStockUnits: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
    }
  );
}