import {
  findAllActiveWarranties,
  findAllExpiredWarranties,
  findAllWarrantiesExpiringBetween,
  updateWarrantyStatusIfChanged,
} from "../repositories/warranty.repository";

import {
  createNotification,
  findNotificationByWarrantyEvent,
} from "../repositories/notification.repository";

import { findShopById } from "../repositories/shop.repository";

import { findCustomerById } from "../repositories/customer.repository";

const EXPIRING_WINDOW_DAYS = 30;

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;

type WarrantyStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "no_warranty";

type WarrantyIdentifierFields = {
  _id: {
    toString(): string;
  };
  shopId: {
    toString(): string;
  };
  customerId: {
    toString(): string;
  };
  productName: string;
  expiryDate: Date;
  warrantyPeriodMonths: number;
};

function addDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days,
  );

  return result;
}

function formatExpiryDate(
  date: Date,
): string {
  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

/**
 * Calculate the current warranty status from
 * the warranty period and expiry date.
 */
function calculateCurrentWarrantyStatus(
  warranty: {
    warrantyPeriodMonths: number;
    expiryDate: Date;
  },
  now: Date,
): WarrantyStatus {
  if (
    warranty.warrantyPeriodMonths <= 0
  ) {
    return "no_warranty";
  }

  if (
    warranty.expiryDate.getTime() <=
    now.getTime()
  ) {
    return "expired";
  }

  const millisecondsRemaining =
    warranty.expiryDate.getTime() -
    now.getTime();

  const daysRemaining =
    millisecondsRemaining /
    MILLISECONDS_PER_DAY;

  if (
    daysRemaining <=
    EXPIRING_WINDOW_DAYS
  ) {
    return "expiring_soon";
  }

  return "active";
}

/**
 * Synchronize the stored status of every active
 * warranty with its current date-based status.
 *
 * Only warranties whose status has changed are
 * written back to MongoDB.
 */
async function synchronizeWarrantyStatuses(
  now: Date,
): Promise<number> {
  const warranties =
    await findAllActiveWarranties();

  let updated = 0;

  for (
    const warranty of warranties
  ) {
    const warrantyId =
      warranty._id.toString();

    const status =
      calculateCurrentWarrantyStatus(
        warranty,
        now,
      );

    const updatedWarranty =
      await updateWarrantyStatusIfChanged(
        warrantyId,
        status,
      );

    if (updatedWarranty) {
      updated += 1;
    }
  }

  return updated;
}

async function getActiveShopOwner(
  shopId: string,
): Promise<string | null> {
  const shop =
    await findShopById(shopId);

  if (
    !shop ||
    !shop.isActive
  ) {
    return null;
  }

  return shop.ownerId.toString();
}

/**
 * Create the shopkeeper notification for a warranty
 * that has entered the 30-day expiry window.
 */
async function createShopkeeperExpiringNotification(
  warranty: WarrantyIdentifierFields,
  now: Date,
): Promise<boolean> {
  const warrantyId =
    warranty._id.toString();

  const shopId =
    warranty.shopId.toString();

  const ownerId =
    await getActiveShopOwner(
      shopId,
    );

  if (!ownerId) {
    return false;
  }

  const existingNotification =
    await findNotificationByWarrantyEvent(
      ownerId,
      shopId,
      warrantyId,
      "warranty_expiring",
    );

  if (existingNotification) {
    return false;
  }

  const daysRemaining =
    Math.max(
      0,
      Math.ceil(
        (
          warranty.expiryDate.getTime() -
          now.getTime()
        ) /
          MILLISECONDS_PER_DAY,
      ),
    );

  await createNotification({
    userId: ownerId,
    shopId,
    type: "warranty_expiring",
    title:
      "Warranty expiring soon",
    message:
      `${warranty.productName} warranty ` +
      `expires in ${daysRemaining} ` +
      `day${
        daysRemaining === 1
          ? ""
          : "s"
      } on ${formatExpiryDate(
        warranty.expiryDate,
      )}.`,
    link:
      `/shopkeeper/warranties/${warrantyId}`,
    metadata: {
      warrantyId,
      productName:
        warranty.productName,
      expiryDate:
        warranty.expiryDate.toISOString(),
      daysRemaining,
      recipientRole:
        "shopkeeper",
    },
  });

  return true;
}

/**
 * Create the customer notification for a warranty
 * that has entered the 30-day expiry window.
 */
async function createCustomerExpiringNotification(
  warranty: WarrantyIdentifierFields,
  now: Date,
): Promise<boolean> {
  const customerId =
    warranty.customerId.toString();

  const customer =
    await findCustomerById(
      customerId,
    );

  if (
    !customer ||
    !customer.isActive ||
    !customer.userId
  ) {
    return false;
  }

  const warrantyId =
    warranty._id.toString();

  const shopId =
    warranty.shopId.toString();

  const customerUserId =
    customer.userId.toString();

  const existingNotification =
    await findNotificationByWarrantyEvent(
      customerUserId,
      shopId,
      warrantyId,
      "warranty_expiring",
    );

  if (existingNotification) {
    return false;
  }

  const daysRemaining =
    Math.max(
      0,
      Math.ceil(
        (
          warranty.expiryDate.getTime() -
          now.getTime()
        ) /
          MILLISECONDS_PER_DAY,
      ),
    );

  await createNotification({
    userId: customerUserId,
    shopId,
    type: "warranty_expiring",
    title:
      "Warranty expiring soon",
    message:
      `Your ${warranty.productName} warranty ` +
      `expires in ${daysRemaining} ` +
      `day${
        daysRemaining === 1
          ? ""
          : "s"
      } on ${formatExpiryDate(
        warranty.expiryDate,
      )}.`,
    link:
      `/customer/warranties/${warrantyId}`,
    metadata: {
      warrantyId,
      productName:
        warranty.productName,
      expiryDate:
        warranty.expiryDate.toISOString(),
      daysRemaining,
      recipientRole:
        "customer",
    },
  });

  return true;
}

async function processExpiringWarranties(
  now: Date,
): Promise<{
  shopkeeperCreated: number;
  customerCreated: number;
}> {
  const endDate =
    addDays(
      now,
      EXPIRING_WINDOW_DAYS,
    );

  const warranties =
    await findAllWarrantiesExpiringBetween(
      now,
      endDate,
    );

  let shopkeeperCreated = 0;
  let customerCreated = 0;

  for (
    const warranty of warranties
  ) {
    const shopkeeperNotificationCreated =
      await createShopkeeperExpiringNotification(
        warranty,
        now,
      );

    if (
      shopkeeperNotificationCreated
    ) {
      shopkeeperCreated += 1;
    }

    const customerNotificationCreated =
      await createCustomerExpiringNotification(
        warranty,
        now,
      );

    if (
      customerNotificationCreated
    ) {
      customerCreated += 1;
    }
  }

  return {
    shopkeeperCreated,
    customerCreated,
  };
}

/**
 * Create expiration notifications for both
 * shopkeepers and linked customers.
 */
async function createExpiredNotification(
  warranty: WarrantyIdentifierFields,
): Promise<{
  shopkeeperCreated: boolean;
  customerCreated: boolean;
}> {
  const warrantyId =
    warranty._id.toString();

  const shopId =
    warranty.shopId.toString();

  let shopkeeperCreated = false;
  let customerCreated = false;

  const ownerId =
    await getActiveShopOwner(
      shopId,
    );

  if (ownerId) {
    const existingShopkeeperNotification =
      await findNotificationByWarrantyEvent(
        ownerId,
        shopId,
        warrantyId,
        "warranty_expired",
      );

    if (
      !existingShopkeeperNotification
    ) {
      await createNotification({
        userId: ownerId,
        shopId,
        type: "warranty_expired",
        title:
          "Warranty expired",
        message:
          `${warranty.productName} warranty ` +
          `expired on ${formatExpiryDate(
            warranty.expiryDate,
          )}.`,
        link:
          `/shopkeeper/warranties/${warrantyId}`,
        metadata: {
          warrantyId,
          productName:
            warranty.productName,
          expiryDate:
            warranty.expiryDate.toISOString(),
          recipientRole:
            "shopkeeper",
        },
      });

      shopkeeperCreated = true;
    }
  }

  const customer =
    await findCustomerById(
      warranty.customerId.toString(),
    );

  if (
    customer &&
    customer.isActive &&
    customer.userId
  ) {
    const customerUserId =
      customer.userId.toString();

    const existingCustomerNotification =
      await findNotificationByWarrantyEvent(
        customerUserId,
        shopId,
        warrantyId,
        "warranty_expired",
      );

    if (
      !existingCustomerNotification
    ) {
      await createNotification({
        userId: customerUserId,
        shopId,
        type: "warranty_expired",
        title:
          "Warranty expired",
        message:
          `Your ${warranty.productName} ` +
          `warranty expired on ${formatExpiryDate(
            warranty.expiryDate,
          )}.`,
        link:
          `/customer/warranties/${warrantyId}`,
        metadata: {
          warrantyId,
          productName:
            warranty.productName,
          expiryDate:
            warranty.expiryDate.toISOString(),
          recipientRole:
            "customer",
        },
      });

      customerCreated = true;
    }
  }

  return {
    shopkeeperCreated,
    customerCreated,
  };
}

async function processExpiredWarranties(
  now: Date,
): Promise<{
  shopkeeperCreated: number;
  customerCreated: number;
}> {
  const warranties =
    await findAllExpiredWarranties(
      now,
    );

  let shopkeeperCreated = 0;
  let customerCreated = 0;

  for (
    const warranty of warranties
  ) {
    const result =
      await createExpiredNotification(
        warranty,
      );

    if (result.shopkeeperCreated) {
      shopkeeperCreated += 1;
    }

    if (result.customerCreated) {
      customerCreated += 1;
    }
  }

  return {
    shopkeeperCreated,
    customerCreated,
  };
}

/**
 * Runs the complete warranty status and
 * notification scan.
 *
 * Order:
 *
 * 1. Synchronize stored warranty statuses.
 * 2. Create expiring notifications.
 * 3. Create expired notifications.
 *
 * The operation is safe to execute repeatedly.
 */
export async function runWarrantyNotificationCheck() {
  const now =
    new Date();

  const statusUpdated =
    await synchronizeWarrantyStatuses(
      now,
    );

  const expiring =
    await processExpiringWarranties(
      now,
    );

  const expired =
    await processExpiredWarranties(
      now,
    );

  return {
    statusUpdated,

    expiringCreated:
      expiring.shopkeeperCreated,

    customerExpiringCreated:
      expiring.customerCreated,

    expiredCreated:
      expired.shopkeeperCreated,

    customerExpiredCreated:
      expired.customerCreated,

    checkedAt: now,
  };
}