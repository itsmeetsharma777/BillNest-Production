import mongoose from "mongoose";

import {
  CustomerModel,
} from "../models/customer.model";

import {
  InvoiceModel,
} from "../models/invoice.model";

import {
  InvoicePaymentModel,
} from "../models/invoice-payment.model";

import {
  InvoiceItemModel,
} from "../models/invoice-item.model";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

function toObjectId(
  value: string,
  fieldName: string,
): mongoose.Types.ObjectId {
  if (
    !mongoose.isValidObjectId(
      value,
    )
  ) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}.`,
      `INVALID_${fieldName.toUpperCase()}`,
    );
  }

  return new mongoose.Types.ObjectId(
    value,
  );
}

type LedgerPayment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  notes?: string | null;
};

function paymentMethodLabel(
  method?: string | null,
) {
  switch (method) {
    case "cash":
      return "Cash";

    case "online":
      return "Online";

    case "cheque":
      return "Cheque";

    default:
      return method ?? "Cash";
  }
}

/**
 * Build the ledger for the ONE global
 * customer linked to the authenticated
 * customer account.
 *
 * The customer can have invoices and
 * payments from multiple shops.
 */
async function buildCustomerLedgerForUser(
  userId: mongoose.Types.ObjectId,
) {
  const customer =
    await CustomerModel.findOne({
      userId,
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

  const customerId =
    customer._id;

  /*
   * A global customer can have invoices
   * and payments across ALL shops.
   */
  const [
    invoices,
    payments,
  ] = await Promise.all([
    InvoiceModel.find({
      customerId,
    })
      .sort({
        issueDate: -1,
        createdAt: -1,
      })
      .lean(),

    InvoicePaymentModel.find({
      customerId,
    })
      .sort({
        paidAt: -1,
        createdAt: -1,
      })
      .lean(),
  ]);

  const paymentTotalByInvoice =
    new Map<string, number>();

  for (
    const payment of payments
  ) {
    const invoiceId =
      payment.invoiceId.toString();

    paymentTotalByInvoice.set(
      invoiceId,
      roundMoney(
        (
          paymentTotalByInvoice.get(
            invoiceId,
          ) ?? 0
        ) +
          payment.amount,
      ),
    );
  }

  const invoiceMap =
    new Map(
      invoices.map(
        (invoice) => [
          invoice._id.toString(),
          invoice,
        ],
      ),
    );

  const invoiceItems =
    invoices.length > 0
      ? await InvoiceItemModel.find({
          invoiceId: {
            $in: invoices.map(
              (invoice) => invoice._id,
            ),
          },
        })
          .select({ invoiceId: 1, productName: 1 })
          .lean()
      : [];

  const productNamesByInvoice = new Map<string, string[]>();

  for (const item of invoiceItems) {
    const invoiceId = item.invoiceId.toString();
    const names = productNamesByInvoice.get(invoiceId) ?? [];
    if (item.productName && !names.includes(item.productName)) {
      names.push(item.productName);
    }
    productNamesByInvoice.set(invoiceId, names);
  }

  const getProductName = (invoiceId: string) => {
    const names = productNamesByInvoice.get(invoiceId) ?? [];
    if (names.length === 0) return "Invoice";
    if (names.length === 1) return names[0];
    return names[0] + " + " + (names.length - 1) + " more";
  };

  const ledgerPayments:
    LedgerPayment[] =
    payments.map(
      (payment) => {
        const invoice =
          invoiceMap.get(
            payment.invoiceId.toString(),
          );

        return {
          id:
            payment._id.toString(),

          invoiceId:
            payment.invoiceId.toString(),

          invoiceNumber:
            invoice?.invoiceNumber ??
            "Invoice",

          productName:
            getProductName(
              payment.invoiceId.toString(),
            ),

          amount:
            roundMoney(
              payment.amount,
            ),

          paymentMethod:
            paymentMethodLabel(
              payment.paymentMethod,
            ),

          paidAt:
            payment.paidAt,

          notes:
            payment.notes,
        };
      },
    );

  /*
   * Backward compatibility for invoices
   * created before separate payment documents
   * were introduced.
   */
  for (
    const invoice of invoices
  ) {
    if (
      invoice.amountPaid <= 0 ||
      invoice.status ===
        "cancelled"
    ) {
      continue;
    }

    const recordedPayments =
      paymentTotalByInvoice.get(
        invoice._id.toString(),
      ) ?? 0;

    const historicalAmount =
      roundMoney(
        Math.max(
          0,
          invoice.amountPaid -
            recordedPayments,
        ),
      );

    if (
      historicalAmount <= 0
    ) {
      continue;
    }

    ledgerPayments.push({
      id:
        `initial-${invoice._id.toString()}`,

      invoiceId:
        invoice._id.toString(),

      invoiceNumber:
        invoice.invoiceNumber,

      productName:
        getProductName(
          invoice._id.toString(),
        ),

      amount:
        historicalAmount,

      paymentMethod:
        paymentMethodLabel(
          invoice.paymentMethod,
        ),

      paidAt:
        invoice.createdAt ??
        invoice.issueDate,

      notes:
        "Initial payment recorded when the invoice was created.",
    });
  }

  ledgerPayments.sort(
    (a, b) =>
      new Date(
        b.paidAt,
      ).getTime() -
      new Date(
        a.paidAt,
      ).getTime(),
  );

  const activeInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !==
        "cancelled",
    );

  const totalPurchases =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0,
      ),
    );

  const totalPaid =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum +
          invoice.amountPaid,
        0,
      ),
    );

  const totalDue =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum +
          invoice.amountDue,
        0,
      ),
    );

  const paidInvoices =
    activeInvoices.filter(
      (invoice) =>
        invoice.status ===
        "paid",
    ).length;

  const partiallyPaidInvoices =
    activeInvoices.filter(
      (invoice) =>
        invoice.status ===
        "partially_paid",
    ).length;

  const unpaidInvoices =
    activeInvoices.filter(
      (invoice) =>
        invoice.amountPaid ===
          0 &&
        invoice.amountDue > 0,
    ).length;

  return {
    customer: {
      id:
        customer._id.toString(),

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      address:
        customer.address,

      isActive:
        customer.isActive,
    },

    /*
     * There is now exactly ONE global
     * customer profile.
     *
     * shopId has intentionally been removed.
     */
    customerProfiles: [
      {
        id:
          customer._id.toString(),

        name:
          customer.name,

        email:
          customer.email,

        phone:
          customer.phone,

        address:
          customer.address,

        isActive:
          customer.isActive,
      },
    ],

    summary: {
      totalPurchases,

      totalPaid,

      totalDue,

      totalInvoices:
        activeInvoices.length,

      paidInvoices,

      partiallyPaidInvoices,

      unpaidInvoices,
    },

    /*
     * Every invoice contains its own shopId.
     * This preserves the shop identity of the
     * financial transaction.
     */
    invoices:
      invoices.map(
        (invoice) => ({
          id:
            invoice._id.toString(),

          invoiceNumber:
            invoice.invoiceNumber,

          issueDate:
            invoice.issueDate,

          dueDate:
            invoice.dueDate,

          status:
            invoice.status,

          total:
            roundMoney(
              invoice.total,
            ),

          amountPaid:
            roundMoney(
              invoice.amountPaid,
            ),

          amountDue:
            roundMoney(
              invoice.amountDue,
            ),

          paymentMethod:
            paymentMethodLabel(
              invoice.paymentMethod,
            ),

          shopId:
            invoice.shopId.toString(),
        }),
      ),

    payments:
      ledgerPayments,
  };
}

/**
 * Shopkeeper:
 *
 * Get the financial ledger for one
 * GLOBAL customer, but only for the
 * authenticated shopkeeper's shop.
 *
 * This is important:
 *
 * Global customer identity
 *        +
 * Shop-specific financial data
 *
 * A shopkeeper must NEVER see another
 * shop's invoices/payments merely because
 * the customer is global.
 */
export async function getCustomerLedgerForOwner(
  ownerId: string,
  customerId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const customer =
    await CustomerModel.findOne({
      _id:
        toObjectId(
          customerId,
          "customer ID",
        ),

      isActive: true,
    }).lean();

  if (!customer) {
    throw new ApiError(
      404,
      "Customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  /*
   * Only this shop's financial records
   * are included.
   */
  const [
    invoices,
    payments,
  ] = await Promise.all([
    InvoiceModel.find({
      customerId:
        customer._id,

      shopId:
        shop._id,
    })
      .sort({
        issueDate: -1,
        createdAt: -1,
      })
      .lean(),

    InvoicePaymentModel.find({
      customerId:
        customer._id,

      shopId:
        shop._id,
    })
      .sort({
        paidAt: -1,
        createdAt: -1,
      })
      .lean(),
  ]);

  const paymentTotalByInvoice =
    new Map<string, number>();

  for (
    const payment of payments
  ) {
    const invoiceId =
      payment.invoiceId.toString();

    paymentTotalByInvoice.set(
      invoiceId,
      roundMoney(
        (
          paymentTotalByInvoice.get(
            invoiceId,
          ) ?? 0
        ) +
          payment.amount,
      ),
    );
  }

  const invoiceMap =
    new Map(
      invoices.map(
        (invoice) => [
          invoice._id.toString(),
          invoice,
        ],
      ),
    );

  const invoiceItems =
    invoices.length > 0
      ? await InvoiceItemModel.find({
          invoiceId: {
            $in: invoices.map(
              (invoice) => invoice._id,
            ),
          },
        })
          .select({
            invoiceId: 1,
            productName: 1,
          })
          .lean()
      : [];

  const productNamesByInvoice =
    new Map<string, string[]>();

  for (const item of invoiceItems) {
    const invoiceId =
      item.invoiceId.toString();

    const names =
      productNamesByInvoice.get(
        invoiceId,
      ) ?? [];

    if (
      item.productName &&
      !names.includes(
        item.productName,
      )
    ) {
      names.push(
        item.productName,
      );
    }

    productNamesByInvoice.set(
      invoiceId,
      names,
    );
  }

  const getProductName = (
    invoiceId: string,
  ): string => {
    const names =
      productNamesByInvoice.get(
        invoiceId,
      ) ?? [];

    if (names.length === 0) {
      return "Invoice";
    }

    if (names.length === 1) {
      return names[0];
    }

    return (
      names[0] +
      " + " +
      (names.length - 1) +
      " more"
    );
  };

  const ledgerPayments:
    LedgerPayment[] =
    payments.map(
      (payment) => {
        const invoice =
          invoiceMap.get(
            payment.invoiceId.toString(),
          );

        return {
          id:
            payment._id.toString(),

          invoiceId:
            payment.invoiceId.toString(),

          invoiceNumber:
            invoice?.invoiceNumber ??
            "Invoice",

          productName:
            getProductName(
              payment.invoiceId.toString(),
            ),

          amount:
            roundMoney(
              payment.amount,
            ),

          paymentMethod:
            paymentMethodLabel(
              payment.paymentMethod,
            ),

          paidAt:
            payment.paidAt,

          notes:
            payment.notes,
        };
      },
    );

  /*
   * Backward compatibility for invoices
   * that have amountPaid but no separate
   * payment records.
   */
  for (
    const invoice of invoices
  ) {
    if (
      invoice.amountPaid <= 0 ||
      invoice.status ===
        "cancelled"
    ) {
      continue;
    }

    const recordedPayments =
      paymentTotalByInvoice.get(
        invoice._id.toString(),
      ) ?? 0;

    const historicalAmount =
      roundMoney(
        Math.max(
          0,
          invoice.amountPaid -
            recordedPayments,
        ),
      );

    if (
      historicalAmount <= 0
    ) {
      continue;
    }

    ledgerPayments.push({
      id:
        `initial-${invoice._id.toString()}`,

      invoiceId:
        invoice._id.toString(),

      invoiceNumber:
        invoice.invoiceNumber,

      productName:
        getProductName(
          invoice._id.toString(),
        ),

      amount:
        historicalAmount,

      paymentMethod:
        paymentMethodLabel(
          invoice.paymentMethod,
        ),

      paidAt:
        invoice.createdAt ??
        invoice.issueDate,

      notes:
        "Initial payment recorded when the invoice was created.",
    });
  }

  ledgerPayments.sort(
    (a, b) =>
      new Date(
        b.paidAt,
      ).getTime() -
      new Date(
        a.paidAt,
      ).getTime(),
  );

  const activeInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status !==
        "cancelled",
    );

  const totalPurchases =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum + invoice.total,
        0,
      ),
    );

  const totalPaid =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum +
          invoice.amountPaid,
        0,
      ),
    );

  const totalDue =
    roundMoney(
      activeInvoices.reduce(
        (sum, invoice) =>
          sum +
          invoice.amountDue,
        0,
      ),
    );

  return {
    customer: {
      id:
        customer._id.toString(),

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      address:
        customer.address,

      isActive:
        customer.isActive,
    },

    summary: {
      totalPurchases,

      totalPaid,

      totalDue,

      totalInvoices:
        activeInvoices.length,

      paidInvoices:
        activeInvoices.filter(
          (invoice) =>
            invoice.status ===
            "paid",
        ).length,

      partiallyPaidInvoices:
        activeInvoices.filter(
          (invoice) =>
            invoice.status ===
            "partially_paid",
        ).length,

      unpaidInvoices:
        activeInvoices.filter(
          (invoice) =>
            invoice.amountPaid ===
              0 &&
            invoice.amountDue >
              0,
        ).length,
    },

    invoices:
      invoices.map(
        (invoice) => ({
          id:
            invoice._id.toString(),

          invoiceNumber:
            invoice.invoiceNumber,

          issueDate:
            invoice.issueDate,

          dueDate:
            invoice.dueDate,

          status:
            invoice.status,

          total:
            roundMoney(
              invoice.total,
            ),

          amountPaid:
            roundMoney(
              invoice.amountPaid,
            ),

          amountDue:
            roundMoney(
              invoice.amountDue,
            ),

          paymentMethod:
            paymentMethodLabel(
              invoice.paymentMethod,
            ),

          shopId:
            invoice.shopId.toString(),
        }),
      ),

    payments:
      ledgerPayments,
  };
}

/**
 * Customer:
 *
 * Get the complete financial ledger
 * across ALL shops.
 *
 * The customer sees their own global
 * financial history, regardless of which
 * shop generated the invoice.
 */
export async function getCustomerOwnLedger(
  userId: string,
) {
  const userObjectId =
    toObjectId(
      userId,
      "user ID",
    );

  return buildCustomerLedgerForUser(
    userObjectId,
  );
}