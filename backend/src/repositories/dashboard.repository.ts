import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";
import { InvoiceModel } from "../models/invoice.model";
import { NotificationModel } from "../models/notification.model";
import { WarrantyModel } from "../models/warranty.model";

type DateRange = {
  startDate?: Date;
  endDate?: Date;
};

type InvoiceDashboardSummary = {
  totalInvoices: number;
  paidInvoices: number;
  partiallyPaidInvoices: number;
  draftInvoices: number;
  cancelledInvoices: number;
  totalSales: number;
  amountCollected: number;
  amountOutstanding: number;
};

type WarrantyDashboardSummary = {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  noWarranty: number;
};

export type DashboardActivity = {
  id: string;
  type: "invoice" | "customer" | "warranty";
  action: "created";
  title: string;
  description: string;
  entityId: string;
  createdAt: string;
};

type SalesTrendItem = {
  date: string;
  sales: number;
  invoiceCount: number;
};

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function buildInvoiceDateFilter(
  range: DateRange,
): Record<string, unknown> {
  if (!range.startDate && !range.endDate) {
    return {};
  }

  const issueDate: Record<string, Date> = {};

  if (range.startDate) {
    issueDate.$gte = range.startDate;
  }

  if (range.endDate) {
    issueDate.$lte = range.endDate;
  }

  return { issueDate };
}

export async function getInvoiceDashboardSummary(
  shopId: string,
  range: DateRange = {},
): Promise<InvoiceDashboardSummary> {
  const match = {
    shopId: toObjectId(shopId),
    ...buildInvoiceDateFilter(range),
  };

  const result =
    await InvoiceModel.aggregate<InvoiceDashboardSummary>([
      {
        $match: match,
      },
      {
        $group: {
          _id: null,

          totalInvoices: {
            $sum: 1,
          },

          paidInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "paid"],
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

          draftInvoices: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "draft"],
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

          totalSales: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["draft", "cancelled"],
                  ],
                },
                0,
                {
                  $ifNull: ["$total", 0],
                },
              ],
            },
          },

          amountCollected: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["draft", "cancelled"],
                  ],
                },
                0,
                {
                  $ifNull: [
                    "$amountPaid",
                    0,
                  ],
                },
              ],
            },
          },

          amountOutstanding: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["draft", "cancelled"],
                  ],
                },
                0,
                {
                  $ifNull: [
                    "$amountDue",
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalInvoices: 1,
          paidInvoices: 1,
          partiallyPaidInvoices: 1,
          draftInvoices: 1,
          cancelledInvoices: 1,
          totalSales: 1,
          amountCollected: 1,
          amountOutstanding: 1,
        },
      },
    ]);

  return (
    result[0] ?? {
      totalInvoices: 0,
      paidInvoices: 0,
      partiallyPaidInvoices: 0,
      draftInvoices: 0,
      cancelledInvoices: 0,
      totalSales: 0,
      amountCollected: 0,
      amountOutstanding: 0,
    }
  );
}

export async function countActiveCustomers(
  shopId: string,
): Promise<number> {
  return CustomerModel.countDocuments({
    shopId: toObjectId(shopId),
    isActive: true,
  });
}

