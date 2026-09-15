import type { NextFunction, Request, Response } from "express";

import {
  findSessionByTokenHash,
} from "../repositories/session.repository";

import {
  findUserById,
} from "../repositories/user.repository";

import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "../utils/session";

import { ApiError } from "../utils/api-error";

export interface AuthenticatedRequest
  extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: "shopkeeper" | "customer";
    isActive: boolean;
    emailVerified: boolean;
  };
  sessionId: string;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const sessionToken =
    req.cookies?.[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return next(
      new ApiError(
        401,
        "Authentication required.",
        "AUTHENTICATION_REQUIRED",
      ),
    );
  }

  const tokenHash =
    hashSessionToken(sessionToken);

  const session =
    await findSessionByTokenHash(tokenHash);

  if (!session) {
    return next(
      new ApiError(
        401,
        "Session is invalid or expired.",
        "INVALID_SESSION",
      ),
    );
  }

  const user = await findUserById(
    session.userId.toString(),
  );

  if (!user || !user.isActive) {
    return next(
      new ApiError(
        401,
        "User account is unavailable.",
        "USER_UNAVAILABLE",
      ),
    );
  }

  const authenticatedRequest =
    req as AuthenticatedRequest;

  authenticatedRequest.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
  };

  authenticatedRequest.sessionId =
    session._id.toString();

  next();
}