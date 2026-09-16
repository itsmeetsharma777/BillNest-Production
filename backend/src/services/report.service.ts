import {
  findInvoicesByShopId,
} from "../repositories/invoice.repository";

import {
  getShopForOwner,
} from "./shop.service";

import {
  getWarrantiesForOwner,
} from "./warranty.service";

import { ApiError } from "../utils/api-error";

type ReportDateRange = {
  startDate?: Date;
  endDate?: Date;
};

type InvoiceRecord = {
  _id?: unknown;
  id?: string;

  invoiceDate?: Date | string;
  date?: Date | string;
  createdAt?: Date | string;

  status?: string;

  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;

  amountPaid?: number;
  amountDue?: number;

  paymentMethod?: string;

  customerId?: unknown;
  customer?: {
    _id?: unknown;
    id?: string;
    name?: string;
  };
};

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function getInvoiceDate(
  invoice: InvoiceRecord,
): Date | null {
  const value =
    invoice.invoiceDate ??
    invoice.date ??
    invoice.createdAt;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isWithinDateRange(
  date: Date,
  range: ReportDateRange,
) {
  if (
    range.startDate &&
    date < range.startDate
  ) {
    return false;
  }

  if (
    range.endDate &&
    date > range.endDate
  ) {
    return false;
  }

  return true;
}

function normalizeStatus(
  status?: string,
) {
  return (
    status
      ?.trim()
      .toLowerCase()
      .replaceAll("-", "_")
      .replaceAll(" ", "_") ?? "draft"
  );
}

function normalizePaymentMethod(
  paymentMethod?: string,
) {
  if (!paymentMethod) {
    return "unknown";
  }

  return paymentMethod
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getCustomerKey(
  invoice: InvoiceRecord,
) {
  const customerId =
    invoice.customerId ??
    invoice.customer?._id ??
    invoice.customer?.id;

  if (!customerId) {
    return null;
  }

  return String(customerId);
}

async function getAllInvoicesForShop(
  shopId: string,
): Promise<InvoiceRecord[]> {
  const invoices: InvoiceRecord[] = [];

  const limit = 100;
  let skip = 0;

  while (true) {
    const batch =
      await findInvoicesByShopId(
        shopId,
        {
          skip,
          limit,
        },
      );

    if (!batch.length) {
      break;
    }

    invoices.push(
      ...(batch as InvoiceRecord[]),
    );

    if (batch.length < limit) {
      break;
    }

    skip += limit;

    /*
     * Safety guard.
     * This prevents an accidental repository loop
     * from running forever.
     */
    if (skip > 100000) {
      throw new ApiError(
        500,
        "Unable to complete report generation.",
        "REPORT_QUERY_LIMIT",
      );
    }
  }

  return invoices;
}

export async function getReportsForOwner(
  ownerId: string,
  range: ReportDateRange = {},
) {
  const shop = await getShopForOwner(ownerId);

  const invoices =
    await getAllInvoicesForShop(
      shop._id.toString(),
    );

  const filteredInvoices =
    invoices.filter((invoice) => {
      const date = getInvoiceDate(invoice);

      if (!date) {
        return false;
      }

      return isWithinDateRange(
        date,
        range,
      );
    });

  /*
   * Draft and cancelled invoices are not
   * considered revenue.
   */
  const revenueInvoices =
    filteredInvoices.filter((invoice) => {
      const status = normalizeStatus(
        invoice.status,
      );

      return (
        status !== "draft" &&
        status !== "cancelled"
      );
    });

  const totalSales = roundMoney(
    revenueInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.total ?? 0),
      0,
    ),
  );

  const totalSubtotal = roundMoney(
    revenueInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(invoice.subtotal ?? 0),
      0,
    ),
  );

  const totalDiscount = roundMoney(
    revenueInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(invoice.discount ?? 0),
      0,
    ),
  );

  const totalTax = roundMoney(
    revenueInvoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.tax ?? 0),
      0,
    ),
  );

  const amountCollected = roundMoney(
    revenueInvoices.reduce(
      (sum, invoice) =>
        sum +
        Number(invoice.amountPaid ?? 0),
      0,
    ),
  );

  const amountOutstanding = roundMoney(
    Math.max(
      0,
      totalSales - amountCollected,
    ),
  );

  const averageInvoice =
    revenueInvoices.length > 0
      ? roundMoney(
          totalSales /
            revenueInvoices.length,
        )
      : 0;

  const collectionRate =
    totalSales > 0
      ? roundMoney(
          (amountCollected /
            totalSales) *
            100,
        )
      : 0;

  const statusBreakdown = {
    draft: 0,
    paid: 0,
    partially_paid: 0,
    cancelled: 0,
  };

  for (const invoice of filteredInvoices) {
    const status = normalizeStatus(
      invoice.status,
    );

    if (
      status === "draft" ||
      status === "paid" ||
      status === "partially_paid" ||
      status === "cancelled"
    ) {
      statusBreakdown[
        status as keyof typeof statusBreakdown
      ] += 1;
    }
  }

  const paymentBreakdown: Record<
    string,
    {
      count: number;
      amount: number;
    }
  > = {};

  for (const invoice of revenueInvoices) {
    const method =
      normalizePaymentMethod(
        invoice.paymentMethod,
      );

    if (!paymentBreakdown[method]) {
      paymentBreakdown[method] = {
        count: 0,
        amount: 0,
      };
    }

    paymentBreakdown[method].count += 1;

    paymentBreakdown[method].amount =
      roundMoney(
        paymentBreakdown[method].amount +
          Number(invoice.amountPaid ?? 0),
      );
  }

  const customerIds = new Set<string>();

  for (const invoice of revenueInvoices) {
    const customerKey =
      getCustomerKey(invoice);

    if (customerKey) {
      customerIds.add(customerKey);
    }
  }

  /*
   * Warranty statistics use the existing warranty
   * service, keeping authorization inside the
   * service layer.
   */
  const warrantyResult =
    await getWarrantiesForOwner(
      ownerId,
      {
        page: 1,
        limit: 100,
      },
    );

  const warrantyStats = {
    total: warrantyResult.warranties.length,
    active: warrantyResult.warranties.filter(
      (item) =>
        item.status === "active",
    ).length,
    expiringSoon:
      warrantyResult.warranties.filter(
        (item) =>
          item.status ===
          "expiring_soon",
      ).length,
    expired:
      warrantyResult.warranties.filter(
        (item) =>
          item.status === "expired",
      ).length,
    noWarranty:
      warrantyResult.warranties.filter(
        (item) =>
          item.status === "no_warranty",
      ).length,
  };

  return {
    period: {
      startDate:
        range.startDate?.toISOString() ??
        null,
      endDate:
        range.endDate?.toISOString() ??
        null,
    },

    overview: {
      totalInvoices:
        revenueInvoices.length,

      totalSales,

      totalSubtotal,

      totalDiscount,

      totalTax,

      averageInvoice,

      amountCollected,

      amountOutstanding,

      collectionRate,

      customersWithInvoices:
        customerIds.size,
    },

    invoices: {
      total:
        filteredInvoices.length,

      revenue:
        revenueInvoices.length,

      statusBreakdown,
    },

    payments: paymentBreakdown,

    warranties: warrantyStats,
  };
}