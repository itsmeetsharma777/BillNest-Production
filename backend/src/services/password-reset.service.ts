import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";

import {
  createPasswordResetToken,
  deletePasswordResetTokensForUser,
  findPasswordResetTokenByHash,
  consumePasswordResetToken,
} from "../repositories/password-reset-token.repository";

import {
  findUserByEmail,
  findUserById,
  updateUserById,
} from "../repositories/user.repository";

import {
  deleteAllSessionsForUser,
} from "../repositories/session.repository";

import {
  sendPasswordResetEmail,
} from "./email.service";

import { ApiError } from "../utils/api-error";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

function hashResetToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function generateResetToken() {
  return randomBytes(32).toString("hex");
}

const invalidResetTokenError = () =>
  new ApiError(
    400,
    "This password reset link is invalid or has expired.",
    "INVALID_RESET_TOKEN",
  );

export async function requestPasswordReset(
  email: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await findUserByEmail(normalizedEmail);

  /**
   * Never reveal whether an email belongs
   * to a BillNest account.
   */
  const safeResponse = {
    success: true,
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };

  if (!user || !user.isActive) {
    return safeResponse;
  }

  /**
   * Only the newest reset token remains valid.
   */
  await deletePasswordResetTokensForUser(
    user.id,
  );

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);

  const expiresAt = new Date(
    Date.now() +
      RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetToken: rawToken,
  });

  return safeResponse;
}

export async function validatePasswordResetToken(
  rawToken: string,
) {
  const token = rawToken.trim();

  if (!token) {
    throw new ApiError(
      400,
      "Password reset token is required.",
      "RESET_TOKEN_REQUIRED",
    );
  }

  const tokenHash = hashResetToken(token);

  const resetToken =
    await findPasswordResetTokenByHash(
      tokenHash,
    );

  if (!resetToken) {
    throw invalidResetTokenError();
  }

  const user = await findUserById(
    resetToken.userId.toString(),
  );

  if (!user || !user.isActive) {
    throw invalidResetTokenError();
  }

  return {
    valid: true,
    expiresAt: resetToken.expiresAt,
  };
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
) {
  const token = rawToken.trim();

  if (!token) {
    throw new ApiError(
      400,
      "Password reset token is required.",
      "RESET_TOKEN_REQUIRED",
    );
  }

  const tokenHash = hashResetToken(token);

  /**
   * Atomically consume the token.
   *
   * If another request has already consumed it,
   * this returns null.
   */
  const resetToken =
    await consumePasswordResetToken(
      tokenHash,
    );

  if (!resetToken) {
    throw invalidResetTokenError();
  }

  const user = await findUserById(
    resetToken.userId.toString(),
  );

  if (!user || !user.isActive) {
    throw invalidResetTokenError();
  }

  const passwordHash =
    await argon2.hash(newPassword);

  await updateUserById(user.id, {
    passwordHash,
  });

  /**
   * Invalidate every existing login session
   * after a successful password reset.
   */
  await deleteAllSessionsForUser(user.id);

  return {
    success: true,
    message:
      "Your password has been reset successfully. You can now sign in.",
  };
}