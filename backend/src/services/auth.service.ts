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
  role: "shopkeeper" | "customer";
}

interface LoginInput {
  email: string;
  password: string;
}

/**
 * After a customer creates a BillNest account,
 * automatically connect the account to a customer
 * profile that was previously created by a shopkeeper
 * using the same email address.
 *
 * We only auto-link when exactly one matching profile
 * exists. If multiple profiles use the same email,
 * we deliberately leave them unlinked rather than
 * attaching the account to the wrong shop.
 */
async function linkPreExistingCustomerProfile(
  userId: string,
  email: string,
) {
  const matchingCustomers =
    await findUnlinkedCustomersByEmail(email);

  if (matchingCustomers.length !== 1) {
    return;
  }

  await linkCustomerToUser(
    matchingCustomers[0]._id.toString(),
    userId,
  );
}

export async function registerUser(
  input: RegisterInput,
) {
  const normalizedEmail =
    input.email.trim().toLowerCase();

  const existingUser =
    await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  const user = await createUser({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: input.role,
  });

  /*
   * Only customer accounts participate in delayed
   * customer-profile linking.
   *
   * Shopkeeper registration remains completely
   * independent from customer records.
   */
  if (input.role === "customer") {
    await linkPreExistingCustomerProfile(
      user._id.toString(),
      normalizedEmail,
    );
  }

  return user;
}

export async function loginUser(
  input: LoginInput,
) {
  const normalizedEmail =
    input.email.trim().toLowerCase();

  const user =
    await findUserByEmailWithPassword(
      normalizedEmail,
    );

  if (!user || !user.isActive) {
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
    hashSessionToken(sessionToken);

  const expiresAt = new Date(
    Date.now() +
      SESSION_DURATION_MS,
  );

  await createSession({
    userId: user._id.toString(),
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
    hashSessionToken(sessionToken);

  await deleteSessionByTokenHash(
    tokenHash,
  );
}