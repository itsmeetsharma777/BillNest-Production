import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";
import { normalizePhone } from "../utils/phone";

function normalizeOptionalString(
  value?: string,
) {
  const normalized =
    value?.trim();

  return normalized || undefined;
}

function serializeCustomerAccount(
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
  },
  customer: {
    _id: Types.ObjectId;
    phone?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string | null;
    } | null;
  },
) {
  return {
    user: {
      id:
        user._id.toString(),

      name:
        user.name,

      email:
        user.email,

      role:
        user.role,

      isActive:
        user.isActive,

      emailVerified:
        user.emailVerified,
    },

    customer: {
      id:
        customer._id.toString(),

      phone:
        customer.phone ?? "",

      address: {
        line1:
          customer.address?.line1 ??
          "",

        line2:
          customer.address?.line2 ??
          "",

        city:
          customer.address?.city ??
          "",

        state:
          customer.address?.state ??
          "",

        postalCode:
          customer.address?.postalCode ??
          "",

        country:
          customer.address?.country ??
          "India",
      },
    },
  };
}

/**
 * Get the single GLOBAL customer profile
 * connected to the authenticated customer
 * account.
 *
 * IMPORTANT:
 *
 * Customer identity is now global.
 *
 * Before:
 *
 * User
 *  ├── Shop A Customer
 *  ├── Shop B Customer
 *  └── Shop C Customer
 *
 * Now:
 *
 * User
 *  │
 *  └── Global Customer
 *          │
 *          ├── Shop A invoices
 *          ├── Shop B invoices
 *          └── Shop C invoices
 */
export async function getCustomerAccount(
  userId: string,
) {
  if (
    !Types.ObjectId.isValid(
      userId,
    )
  ) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_USER_ID",
    );
  }

  const user =
    await UserModel.findById(
      userId,
    ).lean();

  if (
    !user ||
    !user.isActive
  ) {
    throw new ApiError(
      404,
      "User account not found.",
      "USER_NOT_FOUND",
    );
  }

  if (
    user.role !==
    "customer"
  ) {
    throw new ApiError(
      403,
      "Customer account required.",
      "CUSTOMER_ACCOUNT_REQUIRED",
    );
  }

  const customer =
    await CustomerModel.findOne({
      userId:
        new Types.ObjectId(
          userId,
        ),

      isActive: true,
    }).lean();

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  return serializeCustomerAccount(
    user,
    customer,
  );
}

/**
 * Update the GLOBAL customer profile.
 *
 * Updating the customer's phone/email/address
 * changes the shared BillNest customer identity,
 * not a shop-specific copy.
 */
export async function updateCustomerAccount(
  userId: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  },
) {
  if (
    !Types.ObjectId.isValid(
      userId,
    )
  ) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_USER_ID",
    );
  }

  const userObjectId =
    new Types.ObjectId(
      userId,
    );

  const normalizedName =
    input.name.trim();

  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  if (!normalizedName) {
    throw new ApiError(
      400,
      "Name is required.",
      "INVALID_NAME",
    );
  }

  if (!normalizedEmail) {
    throw new ApiError(
      400,
      "Email is required.",
      "INVALID_EMAIL",
    );
  }

  const existingUser =
    await UserModel.findOne({
      email:
        normalizedEmail,

      _id: {
        $ne:
          userObjectId,
      },
    }).lean();

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const customer =
    await CustomerModel.findOne({
      userId:
        userObjectId,

      isActive: true,
    });

  if (!customer) {
    throw new ApiError(
      404,
      "Customer profile not found.",
      "CUSTOMER_PROFILE_NOT_FOUND",
    );
  }

  /*
   * Normalize the phone before storing it.
   *
   * Example:
   *
   * 9876543210
   * +91 9876543210
   * 09876543210
   *
   * all resolve to:
   *
   * +919876543210
   */
  const normalizedPhone =
    normalizePhone(
      input.phone,
    );

  /*
   * Do not allow one global customer phone
   * number to belong to another customer.
   *
   * The final MongoDB unique index will provide
   * database-level protection as well.
   */
  if (
    normalizedPhone
  ) {
    const phoneOwner =
      await CustomerModel.findOne({
        phone:
          normalizedPhone,

        _id: {
          $ne:
            customer._id,
        },
      }).lean();

    if (phoneOwner) {
      throw new ApiError(
        409,
        "This phone number is already associated with another BillNest customer.",
        "CUSTOMER_PHONE_ALREADY_EXISTS",
      );
    }
  }

  /*
   * Update the BillNest login account.
   */
  const user =
    await UserModel.findByIdAndUpdate(
      userObjectId,
      {
        $set: {
          name:
            normalizedName,

          email:
            normalizedEmail,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (
    !user ||
    !user.isActive
  ) {
    throw new ApiError(
      404,
      "User account not found.",
      "USER_NOT_FOUND",
    );
  }

  if (
    user.role !==
    "customer"
  ) {
    throw new ApiError(
      403,
      "Customer account required.",
      "CUSTOMER_ACCOUNT_REQUIRED",
    );
  }

  /*
   * Update the ONE global customer profile.
   */
  customer.name =
    normalizedName;

  customer.email =
    normalizedEmail;

  if (
    normalizedPhone !==
    undefined
  ) {
    customer.phone =
      normalizedPhone;
  }

  customer.address = {
    line1:
      normalizeOptionalString(
        input.address?.line1,
      ),

    line2:
      normalizeOptionalString(
        input.address?.line2,
      ),

    city:
      normalizeOptionalString(
        input.address?.city,
      ),

    state:
      normalizeOptionalString(
        input.address?.state,
      ),

    postalCode:
      normalizeOptionalString(
        input.address?.postalCode,
      ),

    country:
      normalizeOptionalString(
        input.address?.country,
      ) ?? "India",
  };

  await customer.save();

  return serializeCustomerAccount(
    user,
    customer,
  );
}