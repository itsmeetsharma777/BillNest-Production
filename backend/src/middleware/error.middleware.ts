import type {
  ErrorRequestHandler,
} from "express";

import { ZodError } from "zod";

import { ApiError } from "../utils/api-error";

function isBodyParserError(
  error: unknown,
): error is {
  type: string;
  status: number;
  message: string;
} {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const candidate =
    error as Record<string, unknown>;

  return (
    typeof candidate.type === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.message === "string"
  );
}

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  /**
   * Zod validation errors
   */
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid request data.",
      details: error.flatten(),
    });

    return;
  }

  /**
   * Application-level errors
   */
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && {
        details: error.details,
      }),
    });

    return;
  }

  /**
   * Express/body-parser errors.
   *
   * Keep internal parser details out of the
   * production response.
   */
  if (isBodyParserError(error)) {
    if (
      error.type ===
      "entity.too.large"
    ) {
      res.status(413).json({
        success: false,
        code: "PAYLOAD_TOO_LARGE",
        message:
          "Request payload is too large.",
      });

      return;
    }

    if (
      error.type ===
      "entity.parse.failed"
    ) {
      res.status(400).json({
        success: false,
        code: "INVALID_JSON",
        message:
          "The request contains invalid JSON.",
      });

      return;
    }
  }

  /**
   * Unexpected errors.
   *
   * Log the actual error server-side but never
   * expose stack traces or internal details to
   * clients.
   */
  console.error(
    "Unhandled error:",
    error,
  );

  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message:
      "An unexpected error occurred.",
  });
};