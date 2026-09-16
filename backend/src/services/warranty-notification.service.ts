import {
  findAllExpiredWarranties,
  findAllWarrantiesExpiringBetween,
} from "../repositories/warranty.repository";

import {
  createNotification,
  findNotificationByWarrantyEvent,
} from "../repositories/notification.repository";

import { findShopById } from "../repositories/shop.repository";

const EXPIRING_WINDOW_DAYS = 30;

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;

function addDays(
  date: Date,
  days: number,
): Date {
  const result =
    new Date(date);

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

async function processExpiringWarranties(
  now: Date,
): Promise<number> {
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

  let created = 0;

  for (
    const warranty of warranties
  ) {
    const warrantyId =
      warranty._id.toString();

    const shopId =
      warranty.shopId.toString();

    const ownerId =
      await getActiveShopOwner(
        shopId,
      );

    if (!ownerId) {
      continue;
    }

    const existingNotification =
      await findNotificationByWarrantyEvent(
        ownerId,
        shopId,
        warrantyId,
        "warranty_expiring",
      );

    if (existingNotification) {
      continue;
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
      },
    });

    created += 1;
  }

  return created;
}

async function processExpiredWarranties(
  now: Date,
): Promise<number> {
  const warranties =
    await findAllExpiredWarranties(
      now,
    );

  let created = 0;

  for (
    const warranty of warranties
  ) {
    const warrantyId =
      warranty._id.toString();

    const shopId =
      warranty.shopId.toString();

    const ownerId =
      await getActiveShopOwner(
        shopId,
      );

    if (!ownerId) {
      continue;
    }

    const existingNotification =
      await findNotificationByWarrantyEvent(
        ownerId,
        shopId,
        warrantyId,
        "warranty_expired",
      );

    if (existingNotification) {
      continue;
    }

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
      },
    });

    created += 1;
  }

  return created;
}

/**
 * Runs the complete warranty notification scan.
 *
 * Safe to execute repeatedly because every
 * warranty/event combination is checked before
 * creating a notification.
 */
export async function runWarrantyNotificationCheck() {
  const now =
    new Date();

  const expiringCreated =
    await processExpiringWarranties(
      now,
    );

  const expiredCreated =
    await processExpiredWarranties(
      now,
    );

  return {
    expiringCreated,

    expiredCreated,

    checkedAt: now,
  };
}