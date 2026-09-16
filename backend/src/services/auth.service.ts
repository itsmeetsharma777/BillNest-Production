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
  createShop,
} from "../repositories/shop.repository";

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

export async function registerUser(input: RegisterInput) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists.",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });

  /*
   * Every shopkeeper must have exactly one shop.
   *
   * The registration form currently does not collect shop
   * information, so create a sensible default name that the
   * shopkeeper can change later from Settings.
   */
  if (input.role === "shopkeeper") {
    await createShop({
      ownerId: user._id.toString(),
      name: `${input.name.trim()}'s Store`,
    });
  }

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmailWithPassword(input.email);

  if (!user || !user.isActive) {
    throw new ApiError(
      401,
      "Invalid email or password.",
      "INVALID_CREDENTIALS",
    );
  }

  const passwordValid = await verifyPassword(
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

  const sessionToken = generateSessionToken();
  const tokenHash = hashSessionToken(sessionToken);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS,
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

export async function deleteSession(sessionToken: string) {
  const tokenHash = hashSessionToken(sessionToken);

  await deleteSessionByTokenHash(tokenHash);
}