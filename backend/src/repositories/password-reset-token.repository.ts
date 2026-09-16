import { Types } from "mongoose";

import {
  PasswordResetTokenModel,
} from "../models/password-reset-token.model";

export async function createPasswordResetToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return PasswordResetTokenModel.create({
    userId: new Types.ObjectId(data.userId),
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
  });
}

export async function findPasswordResetTokenByHash(
  tokenHash: string,
) {
  return PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: {
      $exists: false,
    },
    expiresAt: {
      $gt: new Date(),
    },
  });
}

/**
 * Atomically consumes a reset token.
 *
 * The token is only marked as used if it is still:
 * - unused
 * - unexpired
 * - associated with the supplied hash
 *
 * This prevents the same reset token from being
 * successfully consumed by concurrent requests.
 */
export async function consumePasswordResetToken(
  tokenHash: string,
) {
  return PasswordResetTokenModel.findOneAndUpdate(
    {
      tokenHash,
      usedAt: {
        $exists: false,
      },
      expiresAt: {
        $gt: new Date(),
      },
    },
    {
      $set: {
        usedAt: new Date(),
      },
    },
    {
      new: true,
    },
  );
}

export async function deletePasswordResetTokensForUser(
  userId: string,
) {
  return PasswordResetTokenModel.deleteMany({
    userId: new Types.ObjectId(userId),
  });
}

export async function markPasswordResetTokenUsed(
  tokenId: string,
) {
  return PasswordResetTokenModel.findByIdAndUpdate(
    tokenId,
    {
      $set: {
        usedAt: new Date(),
      },
    },
    {
      new: true,
    },
  );
}