import mongoose, {
  Types,
} from "mongoose";

import { env } from "../config/env";
import { CustomerModel } from "../models/customer.model";
import { InvoiceModel } from "../models/invoice.model";
import { WarrantyModel } from "../models/warranty.model";
import { InvoicePaymentModel } from "../models/invoice-payment.model";
import { normalizePhone } from "../utils/phone";

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type CustomerRecord = {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  userId?: Types.ObjectId;
  address?: Address;
  notes?: string;
  isActive?: boolean;
  createdAt?: Date;
};

function valueOrUndefined(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function mergeAddress(
  records: CustomerRecord[],
): Address | undefined {
  const result: Address = {};

  const fields: Array<keyof Address> = [
    "line1",
    "line2",
    "city",
    "state",
    "postalCode",
    "country",
  ];

  for (const field of fields) {
    for (const record of records) {
      const value = valueOrUndefined(
        record.address?.[field],
      );

      if (value) {
        result[field] = value;
        break;
      }
    }
  }

  return Object.keys(result).length
    ? result
    : undefined;
}

function mergeNotes(
  records: CustomerRecord[],
): string | undefined {
  const notes = Array.from(
    new Set(
      records
        .map((record) =>
          valueOrUndefined(record.notes),
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ),
  );

  return notes.length
    ? notes.join("\n\n")
    : undefined;
}

function chooseSurvivor(
  records: CustomerRecord[],
): CustomerRecord {
  return [...records].sort(
    (a, b) => {
      /*
       * Priority 1:
       * Keep an active customer over
       * an inactive customer.
       */
      const activeDifference =
        Number(Boolean(b.isActive)) -
        Number(Boolean(a.isActive));

      if (activeDifference !== 0) {
        return activeDifference;
      }

      /*
       * Priority 2:
       * Prefer a customer already linked
       * to a BillNest account.
       */
      const linkedDifference =
        Number(Boolean(b.userId)) -
        Number(Boolean(a.userId));

      if (linkedDifference !== 0) {
        return linkedDifference;
      }

      /*
       * Priority 3:
       * Keep the oldest record.
       */
      const aTime =
        a.createdAt?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      const bTime =
        b.createdAt?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    },
  )[0];
}

async function main(): Promise<void> {
  /*
   * Connect directly to MongoDB.
   */
  await mongoose.connect(
    env.MONGODB_URI,
  );

  console.log(
    "Connected to MongoDB.",
  );

  /*
   * Read raw customer documents.
   *
   * We intentionally use the collection
   * directly because old documents may
   * still contain legacy shopId fields.
   */
  const rawCustomers =
    (await CustomerModel.collection
      .find({})
      .toArray()) as unknown as CustomerRecord[];

  console.log(
    `Found ${rawCustomers.length} customer records.`,
  );

  /*
   * Group customers by normalized phone.
   */
  const groups =
    new Map<
      string,
      CustomerRecord[]
    >();

  const recordsWithoutPhone: CustomerRecord[] =
    [];

  for (const customer of rawCustomers) {
    const normalized =
      normalizePhone(
        customer.phone,
      );

    if (!normalized) {
      recordsWithoutPhone.push(
        customer,
      );

      continue;
    }

    const existing =
      groups.get(normalized) ??
      [];

    existing.push(customer);

    groups.set(
      normalized,
      existing,
    );
  }

  /*
   * Find duplicate phone groups.
   */
  const duplicateGroups =
    Array.from(
      groups.entries(),
    ).filter(
      ([, records]) =>
        records.length > 1,
    );

  console.log(
    `Found ${duplicateGroups.length} duplicate phone groups.`,
  );

  /*
   * SAFETY CHECK
   *
   * If the same phone is linked to
   * multiple different BillNest customer
   * accounts, we stop instead of guessing.
   */
  for (const [
    phone,
    records,
  ] of duplicateGroups) {
    const linkedUserIds =
      Array.from(
        new Set(
          records
            .map((record) =>
              record.userId
                ? record.userId.toString()
                : undefined,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        ),
      );

    if (linkedUserIds.length > 1) {
      throw new Error(
        `Cannot safely merge phone ${phone}: it is linked to multiple customer accounts (${linkedUserIds.join(", ")}).`,
      );
    }
  }

  /*
   * Start transaction.
   *
   * All customer merges and reference
   * updates happen atomically.
   */
  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        /*
         * Remove the legacy shop ownership
         * field from ALL customer documents.
         *
         * Customers are now global.
         */
        await CustomerModel.collection.updateMany(
          {},
          {
            $unset: {
              shopId: "",
            },
          },
          { session },
        );

        /*
         * Normalize all existing phone numbers.
         */
        for (const customer of rawCustomers) {
          const normalized =
            normalizePhone(
              customer.phone,
            );

          if (
            normalized &&
            normalized !==
              customer.phone
          ) {
            await CustomerModel.collection.updateOne(
              {
                _id: customer._id,
              },
              {
                $set: {
                  phone: normalized,
                },
              },
              { session },
            );
          }
        }

        /*
         * Merge duplicate customer records.
         */
        for (const [
          phone,
          records,
        ] of duplicateGroups) {
          const survivor =
            chooseSurvivor(records);

          const duplicates =
            records.filter(
              (record) =>
                !record._id.equals(
                  survivor._id,
                ),
            );

          const duplicateIds =
            duplicates.map(
              (record) =>
                record._id,
            );

          /*
           * Preserve the linked customer
           * account if one exists.
           */
          const mergedUserId =
            records.find(
              (record) =>
                Boolean(record.userId),
            )?.userId;

          /*
           * Preserve the first available email.
           */
          const mergedEmail =
            records
              .map((record) =>
                valueOrUndefined(
                  record.email,
                ),
              )
              .find(Boolean);

          /*
           * Merge address fields.
           */
          const mergedAddress =
            mergeAddress(records);

          /*
           * Merge distinct notes.
           */
          const mergedNotes =
            mergeNotes(records);

          const update: Record<
            string,
            unknown
          > = {
            name: survivor.name,
            phone,
            isActive:
              records.some(
                (record) =>
                  record.isActive !==
                  false,
              ),
          };

          if (mergedUserId) {
            update.userId =
              mergedUserId;
          }

          if (mergedEmail) {
            update.email =
              mergedEmail;
          }

          if (mergedAddress) {
            update.address =
              mergedAddress;
          }

          if (mergedNotes) {
            update.notes =
              mergedNotes;
          }

          /*
           * Update survivor.
           */
          await CustomerModel.collection.updateOne(
            {
              _id: survivor._id,
            },
            {
              $set: update,
              $unset: {
                shopId: "",
              },
            },
            { session },
          );

          if (duplicateIds.length === 0) {
            continue;
          }

          /*
           * Update invoice references.
           *
           * Old duplicate customer IDs
           * now point to the survivor.
           */
          await InvoiceModel.updateMany(
            {
              customerId: {
                $in: duplicateIds,
              },
            },
            {
              $set: {
                customerId:
                  survivor._id,
              },
            },
            { session },
          );

          /*
           * Update warranty references.
           */
          await WarrantyModel.updateMany(
            {
              customerId: {
                $in: duplicateIds,
              },
            },
            {
              $set: {
                customerId:
                  survivor._id,
              },
            },
            { session },
          );

          /*
           * Update payment references.
           */
          await InvoicePaymentModel.updateMany(
            {
              customerId: {
                $in: duplicateIds,
              },
            },
            {
              $set: {
                customerId:
                  survivor._id,
              },
            },
            { session },
          );

          /*
           * Delete duplicate customer records
           * after every reference has been moved.
           */
          await CustomerModel.collection.deleteMany(
            {
              _id: {
                $in: duplicateIds,
              },
            },
            { session },
          );

          console.log(
            `Merged ${duplicates.length} duplicate customer(s) for ${phone}.`,
          );
        }

        if (
          recordsWithoutPhone.length
        ) {
          console.log(
            `Preserved ${recordsWithoutPhone.length} customer record(s) without a phone number.`,
          );
        }
      },
    );
  } finally {
    await session.endSession();
  }

  /*
   * Remove the old non-unique phone index.
   */
  const collection =
    CustomerModel.collection;

  const existingIndexes =
    await collection.indexes();

  const oldPhoneIndex =
    existingIndexes.find(
      (index) =>
        index.name ===
        "phone_1",
    );

  if (oldPhoneIndex) {
    await collection.dropIndex(
      "phone_1",
    );

    console.log(
      "Dropped old phone_1 index.",
    );
  }

  /*
   * Create final global unique phone index.
   *
   * sparse:true means customers without
   * a phone are still allowed.
   */
  const finalIndexes =
    await collection.indexes();

  const hasUniquePhoneIndex =
    finalIndexes.some(
      (index) =>
        index.name ===
        "customer_phone_unique",
    );

  if (!hasUniquePhoneIndex) {
    await collection.createIndex(
      { phone: 1 },
      {
        unique: true,
        sparse: true,
        name: "customer_phone_unique",
      },
    );

    console.log(
      "Created customer_phone_unique index.",
    );
  } else {
    console.log(
      "customer_phone_unique already exists.",
    );
  }

  console.log(
    "Global customer migration completed successfully.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Global customer migration failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });