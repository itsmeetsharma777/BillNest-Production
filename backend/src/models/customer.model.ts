import {
  Schema,
  model,
  type InferSchemaType,
} from "mongoose";

/*
 * IMPORTANT ARCHITECTURE
 *
 * Customer is now a GLOBAL BillNest entity.
 *
 * A customer does NOT belong to one shop.
 *
 * Example:
 *
 * Customer
 *    |
 *    +---- Shop A invoice
 *    |
 *    +---- Shop B invoice
 *    |
 *    +---- Shop C invoice
 *
 * Shop-specific financial information remains
 * inside invoices/payments/ledgers.
 */

const customerSchema = new Schema(
  {
    /*
     * Optional link to a BillNest customer account.
     *
     * A customer can exist without creating
     * a BillNest account.
     *
     * Later, when the customer registers,
     * this field connects the global customer
     * record to the User account.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },

    /*
     * Customer's real name.
     */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    /*
     * Email is NOT the global identity.
     *
     * Phone is the primary customer lookup
     * identifier.
     */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    /*
     * GLOBAL CUSTOMER PHONE
     *
     * Phone is globally unique across BillNest.
     *
     * The application normalizes the phone
     * before saving.
     *
     * Example:
     *
     * 9876543210
     * +91 9876543210
     *
     * become:
     *
     * +919876543210
     *
     * Customers without a phone are allowed
     * for legacy compatibility.
     *
     * The sparse unique index means multiple
     * customers can have no phone value, while
     * actual phone numbers must be unique.
     */
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    /*
     * Global customer address.
     */
    address: {
      line1: {
        type: String,
        trim: true,
        maxlength: 200,
      },

      line2: {
        type: String,
        trim: true,
        maxlength: 200,
      },

      city: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      state: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },

      country: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "India",
      },
    },

    /*
     * General customer notes.
     *
     * These are global customer notes.
     *
     * Shop-specific financial information
     * must NOT be stored here.
     */
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /*
     * Soft-delete flag.
     *
     * We do not physically remove customers
     * because historical invoices can still
     * reference them.
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Email lookup.
 *
 * Email is not globally unique because phone
 * is the actual customer identity.
 */
customerSchema.index({
  email: 1,
});

/*
 * GLOBAL UNIQUE PHONE INDEX
 *
 * The migration has already:
 *
 * 1. Normalized old phones.
 * 2. Detected duplicate customers.
 * 3. Merged duplicate customer records.
 * 4. Updated invoice references.
 * 5. Updated warranty references.
 * 6. Updated payment references.
 * 7. Removed duplicate customers.
 * 8. Removed the old phone_1 index.
 * 9. Created customer_phone_unique.
 *
 * Keep the schema definition synchronized
 * with the database index.
 */
customerSchema.index(
  { phone: 1 },
  {
    unique: true,
    sparse: true,
    name: "customer_phone_unique",
  },
);

export type Customer =
  InferSchemaType<
    typeof customerSchema
  >;

export const CustomerModel =
  model(
    "Customer",
    customerSchema,
  );