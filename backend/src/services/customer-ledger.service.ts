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

    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "bank_transfer":
      return "Bank Transfer";

    case "credit":
      return "Credit";

    default:
      return method ?? "Cash";
  }
}

/**
 * Build the ledger across ALL customer
 * profiles belonging to the same user.
 */
async function buildCustomerLedgerForUser(
  userId: mongoose.Types.ObjectId,
) {
  const customers =
    await CustomerModel.find({
      userId,
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

  const customerIds =
    customers.map(
      (customer) =>
        customer._id,
    );

  const [
    invoices,
    payments,
  ] = await Promise.all([
    InvoiceModel.find({
      customerId: {
        $in: customerIds,
      },
    })
      .sort({
        issueDate: -1,
        createdAt: -1,
      })
      .lean(),

    InvoicePaymentModel.find({
      customerId: {
        $in: customerIds,
      },
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
   * Backward compatibility for invoices that
   * existed before separate payment documents
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
        customers[0]._id.toString(),

      name:
        customers[0].name,

      email:
        customers[0].email,

      phone:
        customers[0].phone,

      address:
        customers[0].address,

      isActive:
        customers[0].isActive,
    },

    /*
     * All customer profiles across shops.
     */
    customerProfiles:
      customers.map(
        (customer) => ({
          id:
            customer._id.toString(),

          shopId:
            customer.shopId.toString(),

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
        }),
      ),

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
 * Get the financial ledger for one customer
 * belonging to the shopkeeper's shop.
 *
 * This remains shop-specific because a
 * shopkeeper must only see their own shop's
 * customer ledger.
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

      shopId:
        shop._id,

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
   * Build only this shop's ledger.
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
 * Get complete financial ledger across
 * ALL shops.
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