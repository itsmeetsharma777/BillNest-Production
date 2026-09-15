import { env } from "../config/env";

interface SendPasswordResetEmailInput {
  to: string;
  name: string;
  resetToken: string;
}

function buildResetUrl(token: string) {
  const url = new URL("/reset-password", env.FRONTEND_URL);
  url.searchParams.set("token", token);

  return url.toString();
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: SendPasswordResetEmailInput) {
  /*
   * Resend is optional during local development.
   *
   * If the credentials aren't configured yet, log the reset URL
   * locally so we can test the complete flow without sending email.
   */
  const resetUrl = buildResetUrl(resetToken);

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(
      `[BillNest] Password reset link for ${to}: ${resetUrl}`,
    );

    return;
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject: "Reset your BillNest password",
        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:40px auto;padding:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
                <h1 style="margin:0 0 16px;font-size:24px;color:#0f172a;">
                  Reset your BillNest password
                </h1>

                <p style="color:#475569;font-size:16px;line-height:1.6;">
                  Hi ${escapeHtml(name)},
                </p>

                <p style="color:#475569;font-size:16px;line-height:1.6;">
                  We received a request to reset your BillNest password.
                  Click the button below to create a new password.
                </p>

                <div style="margin:32px 0;">
                  <a
                    href="${resetUrl}"
                    style="display:inline-block;padding:12px 20px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;"
                  >
                    Reset password
                  </a>
                </div>

                <p style="color:#64748b;font-size:14px;line-height:1.6;">
                  This link expires in 30 minutes and can only be used once.
                </p>

                <p style="color:#64748b;font-size:14px;line-height:1.6;">
                  If you didn't request a password reset, you can safely ignore
                  this email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "[BillNest] Failed to send password reset email:",
      errorBody,
    );

    throw new Error(
      "Unable to send the password reset email.",
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}