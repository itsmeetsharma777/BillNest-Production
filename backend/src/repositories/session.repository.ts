import { Types } from "mongoose";

import { SessionModel } from "../models/session.model";

export async function createSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return SessionModel.create({
    userId: new Types.ObjectId(data.userId),
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
  });
}

export async function findSessionByTokenHash(tokenHash: string) {
  return SessionModel.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  return SessionModel.deleteOne({ tokenHash });
}

export async function deleteAllSessionsForUser(userId: string) {
  return SessionModel.deleteMany({
    userId: new Types.ObjectId(userId),
  });
}

export async function deleteExpiredSessions() {
  return SessionModel.deleteMany({
    expiresAt: { $lte: new Date() },
  });
}