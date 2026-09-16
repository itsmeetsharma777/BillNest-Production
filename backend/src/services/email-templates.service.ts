interface EmailLayoutInput {
  title: string;
  previewText?: string;
  content: string;
}

function escapeHtml(
  value: string,
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createEmailLayout(
  input: EmailLayoutInput,
) {
  const previewText =
    input.previewText
      ? escapeHtml(
          input.previewText,
        )
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>${escapeHtml(
    input.title,
  )}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fa;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
    "
  >
    ${previewText}
  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f5f7fa;padding:32px 16px;"
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
                Billing & Warranty Management
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
                ${escapeHtml(
                  input.title,
                )}
              </h1>

              ${input.content}

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
}

export function createSimpleNotificationEmail(
  title: string,
  message: string,
) {
  return createEmailLayout({
    title,

    previewText:
      message,

    content: `
      <p
        style="
          margin:0;
          font-size:16px;
          line-height:1.7;
          color:#374151;
        "
      >
        ${escapeHtml(
          message,
        )}
      </p>
    `,
  });
}

export function createInvoiceEmail(
  input: {
    customerName: string;
    shopName: string;
    invoiceNumber: string;
    total: string;
    status: string;
  },
) {
  return createEmailLayout({
    title:
      "Invoice Update",

    previewText:
      `Invoice ${input.invoiceNumber} from ${input.shopName}`,

    content: `
      <p
        style="
          margin:0 0 20px;
          font-size:16px;
          color:#374151;
        "
      >
        Hello ${escapeHtml(
          input.customerName,
        )},
      </p>

      <p
        style="
          margin:0 0 24px;
          font-size:15px;
          line-height:1.7;
          color:#4b5563;
        "
      >
        Here is an update regarding your invoice
        from ${escapeHtml(
          input.shopName,
        )}.
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border-collapse:collapse;
          margin-bottom:24px;
        "
      >
        <tr>
          <td
            style="
              padding:12px 0;
              color:#6b7280;
              border-bottom:1px solid #e5e7eb;
            "
          >
            Invoice
          </td>

          <td
            align="right"
            style="
              padding:12px 0;
              font-weight:600;
              border-bottom:1px solid #e5e7eb;
            "
          >
            ${escapeHtml(
              input.invoiceNumber,
            )}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px 0;
              color:#6b7280;
              border-bottom:1px solid #e5e7eb;
            "
          >
            Total
          </td>

          <td
            align="right"
            style="
              padding:12px 0;
              font-weight:600;
              border-bottom:1px solid #e5e7eb;
            "
          >
            ${escapeHtml(
              input.total,
            )}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px 0;
              color:#6b7280;
            "
          >
            Status
          </td>

          <td
            align="right"
            style="
              padding:12px 0;
              font-weight:600;
            "
          >
            ${escapeHtml(
              input.status,
            )}
          </td>
        </tr>
      </table>
    `,
  });
}

export function createWarrantyEmail(
  input: {
    customerName: string;
    productName: string;
    expiryDate: string;
    message: string;
  },
) {
  return createEmailLayout({
    title:
      "Warranty Update",

    previewText:
      input.message,

    content: `
      <p
        style="
          margin:0 0 20px;
          font-size:16px;
          color:#374151;
        "
      >
        Hello ${escapeHtml(
          input.customerName,
        )},
      </p>

      <p
        style="
          margin:0 0 24px;
          font-size:15px;
          line-height:1.7;
          color:#4b5563;
        "
      >
        ${escapeHtml(
          input.message,
        )}
      </p>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border-collapse:collapse;
        "
      >
        <tr>
          <td
            style="
              padding:12px 0;
              color:#6b7280;
              border-bottom:1px solid #e5e7eb;
            "
          >
            Product
          </td>

          <td
            align="right"
            style="
              padding:12px 0;
              font-weight:600;
              border-bottom:1px solid #e5e7eb;
            "
          >
            ${escapeHtml(
              input.productName,
            )}
          </td>
        </tr>

        <tr>
          <td
            style="
              padding:12px 0;
              color:#6b7280;
            "
          >
            Warranty expiry
          </td>

          <td
            align="right"
            style="
              padding:12px 0;
              font-weight:600;
            "
          >
            ${escapeHtml(
              input.expiryDate,
            )}
          </td>
        </tr>
      </table>
    `,
  });
}