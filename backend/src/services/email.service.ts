import { Resend } from "resend";

import { env } from "../config/env";

const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface PasswordResetEmailInput {
  to: string;
  name: string;
  resetToken: string;
}

export async function sendEmail(
  input: SendEmailInput,
) {
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY is not configured. Email was not sent.",
    );

    return {
      success: false,
      skipped: true,
    };
  }

  if (!env.EMAIL_FROM) {
    console.warn(
      "[Email] EMAIL_FROM is not configured. Email was not sent.",
    );

    return {
      success: false,
      skipped: true,
    };
  }

  const { data, error } =
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text
        ? {
            text: input.text,
          }
        : {}),
    });

  if (error) {
    console.error(
      "[Email] Resend error:",
      error,
    );

    return {
      success: false,
      skipped: false,
      error,
    };
  }

  return {
    success: true,
    skipped: false,
    data,
  };
}

function escapeHtml(
  value: string,
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
) {
  const safeName =
    escapeHtml(input.name);

  const resetUrl =
    `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(input.resetToken)}`;

  const safeResetUrl =
    escapeHtml(resetUrl);

  const subject =
    "Reset your BillNest password";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your BillNest password</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fa;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background:#f5f7fa;
      padding:32px 16px;
    "
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
          "
        >

          <tr>
            <td
              style="
                padding:24px 32px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              <div
                style="
                  font-size:24px;
                  font-weight:700;
                  color:#111827;
                "
              >
                BillNest
              </div>

              <div
                style="
                  margin-top:4px;
                  font-size:13px;
                  color:#6b7280;
                "
              >
                Billing &amp; Warranty Management
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:32px;
                color:#111827;
              "
            >
              <h1
                style="
                  margin:0 0 20px;
                  font-size:24px;
                  line-height:1.3;
                "
              >
                Reset your password
              </h1>

              <p
                style="
                  margin:0 0 16px;
                  font-size:15px;
                  line-height:1.7;
                  color:#4b5563;
                "
              >
                Hello ${safeName},
              </p>

              <p
                style="
                  margin:0 0 16px;
                  font-size:15px;
                  line-height:1.7;
                  color:#4b5563;
                "
              >
                We received a request to reset
                your BillNest password.
              </p>

              <p
                style="
                  margin:0 0 24px;
                  font-size:15px;
                  line-height:1.7;
                  color:#4b5563;
                "
              >
                Click the button below to choose
                a new password.
              </p>

              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin-bottom:24px;"
              >
                <tr>
                  <td
                    style="
                      border-radius:8px;
                      background:#111827;
                    "
                  >
                    <a
                      href="${safeResetUrl}"
                      style="
                        display:inline-block;
                        padding:13px 22px;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:14px;
                        font-weight:600;
                      "
                    >
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:0 0 12px;
                  font-size:13px;
                  line-height:1.6;
                  color:#6b7280;
                "
              >
                If the button doesn't work, copy
                and paste this link into your browser:
              </p>

              <p
                style="
                  margin:0;
                  word-break:break-all;
                  font-size:13px;
                  line-height:1.6;
                  color:#374151;
                "
              >
                ${safeResetUrl}
              </p>

              <p
                style="
                  margin:24px 0 0;
                  font-size:13px;
                  line-height:1.6;
                  color:#6b7280;
                "
              >
                If you didn't request a password
                reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 32px;
                background:#f9fafb;
                border-top:1px solid #e5e7eb;
                color:#6b7280;
                font-size:12px;
                line-height:1.6;
              "
            >
              This is an automated message from BillNest.
              Please do not reply to this email.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Reset your BillNest password

Hello ${input.name},

We received a request to reset your BillNest password.

Use this link to choose a new password:

${resetUrl}

If you didn't request a password reset,
you can safely ignore this email.

This is an automated message from BillNest.
  `.trim();

  return sendEmail({
    to: input.to,
    subject,
    html,
    text,
  });
}