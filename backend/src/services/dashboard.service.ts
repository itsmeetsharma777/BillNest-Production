import {
  countActiveCustomers,
  countUnreadNotificationsForDashboard,
  findRecentInvoicesForDashboard,
  findRecentNotificationsForDashboard,
  getInvoiceDashboardSummary,
  getSalesTrend,
  getWarrantyDashboardSummary,
} from "../repositories/dashboard.repository";

import { getShopForOwner } from "./shop.service";
import { ApiError } from "../utils/api-error";

type DashboardOptions = {
  recentLimit?: number;
  startDate?: Date;
  endDate?: Date;
};

function roundMoney(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function startOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(
    23,
    59,
    59,
    999,
  );

  return result;
}

function getDefaultStartDate(
  now: Date,
): Date {
  const result = new Date(now);

  result.setDate(
    result.getDate() - 29,
  );

  return startOfDay(result);
}

function normalizeDateRange(
  options: DashboardOptions,
  now: Date,
) {
  const startDate = options.startDate
    ? startOfDay(options.startDate)
    : getDefaultStartDate(now);

  const endDate = options.endDate
    ? endOfDay(options.endDate)
    : endOfDay(now);

  if (startDate > endDate) {
    throw new ApiError(
      400,
      "Dashboard start date cannot be after end date.",
      "INVALID_DATE_RANGE",
    );
  }

  return {
    startDate,
    endDate,
  };
}

function fillSalesTrend(
  startDate: Date,
  endDate: Date,
  salesTrend: Array<{
    date: string;
    sales: number;
    invoiceCount: number;
  }>,
) {
  const trendMap = new Map(
    salesTrend.map((item) => [
      item.date,
      item,
    ]),
  );

  const result: Array<{
    date: string;
    sales: number;
    invoiceCount: number;
  }> = [];

  const current = new Date(startDate);

  while (current <= endDate) {
    const date = current
      .toISOString()
      .slice(0, 10);

    const existing =
      trendMap.get(date);

    result.push({
      date,
      sales: roundMoney(
        Number(
          existing?.sales ?? 0,
        ),
      ),
      invoiceCount:
        existing?.invoiceCount ?? 0,
    });

    current.setDate(
      current.getDate() + 1,
    );
  }

  return result;
}

function serializeRecentInvoices(
  invoices: Awaited<
    ReturnType<
      typeof findRecentInvoicesForDashboard
    >
  >,
) {
  return invoices.map((invoice) => {
    const customer =
      invoice.customerId &&
      typeof invoice.customerId === "object" &&
      "name" in invoice.customerId
        ? (invoice.customerId as {
            _id?: unknown;
            name?: string;
            email?: string;
            phone?: string;
          })
        : null;

    return {
      id: String(invoice._id),

      invoiceNumber:
        invoice.invoiceNumber,

      issueDate:
        invoice.issueDate
          ? new Date(
              invoice.issueDate,
            ).toISOString()
          : null,

      status:
        invoice.status,

      total: roundMoney(
        Number(
          invoice.total ?? 0,
        ),
      ),

      amountPaid: roundMoney(
        Number(
          invoice.amountPaid ?? 0,
        ),
      ),

      amountDue: roundMoney(
        Number(
          invoice.amountDue ?? 0,
        ),
      ),

      customer: customer
        ? {
            id: customer._id
              ? String(
                  customer._id,
                )
              : null,
            name:
              customer.name ?? null,
            email:
              customer.email ?? null,
            phone:
              customer.phone ?? null,
          }
        : null,
    };
  });
}

export async function getDashboardForOwner(
  ownerId: string,
  options: DashboardOptions = {},
) {
  const shop =
    await getShopForOwner(ownerId);

  const now = new Date();

  const {
    startDate,
    endDate,
  } = normalizeDateRange(
    options,
    now,
  );

  const recentLimit = Math.min(
    Math.max(
      options.recentLimit ?? 5,
      1,
    ),
    10,
  );

  const expiringSoonUntil =
    new Date(now);

  expiringSoonUntil.setDate(
    expiringSoonUntil.getDate() + 30,
  );

  const shopId =
    shop._id.toString();

  const [
    invoiceSummary,
    totalCustomers,
    warrantySummary,
    recentInvoices,
    recentNotifications,
    unreadNotificationCount,
    salesTrend,
  ] = await Promise.all([
    getInvoiceDashboardSummary(
      shopId,
      {
        startDate,
        endDate,
      },
    ),

    countActiveCustomers(
      shopId,
    ),

    getWarrantyDashboardSummary(
      shopId,
      now,
      expiringSoonUntil,
    ),

    findRecentInvoicesForDashboard(
      shopId,
      recentLimit,
    ),

    findRecentNotificationsForDashboard(
      ownerId,
      shopId,
      recentLimit,
    ),

    countUnreadNotificationsForDashboard(
      ownerId,
      shopId,
    ),

    getSalesTrend(
      shopId,
      startDate,
      endDate,
    ),
  ]);

  const collectionRate =
    invoiceSummary.totalSales > 0
      ? roundMoney(
          (
            invoiceSummary.amountCollected /
            invoiceSummary.totalSales
          ) * 100,
        )
      : 0;

  return {
    shop: {
      id: shop._id.toString(),
      name: shop.name,
    },

    period: {
      startDate:
        startDate.toISOString(),
      endDate:
        endDate.toISOString(),
    },

    overview: {
      totalInvoices:
        invoiceSummary.totalInvoices,

      paidInvoices:
        invoiceSummary.paidInvoices,

      partiallyPaidInvoices:
        invoiceSummary.partiallyPaidInvoices,

      draftInvoices:
        invoiceSummary.draftInvoices,

      cancelledInvoices:
        invoiceSummary.cancelledInvoices,

      totalSales:
        roundMoney(
          invoiceSummary.totalSales,
        ),

      amountCollected:
        roundMoney(
          invoiceSummary.amountCollected,
        ),

      amountOutstanding:
        roundMoney(
          invoiceSummary.amountOutstanding,
        ),

      collectionRate,

      totalCustomers,

      activeCustomers:
        totalCustomers,
    },

    warranties: warrantySummary,

    sales: {
      totalSales:
        roundMoney(
          invoiceSummary.totalSales,
        ),

      amountCollected:
        roundMoney(
          invoiceSummary.amountCollected,
        ),

      amountOutstanding:
        roundMoney(
          invoiceSummary.amountOutstanding,
        ),

      trend: fillSalesTrend(
        startDate,
        endDate,
        salesTrend,
      ),
    },

    recentInvoices:
      serializeRecentInvoices(
        recentInvoices,
      ),

    notifications: {
      items: recentNotifications,
      unreadCount:
        unreadNotificationCount,
    },
  };
}