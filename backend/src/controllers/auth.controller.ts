import type { Request, Response } from "express";

import {
  loginUser,
  registerUser,
  deleteSession,
} from "../services/auth.service";

import {
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "../utils/session";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

/**
 * Remove sensitive fields before returning a user
 * to the frontend.
 */
function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: "shopkeeper" | "customer";
  isActive: boolean;
  emailVerified: boolean;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
  };
}

/**
 * Configure the secure HTTP-only session cookie.
 *
 * Production:
 * - Vercel frontend and Render backend are different sites.
 * - SameSite=None is required for the cross-site API request.
 * - Secure=true is required when SameSite=None is used.
 *
 * Development:
 * - localhost frontend/backend can continue using lax cookies.
 */
function setSessionCookie(
  res: Response,
  sessionToken: string,
) {
  const isProduction =
    process.env.NODE_ENV === "production";

  res.cookie(
    SESSION_COOKIE_NAME,
    sessionToken,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: SESSION_DURATION_MS,
      path: "/",

      ...(process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN,
      }),
    },
  );
}

/**
 * Register a new user.
 */
export async function register(
  req: Request,
  res: Response,
) {
  const input = registerSchema.parse(req.body);

  const user = await registerUser(input);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: {
      user: sanitizeUser(user),
    },
  });
}

/**
 * Login an existing user.
 */
export async function login(
  req: Request,
  res: Response,
) {
  const input = loginSchema.parse(req.body);

  const {
    user,
    sessionToken,
  } = await loginUser(input);

  setSessionCookie(
    res,
    sessionToken,
  );

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: sanitizeUser(user),
    },
  });
}

/**
 * Logout the current user.
 */
export async function logout(
  req: Request,
  res: Response,
) {
  const sessionToken =
    req.cookies?.[SESSION_COOKIE_NAME];

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  const isProduction =
    process.env.NODE_ENV === "production";

  res.clearCookie(
    SESSION_COOKIE_NAME,
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",

      ...(process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN,
      }),
    },
  );

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * Get the currently authenticated user.
 *
 * requireAuth runs before this controller and
 * attaches the authenticated user to the request.
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
) {
  const authenticatedRequest =
    req as AuthenticatedRequest;

  res.status(200).json({
    success: true,
    data: {
      user: authenticatedRequest.user,
    },
  });
}