import crypto from "crypto";

import { env } from "../config/env";

export function createWarrantyPublicToken(
  warrantyId: string,
): string {
  return crypto
    .createHmac(
      "sha256",
      env.SESSION_SECRET,
    )
    .update(warrantyId)
    .digest("hex");
}

export function verifyWarrantyPublicToken(
  warrantyId: string,
  token: string,
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return false;
  }

  const expected =
    createWarrantyPublicToken(
      warrantyId,
    );

  return crypto.timingSafeEqual(
    Buffer.from(token, "utf8"),
    Buffer.from(expected, "utf8"),
  );
}
