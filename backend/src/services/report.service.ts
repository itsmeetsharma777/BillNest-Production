import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

import {
  getInventorySummary,
  getOutstandingInvoices,
  getPaymentMethodBreakdown,
  getPaymentSummary,
  getPaymentTrend,
  getReportSummary,
  getSalesTrend,
  getTopCustomers,
  getTopProducts,
  getWarrantySummary,
  type ReportDateRange,
} from "../repositories/report.repository";

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function normalizeDate(
  value: Date | undefined,
) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new ApiError(
      400,
      "Invalid report date.",
      "INVALID_REPORT_DATE",
    );
  }

  return date;
}

function normalizePaymentMethod(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export async function getReportsForOwner(
  ownerId: string,
  range: ReportDateRange = {},
) {
  const shop =
    await getShopForOwner(ownerId);

  const startDate =
    normalizeDate(
      range.startDate,
    );

  const endDate =
    normalizeDate(
      range.endDate,
    );

  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    throw new ApiError(
      400,
      "Start date cannot be after end date.",
      "INVALID_REPORT_DATE_RANGE",
    );
  }

  const normalizedRange = {
    startDate,
    endDate,
  };

  const shopId =
    shop._id.toString();

  const [
    summary,
    paymentSummary,
    paymentMethods,
    salesTrend,
    paymentTrend,
    topProducts,
    topCustomers,
    outstandingInvoices,
    warrantySummary,
    inventorySummary,
  ] = await Promise.all([
    getReportSummary(
      shopId,
      normalizedRange,
    ),

    getPaymentSummary(
      shopId,
      normalizedRange,
    ),

    getPaymentMethodBreakdown(
      shopId,
      normalizedRange,
    ),

    getSalesTrend(
      shopId,
      normalizedRange,
    ),

    getPaymentTrend(
      shopId,
      normalizedRange,
    ),

    getTopProducts(
      shopId,
      normalizedRange,
    ),

    getTopCustomers(
      shopId,
      normalizedRange,
    ),

    getOutstandingInvoices(
      shopId,
      normalizedRange,
    ),

    getWarrantySummary(
      shopId,
    ),

    getInventorySummary(
      shopId,
    ),
  ]);

  const totalSales =
    roundMoney(
      Number(
        summary.totalSales ?? 0,
      ),
    );

  const totalCollected =
    roundMoney(
      Number(
        paymentSummary.totalCollected ??
          0,
      ),
    );

  const amountOutstanding =
    roundMoney(
      Number(
        summary.amountOutstanding ??
          0,
      ),
    );

  const averageInvoice =
    summary.paidInvoices +
      summary.partiallyPaidInvoices >
    0
      ? roundMoney(
          totalSales /
            (
              summary.paidInvoices +
              summary.partiallyPaidInvoices
            ),
        )
      : 0;

  const collectionRate =
    totalSales > 0
      ? roundMoney(
          Math.min(
            100,
            (
              totalCollected /
              totalSales
            ) * 100,
          ),
        )
      : 0;

  return {
    period: {
      startDate:
        startDate?.toISOString() ??
        null,

      endDate:
        endDate?.toISOString() ??
        null,
    },

    overview: {
      totalInvoices:
        Number(
          summary.totalInvoices ?? 0,
        ),

      totalSales,

      totalSubtotal:
        roundMoney(
          Number(
            summary.totalSubtotal ?? 0,
          ),
        ),

      totalDiscount:
        roundMoney(
          Number(
            summary.totalDiscount ?? 0,
          ),
        ),

      totalTax:
        roundMoney(
          Number(
            summary.totalTax ?? 0,
          ),
        ),

      averageInvoice,

      amountCollected:
        totalCollected,

      amountOutstanding,

      collectionRate,

      paymentCount:
        Number(
          paymentSummary.paymentCount ??
            0,
        ),
    },

    invoices: {
      total:
        Number(
          summary.totalInvoices ?? 0,
        ),

      draft:
        Number(
          summary.draftInvoices ?? 0,
        ),

      paid:
        Number(
          summary.paidInvoices ?? 0,
        ),

      partiallyPaid:
        Number(
          summary.partiallyPaidInvoices ??
            0,
        ),

      cancelled:
        Number(
          summary.cancelledInvoices ??
            0,
        ),
    },

    payments: {
      totalCollected,

      paymentCount:
        Number(
          paymentSummary.paymentCount ??
            0,
        ),

      byMethod:
        paymentMethods.map(
          (item) => ({
            method:
              normalizePaymentMethod(
                String(
                  item._id ??
                    "unknown",
                ),
              ),

            count:
              Number(
                item.count ?? 0,
              ),

            amount:
              roundMoney(
                Number(
                  item.amount ?? 0,
                ),
              ),
          }),
        ),
    },

    trends: {
      sales:
        salesTrend.map(
          (item) => ({
            date:
              String(item._id),

            sales:
              roundMoney(
                Number(
                  item.sales ?? 0,
                ),
              ),

            invoices:
              Number(
                item.invoices ?? 0,
              ),
          }),
        ),

      payments:
        paymentTrend.map(
          (item) => ({
            date:
              String(item._id),

            amount:
              roundMoney(
                Number(
                  item.amount ?? 0,
                ),
              ),

            payments:
              Number(
                item.payments ?? 0,
              ),
          }),
        ),
    },

    topProducts:
      topProducts.map(
        (item) => ({
          id:
            item._id
              ? String(item._id)
              : null,

          productName:
            String(
              item.productName ??
                "Unknown product",
            ),

          sku:
            item.sku
              ? String(item.sku)
              : null,

          quantity:
            Number(
              item.quantity ?? 0,
            ),

          revenue:
            roundMoney(
              Number(
                item.revenue ?? 0,
              ),
            ),
        }),
      ),

    topCustomers:
      topCustomers.map(
        (item) => ({
          id:
            item._id
              ? String(item._id)
              : null,

          name:
            String(
              item.name ??
                "Unknown customer",
            ),

          email:
            item.email
              ? String(item.email)
              : null,

          phone:
            item.phone
              ? String(item.phone)
              : null,

          totalPurchases:
            roundMoney(
              Number(
                item.totalPurchases ??
                  0,
              ),
            ),

          invoiceCount:
            Number(
              item.invoiceCount ?? 0,
            ),

          totalPaid:
            roundMoney(
              Number(
                item.totalPaid ?? 0,
              ),
            ),

          totalDue:
            roundMoney(
              Number(
                item.totalDue ?? 0,
              ),
            ),
        }),
      ),

    outstandingInvoices:
      outstandingInvoices.map(
        (invoice) => ({
          id:
            invoice._id
              ? String(invoice._id)
              : null,

          invoiceNumber:
            String(
              invoice.invoiceNumber ??
                "",
            ),

          customerName:
            String(
              invoice.customerName ??
                "Unknown customer",
            ),

          issueDate:
            invoice.issueDate
              ? new Date(
                  invoice.issueDate,
                ).toISOString()
              : null,

          dueDate:
            invoice.dueDate
              ? new Date(
                  invoice.dueDate,
                ).toISOString()
              : null,

          status:
            String(
              invoice.status ??
                "draft",
            ),

          total:
            roundMoney(
              Number(
                invoice.total ?? 0,
              ),
            ),

          amountPaid:
            roundMoney(
              Number(
                invoice.amountPaid ??
                  0,
              ),
            ),

          amountDue:
            roundMoney(
              Number(
                invoice.amountDue ??
                  0,
              ),
            ),
        }),
      ),

    warranties: {
      total:
        Number(
          warrantySummary.total ?? 0,
        ),

      active:
        Number(
          warrantySummary.active ?? 0,
        ),

      expiringSoon:
        Number(
          warrantySummary.expiringSoon ??
            0,
        ),

      expired:
        Number(
          warrantySummary.expired ?? 0,
        ),

      noWarranty:
        Number(
          warrantySummary.noWarranty ??
            0,
        ),
    },

    inventory: {
      totalProducts:
        Number(
          inventorySummary.totalProducts ??
            0,
        ),

      activeProducts:
        Number(
          inventorySummary.activeProducts ??
            0,
        ),

      inactiveProducts:
        Number(
          inventorySummary.inactiveProducts ??
            0,
        ),

      totalStockUnits:
        Number(
          inventorySummary.totalStockUnits ??
            0,
        ),

      lowStockProducts:
        Number(
          inventorySummary.lowStockProducts ??
            0,
        ),

      outOfStockProducts:
        Number(
          inventorySummary.outOfStockProducts ??
            0,
        ),
    },
  };
}