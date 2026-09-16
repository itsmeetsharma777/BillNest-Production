import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getShopForOwner } from "../services/shop.service";
import { generateInvoicePdf } from "../services/invoice-pdf.service";
import { ApiError } from "../utils/api-error";

export async function downloadInvoicePdf(
  req: AuthenticatedRequest,
  res: Response,
) {
  const invoiceIdParam = req.params.invoiceId;

  if (
    typeof invoiceIdParam !== "string" ||
    !invoiceIdParam.trim()
  ) {
    throw new ApiError(
      400,
      "Invoice ID is required.",
      "INVOICE_ID_REQUIRED",
    );
  }

  const shop = await getShopForOwner(
    req.user.id,
  );

  const {
    document,
    invoiceNumber,
  } = await generateInvoicePdf(
    invoiceIdParam,
    shop._id.toString(),
  );

  const safeInvoiceNumber =
    invoiceNumber.replace(
      /[^a-zA-Z0-9-_]/g,
      "_",
    );

  const filename =
    `invoice-${safeInvoiceNumber}.pdf`;

  res.setHeader(
    "Content-Type",
    "application/pdf",
  );

  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filename}"`,
  );

  document.pipe(res);
  document.end();
}