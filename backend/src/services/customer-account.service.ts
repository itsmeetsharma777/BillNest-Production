import { Types } from "mongoose";

import { CustomerModel } from "../models/customer.model";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";

function normalizeOptionalString(
  value?: string,
) {
  const normalized = value?.trim();

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
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
    },

    customer: {
      id: customer._id.toString(),
      phone: customer.phone ?? "",
      address: {
        line1:
          customer.address?.line1 ?? "",
        line2:
          customer.address?.line2 ?? "",
        city:
          customer.address?.city ?? "",
        state:
          customer.address?.state ?? "",
        postalCode:
          customer.address?.postalCode ?? "",
        country:
          customer.address?.country ??
          "India",
      },
    },
  };
}

export async function getCustomerAccount(
  userId: string,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_USER_ID",
    );
  }

  const user =
    await UserModel.findById(userId).lean();

  if (!user || !user.isActive) {
    throw new ApiError(
      404,
      "User account not found.",
      "USER_NOT_FOUND",
    );
  }

  if (user.role !== "customer") {
    throw new ApiError(
      403,
      "Customer account required.",
      "CUSTOMER_ACCOUNT_REQUIRED",
    );
  }

  const customer =
    await CustomerModel.findOne({
      userId: new Types.ObjectId(userId),
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
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_USER_ID",
    );
  }

  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const normalizedName =
    input.name.trim();

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
      email: normalizedEmail,
      _id: {
        $ne: new Types.ObjectId(
          userId,
        ),
      },
    }).lean();

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const user =
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: normalizedName,
          email: normalizedEmail,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (!user || !user.isActive) {
    throw new ApiError(
      404,
      "User account not found.",
      "USER_NOT_FOUND",
    );
  }

  if (user.role !== "customer") {
    throw new ApiError(
      403,
      "Customer account required.",
      "CUSTOMER_ACCOUNT_REQUIRED",
    );
  }

  const customer =
    await CustomerModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(
          userId,
        ),
        isActive: true,
      },
      {
        $set: {
          name: normalizedName,
          email: normalizedEmail,
          phone:
            normalizeOptionalString(
              input.phone,
            ),
          address: {
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
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

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