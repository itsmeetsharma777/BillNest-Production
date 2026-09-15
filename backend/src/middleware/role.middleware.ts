import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";
import type { AuthenticatedRequest } from "./auth.middleware";

export type UserRole = "shopkeeper" | "customer";

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.user) {
      return next(
        new ApiError(
          401,
          "Authentication required.",
          "AUTHENTICATION_REQUIRED",
        ),
      );
    }

    if (!allowedRoles.includes(authenticatedRequest.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to access this resource.",
          "FORBIDDEN",
        ),
      );
    }

    next();
  };
}