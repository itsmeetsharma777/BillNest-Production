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
  findSingleUnlinkedCustomerByEmail,
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
 * Try to connect a customer account to an existing
 * unlinked customer profile using the account email.
 *
 * Linking is performed only when exactly one active
 * unlinked customer exists with that email.
 */
async function linkCustomerProfileIfPossible(
  userId: string,
  email: string,
) {
  const customer =
    await findSingleUnlinkedCustomerByEmail(
      email,
    );

  if (!customer) {
    return null;
  }

  return linkCustomerToUser(
    customer._id.toString(),
    userId,
  );
}

export async function registerUser(
  input: RegisterInput,
) {
  const normalizedEmail =
    input.email
      .trim()
      .toLowerCase();

  const normalizedName =
    input.name.trim();

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

  const user = await createUser({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: input.role,
  });

  /*
   * If this is a customer account and a shopkeeper
   * had already created a customer profile using
   * the same email, link the two records immediately.
   */
  if (input.role === "customer") {
    await linkCustomerProfileIfPossible(
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
    input.email
      .trim()
      .toLowerCase();

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

  /*
   * Repair an existing customer account that may
   * have been created before its shop customer
   * profile was linked.
   *
   * This makes the fix effective for existing
   * accounts as well as newly registered accounts.
   */
  if (user.role === "customer") {
    await linkCustomerProfileIfPossible(
      user._id.toString(),
      normalizedEmail,
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