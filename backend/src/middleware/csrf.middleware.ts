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
   * All state-changing endpoints in this API are
   * browser-session endpoints. Reject requests that
   * omit Origin rather than treating a missing header
   * as a CSRF bypass. Server-to-server integrations
   * must use a dedicated signed endpoint.
   */
  const origin = req.get("origin");

  if (!origin) {
    return next(
      new ApiError(
        403,
        "Origin header is required for state-changing requests.",
        "CSRF_ORIGIN_REQUIRED",
      ),
    );
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