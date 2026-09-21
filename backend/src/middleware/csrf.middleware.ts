import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

const STATE_CHANGING_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function normalizeOrigin(
  origin: string,
) {
  return origin.replace(/\/+$/, "");
}

export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  /**
   * GET, HEAD and OPTIONS requests do not
   * modify application state, so CSRF origin
   * validation is not required for them.
   */
  if (
    !STATE_CHANGING_METHODS.has(
      req.method.toUpperCase(),
    )
  ) {
    return next();
  }

  /**
   * Requests without an Origin header can be
   * legitimate server-to-server requests,
   * curl requests, CLI requests, etc.
   *
   * Browser cross-origin requests normally
   * include Origin.
   */
  const origin = req.get("origin");

  if (!origin) {
    return next();
  }

  const configuredOrigin =
    normalizeOrigin(env.FRONTEND_URL);

  const requestOrigin =
    normalizeOrigin(origin);

  /**
   * Only the configured BillNest frontend
   * is allowed to perform state-changing
   * browser requests.
   */
  if (requestOrigin !== configuredOrigin) {
    return next(
      new ApiError(
        403,
        "Request origin is not allowed.",
        "CSRF_ORIGIN_REJECTED",
      ),
    );
  }

  return next();
}