import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "billnest_session";

export const SESSION_DURATION_MS =
  1000 * 60 * 60 * 24 * 7;

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}