export async function getWarrantyDashboardSummary(
  shopId: string,
  now: Date,
  expiringSoonUntil: Date,
): Promise<WarrantyDashboardSummary> {
  const result =
    await WarrantyModel.aggregate<WarrantyDashboardSummary>([
      {
        $match: {
          shopId: toObjectId(shopId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,

          total: {
            $sum: 1,
          },

          noWarranty: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$warrantyPeriodMonths",
                    0,
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
                  $and: [
                    {
                      $gt: [
                        "$warrantyPeriodMonths",
                        0,
                      ],
                    },
                    {
                      $lte: [
                        "$expiryDate",
                        now,
                      ],
                    },
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
                  $and: [
                    {
                      $gt: [
                        "$warrantyPeriodMonths",
                        0,
                      ],
                    },
                    {
                      $gt: [
                        "$expiryDate",
                        now,
                      ],
                    },
                    {
                      $lte: [
                        "$expiryDate",
                        expiringSoonUntil,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $gt: [
                        "$warrantyPeriodMonths",
                        0,
                      ],
                    },
                    {
                      $gt: [
                        "$expiryDate",
                        expiringSoonUntil,
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
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          expiringSoon: 1,
          expired: 1,
          noWarranty: 1,
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

export async function findRecentInvoicesForDashboard(
  shopId: string,
  limit: number,
) {
  return InvoiceModel.find({
    shopId: toObjectId(shopId),
  })
    .sort({
      issueDate: -1,
      createdAt: -1,
    })
    .limit(limit)
    .populate(
      "customerId",
      "name email phone",
    )
    .lean();
}

/**
 * Real dashboard activity feed.
 *
 * We intentionally derive this from the existing business
 * collections instead of depending on audit-log records.
 *
 * This means existing invoices, customers and warranties
 * immediately appear in Recent Activity without requiring
 * a database backfill.
 */
export async function findRecentActivityForDashboard(
  shopId: string,
  limit: number,
): Promise<DashboardActivity[]> {
  const [invoices, customers, warranties] =
    await Promise.all([
      InvoiceModel.find({
        shopId: toObjectId(shopId),
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .populate(
          "customerId",
          "name",
        )
        .lean(),

      CustomerModel.find({
        shopId: toObjectId(shopId),
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean(),

      WarrantyModel.find({
        shopId: toObjectId(shopId),
        isActive: true,
      })
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .lean(),
    ]);

  const activities: DashboardActivity[] = [];

  for (const invoice of invoices) {
    const customer =
      invoice.customerId &&
      typeof invoice.customerId === "object" &&
      "name" in invoice.customerId
        ? (
            invoice.customerId as {
              _id?: unknown;
              name?: string;
            }
          )
        : null;

    const customerName =
      customer?.name ?? "customer";

    const statusText =
      invoice.status === "paid"
        ? "paid"
        : invoice.status ===
            "partially_paid"
          ? "partially paid"
          : invoice.status ===
              "cancelled"
            ? "cancelled"
            : invoice.status ===
                "draft"
              ? "draft"
              : "created";

    activities.push({
      id: `invoice-${String(invoice._id)}`,
      type: "invoice",
      action: "created",
      title: "Invoice activity",
      description: `${invoice.invoiceNumber} for ${customerName} — ${statusText}`,
      entityId: String(invoice._id),
      createdAt: new Date(
        invoice.createdAt,
      ).toISOString(),
    });
  }

  for (const customer of customers) {
    activities.push({
      id: `customer-${String(customer._id)}`,
      type: "customer",
      action: "created",
      title: "Customer added",
      description: `${customer.name} was added to your customer records.`,
      entityId: String(customer._id),
      createdAt: new Date(
        customer.createdAt,
      ).toISOString(),
    });
  }

  for (const warranty of warranties) {
    activities.push({
      id: `warranty-${String(warranty._id)}`,
      type: "warranty",
      action: "created",
      title: "Warranty created",
      description: `${warranty.productName} warranty was added.`,
      entityId: String(warranty._id),
      createdAt: new Date(
        warranty.createdAt,
      ).toISOString(),
    });
  }

  return activities
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}

export async function findRecentNotificationsForDashboard(
  userId: string,
  shopId: string,
  limit: number,
) {
  return NotificationModel.find({
    userId: toObjectId(userId),
    shopId: toObjectId(shopId),
  })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .lean();
}

export async function countUnreadNotificationsForDashboard(
  userId: string,
  shopId: string,
): Promise<number> {
  return NotificationModel.countDocuments({
    userId: toObjectId(userId),
    shopId: toObjectId(shopId),
    isRead: false,
  });
}

export async function getSalesTrend(
  shopId: string,
  startDate: Date,
  endDate: Date,
): Promise<SalesTrendItem[]> {
  return InvoiceModel.aggregate<SalesTrendItem>([
    {
      $match: {
        shopId: toObjectId(shopId),

        issueDate: {
          $gte: startDate,
          $lte: endDate,
        },

        status: {
          $nin: [
            "draft",
            "cancelled",
          ],
        },
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
          $sum: {
            $ifNull: ["$total", 0],
          },
        },

        invoiceCount: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,
        date: "$_id",
        sales: 1,
        invoiceCount: 1,
      },
    },

    {
      $sort: {
        date: 1,
      },
    },
  ]);
}