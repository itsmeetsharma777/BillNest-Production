import {
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
} from "../repositories/user.repository";

import {
  createSession,
  deleteSessionByTokenHash,
} from "../repositories/session.repository";

import {
  createCustomer,
  findCustomerByPhone,
  findUnlinkedCustomersByEmail,
  linkCustomerToUser,
} from "../repositories/customer.repository";

import {
  generateSessionToken,
  hashSessionToken,
  SESSION_DURATION_MS,
} from "../utils/session";

import {
  hashPassword,
  verifyPassword,
} from "../utils/hash";

import { ApiError } from "../utils/api-error";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "shopkeeper" | "customer";
}

interface LoginInput {
  email: string;
  password: string;
}

/**
 * Connect every existing customer profile
 * using this email to the new BillNest customer
 * account.
 *
 * This is important because one customer can
 * already exist in several different shops.
 *
 * Example:
 *
 * Shop A -> customer@example.com
 * Shop B -> customer@example.com
 * Shop C -> customer@example.com
 *
 * Customer creates one BillNest account.
 *
 * Result:
 *
 * User
 *  ├── Shop A profile
 *  ├── Shop B profile
 *  └── Shop C profile
 */
async function linkPreExistingCustomerProfiles(
  userId: string,
  email: string,
  phone?: string,
  name?: string,
) {
  /*
   * Phone is the primary global customer identity.
   *
   * If a global customer already exists for this
   * phone number, attach the newly-created account
   * to that customer instead of creating a duplicate.
   */
  if (phone) {
    const existingCustomer =
      await findCustomerByPhone(phone);

    if (existingCustomer) {
      if (
        existingCustomer.userId &&
        existingCustomer.userId.toString() !== userId
      ) {
        throw new ApiError(
          409,
          "This phone number is already linked to a BillNest customer account.",
          "PHONE_ALREADY_LINKED",
        );
      }

      if (!existingCustomer.userId) {
        await linkCustomerToUser(
          existingCustomer._id.toString(),
          userId,
        );
      }

      return;
    }

    /*
     * No global customer exists yet.
     *
     * Create the global customer immediately so
     * the account is visible to every shopkeeper.
     */
    await createCustomer({
      userId,
      name: name?.trim() || "BillNest Customer",
      email,
      phone,
    });

    return;
  }
  const matchingCustomers =
    await findUnlinkedCustomersByEmail(
      email,
    );

  /*
   * Link EVERY matching profile.
   *
   * Previously the system deliberately avoided
   * multiple profiles because it assumed one
   * customer could belong to only one shop.
   *
   * That restriction is now removed.
   */
  for (
    const customer of matchingCustomers
  ) {
    await linkCustomerToUser(
      customer._id.toString(),
      userId,
    );
  }
}

export async function registerUser(
  input: RegisterInput,
) {
  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const existingUser =
    await findUserByEmail(
      normalizedEmail,
    );

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash =
    await hashPassword(
      input.password,
    );

  const user =
    await createUser({
      name:
        input.name.trim(),

      email:
        normalizedEmail,

      passwordHash,

      role:
        input.role,
    });

  /*
   * Only customer accounts participate in
   * customer-profile linking.
   */
  if (
    input.role ===
    "customer"
  ) {
    await linkPreExistingCustomerProfiles(
      user._id.toString(),
      normalizedEmail,
      input.phone,
      input.name,
    );
  }

  return user;
}

export async function loginUser(
  input: LoginInput,
) {
  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const user =
    await findUserByEmailWithPassword(
      normalizedEmail,
    );

  if (
    !user ||
    !user.isActive
  ) {
    throw new ApiError(
      401,
      "Invalid email or password.",
      "INVALID_CREDENTIALS",
    );
  }

  const passwordValid =
    await verifyPassword(
      user.passwordHash,
      input.password,
    );

  if (!passwordValid) {
    throw new ApiError(
      401,
      "Invalid email or password.",
      "INVALID_CREDENTIALS",
    );
  }

  const sessionToken =
    generateSessionToken();

  const tokenHash =
    hashSessionToken(
      sessionToken,
    );

  const expiresAt =
    new Date(
      Date.now() +
        SESSION_DURATION_MS,
    );

  await createSession({
    userId:
      user._id.toString(),

    tokenHash,

    expiresAt,
  });

  return {
    user,

    sessionToken,
  };
}

export async function deleteSession(
  sessionToken: string,
) {
  const tokenHash =
    hashSessionToken(
      sessionToken,
    );

  await deleteSessionByTokenHash(
    tokenHash,
  );
}