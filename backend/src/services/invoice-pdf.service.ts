import PDFDocument from "pdfkit";

import {
  findInvoiceByIdForShop,
  findInvoiceItems,
} from "../repositories/invoice.repository";

import { findCustomerByIdForShop } from "../repositories/customer.repository";

import { findShopById } from "../repositories/shop.repository";

import { ApiError } from "../utils/api-error";

type PdfAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

type PdfItem = {
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTax: number;
  lineTotal: number;
};

type InvoiceHeaderData = {
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date | null;
  status: string;
};

type ShopPdfData = {
  name: string;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  address?: PdfAddress | null;
};

type CustomerPdfData = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: PdfAddress | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 28;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const FOOTER_Y = PAGE_HEIGHT - 30;

const CONTENT_BOTTOM = 780;

const TABLE_HEADER_HEIGHT = 28;

const COLORS = {
  text: "#111111",
  muted: "#555555",
  border: "#333333",
  background: "#f4f4f4",
};

function formatMoney(value: number): string {
  return `INR ${value.toFixed(2)}`;
}

function formatDate(
  date?: Date | string | null,
): string {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(date));
}

function formatStatus(
  status: string,
): string {
  const labels: Record<string, string> = {
    draft: "DRAFT",
    paid: "PAID",
    partially_paid: "PARTIALLY PAID",
    cancelled: "CANCELLED",
  };

  return (
    labels[status] ??
    status.toUpperCase()
  );
}

function formatPaymentMethod(
  method?: string | null,
): string {
  if (!method) {
    return "-";
  }

  const labels: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank Transfer",
    credit: "Credit",
  };

  return (
    labels[method] ??
    method
  );
}

function drawBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .rect(
      x,
      y,
      width,
      height,
    )
    .stroke();
}

function drawFilledBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc
    .fillColor(COLORS.background)
    .rect(
      x,
      y,
      width,
      height,
    )
    .fill();

  doc
    .fillColor(COLORS.text)
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .rect(
      x,
      y,
      width,
      height,
    )
    .stroke();
}

function drawCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options?: {
    bold?: boolean;
    align?: "left" | "center" | "right";
    fontSize?: number;
    padding?: number;
  },
) {
  const padding =
    options?.padding ?? 5;

  drawBox(
    doc,
    x,
    y,
    width,
    height,
  );

  doc
    .font(
      options?.bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(
      options?.fontSize ?? 8,
    )
    .fillColor(COLORS.text);

  const textHeight =
    doc.heightOfString(
      text,
      {
        width:
          width - padding * 2,
        lineGap: 1,
      },
    );

  const verticalOffset =
    Math.max(
      padding,
      (height - textHeight) / 2,
    );

  doc.text(
    text,
    x + padding,
    y + verticalOffset,
    {
      width:
        width - padding * 2,
      height:
        height - verticalOffset,
      align:
        options?.align ?? "left",
      lineGap: 1,
    },
  );
}

function drawHorizontalLine(
  doc: PDFKit.PDFDocument,
  y: number,
) {
  doc
    .moveTo(
      MARGIN,
      y,
    )
    .lineTo(
      PAGE_WIDTH - MARGIN,
      y,
    )
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();
}

function drawAddress(
  doc: PDFKit.PDFDocument,
  address?: PdfAddress | null,
) {
  if (!address) {
    return;
  }

  const lines = [
    address.line1,
    address.line2,
    [
      address.city,
      address.state,
    ]
      .filter(Boolean)
      .join(", "),
    address.postalCode,
    address.country,
  ].filter(
    (line): line is string =>
      typeof line === "string" &&
      line.trim().length > 0,
  );

  for (const line of lines) {
    doc.text(line);
  }
}

function addressToString(
  address?: PdfAddress | null,
): string {
  if (!address) {
    return "-";
  }

  return [
    address.line1,
    address.line2,
    [
      address.city,
      address.state,
    ]
      .filter(Boolean)
      .join(", "),
    address.postalCode,
    address.country,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .join(", ");
}

function numberToWords(
  number: number,
): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function belowThousand(
    value: number,
  ): string {
    let result = "";

    if (value >= 100) {
      result +=
        `${ones[Math.floor(value / 100)]} Hundred`;

      value %= 100;

      if (value > 0) {
        result += " ";
      }
    }

    if (value >= 20) {
      result +=
        tens[Math.floor(value / 10)];

      value %= 10;

      if (value > 0) {
        result +=
          ` ${ones[value]}`;
      }
    } else if (value > 0) {
      result += ones[value];
    }

    return result;
  }

  if (number === 0) {
    return "Zero";
  }

  const integerPart =
    Math.floor(number);

  const crore =
    Math.floor(
      integerPart / 10000000,
    );

  const lakh =
    Math.floor(
      (integerPart % 10000000) /
        100000,
    );

  const thousand =
    Math.floor(
      (integerPart % 100000) /
        1000,
    );

  const remainder =
    integerPart % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(
      `${belowThousand(crore)} Crore`,
    );
  }

  if (lakh > 0) {
    parts.push(
      `${belowThousand(lakh)} Lakh`,
    );
  }

  if (thousand > 0) {
    parts.push(
      `${belowThousand(thousand)} Thousand`,
    );
  }

  if (remainder > 0) {
    parts.push(
      belowThousand(remainder),
    );
  }

  return parts.join(" ");
}

function amountInWords(
  amount: number,
): string {
  const rounded =
    Math.round(
      amount * 100,
    ) / 100;

  const rupees =
    Math.floor(rounded);

  const paise =
    Math.round(
      (rounded - rupees) * 100,
    );

  let result =
    `Rupees ${numberToWords(rupees)}`;

  if (paise > 0) {
    result +=
      ` and ${numberToWords(paise)} Paise`;
  }

  return `${result} Only`;
}

function drawPageFooter(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  totalPages: number,
) {
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text(
      `Generated by BillNest  •  Page ${pageNumber} of ${totalPages}`,
      MARGIN,
      FOOTER_Y,
      {
        width: CONTENT_WIDTH,
        align: "center",
        lineBreak: false,
      },
    );
}

function drawInvoiceHeader(
  doc: PDFKit.PDFDocument,
  shop: ShopPdfData,
  invoice: InvoiceHeaderData,
): number {
  let y = MARGIN;

  /*
   * TOP STRIP
   */

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.text);

  doc.text(
    "ORIGINAL FOR RECIPIENT",
    MARGIN,
    y + 4,
    {
      width: 150,
    },
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(
      "TAX INVOICE",
      MARGIN,
      y + 1,
      {
        width: CONTENT_WIDTH,
        align: "center",
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .text(
      "BillNest Invoice",
      PAGE_WIDTH - MARGIN - 100,
      y + 4,
      {
        width: 100,
        align: "right",
      },
    );

  y += 18;

  /*
   * COMPANY HEADER
   */

  const headerHeight = 92;

  const logoWidth = 70;

  drawBox(
    doc,
    MARGIN,
    y,
    logoWidth,
    headerHeight,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      "LOGO",
      MARGIN,
      y + 39,
      {
        width: logoWidth,
        align: "center",
      },
    );

  const companyX =
    MARGIN + logoWidth;

  const companyWidth =
    CONTENT_WIDTH - logoWidth;

  drawBox(
    doc,
    companyX,
    y,
    companyWidth,
    headerHeight,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(
      shop.name,
      companyX + 8,
      y + 8,
      {
        width:
          companyWidth - 16,
        align: "center",
      },
    );

  let companyY =
    y + 30;

  doc
    .font("Helvetica")
    .fontSize(8);

  if (shop.address) {
    const address =
      addressToString(
        shop.address,
      );

    doc.text(
      address,
      companyX + 35,
      companyY,
      {
        width:
          companyWidth - 70,
        align: "center",
      },
    );

    companyY += 25;
  }

  const contactParts = [
    shop.phone
      ? `Mobile: ${shop.phone}`
      : null,
    shop.email
      ? `Email: ${shop.email}`
      : null,
    shop.taxId
      ? `Tax ID: ${shop.taxId}`
      : null,
  ].filter(
    (value): value is string =>
      typeof value === "string",
  );

  if (contactParts.length > 0) {
    doc.text(
      contactParts.join("  |  "),
      companyX + 15,
      companyY,
      {
        width:
          companyWidth - 30,
        align: "center",
      },
    );
  }

  y += headerHeight;

  /*
   * INVOICE INFORMATION
   */

  const leftWidth =
    CONTENT_WIDTH * 0.56;

  const rightWidth =
    CONTENT_WIDTH - leftWidth;

  const rowHeight = 33;

  drawCell(
    doc,
    MARGIN,
    y,
    leftWidth / 2,
    rowHeight,
    `Invoice Number\n${invoice.invoiceNumber}`,
    {
      fontSize: 8,
    },
  );

  drawCell(
    doc,
    MARGIN + leftWidth / 2,
    y,
    leftWidth / 2,
    rowHeight,
    `Invoice Date\n${formatDate(
      invoice.issueDate,
    )}`,
    {
      fontSize: 8,
    },
  );

  drawCell(
    doc,
    MARGIN + leftWidth,
    y,
    rightWidth / 2,
    rowHeight,
    `Due Date\n${formatDate(
      invoice.dueDate,
    )}`,
    {
      fontSize: 8,
    },
  );

  drawCell(
    doc,
    MARGIN +
      leftWidth +
      rightWidth / 2,
    y,
    rightWidth / 2,
    rowHeight,
    `Status\n${formatStatus(
      invoice.status,
    )}`,
    {
      bold: true,
      fontSize: 8,
      align: "center",
    },
  );

  y += rowHeight;

  drawCell(
    doc,
    MARGIN,
    y,
    CONTENT_WIDTH,
    rowHeight,
    `Invoice Reference: ${invoice.invoiceNumber}`,
    {
      fontSize: 8,
    },
  );

  return y + rowHeight;
}

function drawCustomerSections(
  doc: PDFKit.PDFDocument,
  customer: CustomerPdfData,
  y: number,
): number {
  const sectionHeight = 92;

  const halfWidth =
    CONTENT_WIDTH / 2;

  /*
   * BILLING DETAILS
   */

  drawFilledBox(
    doc,
    MARGIN,
    y,
    halfWidth,
    20,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(
      "BILLING DETAILS",
      MARGIN + 6,
      y + 6,
      {
        width:
          halfWidth - 12,
      },
    );

  drawBox(
    doc,
    MARGIN,
    y + 20,
    halfWidth,
    sectionHeight - 20,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      customer.name,
      MARGIN + 8,
      y + 29,
      {
        width:
          halfWidth - 16,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7.5);

  let billingY =
    y + 44;

  if (customer.phone) {
    doc.text(
      `Mobile: ${customer.phone}`,
      MARGIN + 8,
      billingY,
      {
        width:
          halfWidth - 16,
      },
    );

    billingY += 12;
  }

  if (customer.email) {
    doc.text(
      `Email: ${customer.email}`,
      MARGIN + 8,
      billingY,
      {
        width:
          halfWidth - 16,
      },
    );

    billingY += 12;
  }

  doc.text(
    addressToString(
      customer.address,
    ),
    MARGIN + 8,
    billingY,
    {
      width:
        halfWidth - 16,
    },
  );

  /*
   * SHIPPING DETAILS
   */

  const shippingX =
    MARGIN + halfWidth;

  drawFilledBox(
    doc,
    shippingX,
    y,
    halfWidth,
    20,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "SHIPPING DETAILS",
      shippingX + 6,
      y + 6,
      {
        width:
          halfWidth - 12,
      },
    );

  drawBox(
    doc,
    shippingX,
    y + 20,
    halfWidth,
    sectionHeight - 20,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      customer.name,
      shippingX + 8,
      y + 29,
      {
        width:
          halfWidth - 16,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      addressToString(
        customer.address,
      ),
      shippingX + 8,
      y + 44,
      {
        width:
          halfWidth - 16,
      },
    );

  return y + sectionHeight;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
) {
  const columns = [
    {
      label: "Sr.",
      x: MARGIN,
      width: 28,
      align: "center" as const,
    },
    {
      label: "Item Description",
      x: MARGIN + 28,
      width: 155,
      align: "left" as const,
    },
    {
      label: "HSN/SAC",
      x: MARGIN + 183,
      width: 58,
      align: "center" as const,
    },
    {
      label: "Qty",
      x: MARGIN + 241,
      width: 42,
      align: "center" as const,
    },
    {
      label: "Unit",
      x: MARGIN + 283,
      width: 42,
      align: "center" as const,
    },
    {
      label: "Rate",
      x: MARGIN + 325,
      width: 67,
      align: "right" as const,
    },
    {
      label: "Disc.",
      x: MARGIN + 392,
      width: 50,
      align: "right" as const,
    },
    {
      label: "Tax %",
      x: MARGIN + 442,
      width: 45,
      align: "right" as const,
    },
    {
      label: "Amount",
      x: MARGIN + 487,
      width:
        CONTENT_WIDTH - 487,
      align: "right" as const,
    },
  ];

  for (const column of columns) {
    drawCell(
      doc,
      column.x,
      y,
      column.width,
      TABLE_HEADER_HEIGHT,
      column.label,
      {
        bold: true,
        align: column.align,
        fontSize: 7,
        padding: 3,
      },
    );
  }
}

function calculateRowHeight(
  doc: PDFKit.PDFDocument,
  item: PdfItem,
): number {
  const itemText = item.sku
    ? `${item.productName}\nSKU: ${item.sku}`
    : item.productName;

  doc
    .font("Helvetica")
    .fontSize(7);

  const height =
    doc.heightOfString(
      itemText,
      {
        width: 145,
        lineGap: 1,
      },
    );

  return Math.max(
    30,
    height + 10,
  );
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  item: PdfItem,
  index: number,
  y: number,
  height: number,
) {
  const values = [
    {
      text: String(index),
      x: MARGIN,
      width: 28,
      align: "center" as const,
    },
    {
      text: item.sku
        ? `${item.productName}\nSKU: ${item.sku}`
        : item.productName,
      x: MARGIN + 28,
      width: 155,
      align: "left" as const,
    },
    {
      text: "-",
      x: MARGIN + 183,
      width: 58,
      align: "center" as const,
    },
    {
      text: String(item.quantity),
      x: MARGIN + 241,
      width: 42,
      align: "center" as const,
    },
    {
      text: "-",
      x: MARGIN + 283,
      width: 42,
      align: "center" as const,
    },
    {
      text: formatMoney(
        item.unitPrice,
      ),
      x: MARGIN + 325,
      width: 67,
      align: "right" as const,
    },
    {
      text: formatMoney(
        item.discount,
      ),
      x: MARGIN + 392,
      width: 50,
      align: "right" as const,
    },
    {
      text:
        `${item.taxRate.toFixed(2)}%`,
      x: MARGIN + 442,
      width: 45,
      align: "right" as const,
    },
    {
      text: formatMoney(
        item.lineTotal,
      ),
      x: MARGIN + 487,
      width:
        CONTENT_WIDTH - 487,
      align: "right" as const,
    },
  ];

  for (const value of values) {
    drawCell(
      doc,
      value.x,
      y,
      value.width,
      height,
      value.text,
      {
        align: value.align,
        fontSize: 7,
        padding: 3,
      },
    );
  }
}

function drawTotals(
  doc: PDFKit.PDFDocument,
  invoice: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    amountPaid: number;
    amountDue: number;
  },
  y: number,
): number {
  const leftWidth =
    CONTENT_WIDTH * 0.62;

  const rightWidth =
    CONTENT_WIDTH - leftWidth;

  const boxHeight = 118;

  /*
   * AMOUNT IN WORDS
   */

  drawBox(
    doc,
    MARGIN,
    y,
    leftWidth,
    boxHeight,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "TOTAL AMOUNT IN WORDS",
      MARGIN + 8,
      y + 8,
      {
        width:
          leftWidth - 16,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(
      amountInWords(
        invoice.total,
      ),
      MARGIN + 8,
      y + 25,
      {
        width:
          leftWidth - 16,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "Payment Summary",
      MARGIN + 8,
      y + 55,
      {
        width:
          leftWidth - 16,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `Paid: ${formatMoney(
        invoice.amountPaid,
      )}`,
      MARGIN + 8,
      y + 71,
    );

  doc.text(
    `Balance Due: ${formatMoney(
      invoice.amountDue,
    )}`,
    MARGIN + 8,
    y + 86,
  );

  /*
   * TOTALS BOX
   */

  const totalsX =
    MARGIN + leftWidth;

  drawBox(
    doc,
    totalsX,
    y,
    rightWidth,
    boxHeight,
  );

  const rows = [
    {
      label: "Subtotal",
      value: formatMoney(
        invoice.subtotal,
      ),
      height: 21,
      bold: false,
    },
    {
      label: "Discount",
      value: formatMoney(
        invoice.discount,
      ),
      height: 21,
      bold: false,
    },
    {
      label: "Tax",
      value: formatMoney(
        invoice.tax,
      ),
      height: 21,
      bold: false,
    },
    {
      label: "TOTAL",
      value: formatMoney(
        invoice.total,
      ),
      height: 32,
      bold: true,
    },
  ];

  let rowY = y;

  for (const row of rows) {
    drawCell(
      doc,
      totalsX,
      rowY,
      rightWidth * 0.52,
      row.height,
      row.label,
      {
        bold: row.bold,
        fontSize:
          row.bold ? 9 : 7.5,
        align: "right",
      },
    );

    drawCell(
      doc,
      totalsX +
        rightWidth * 0.52,
      rowY,
      rightWidth * 0.48,
      row.height,
      row.value,
      {
        bold: row.bold,
        fontSize:
          row.bold ? 9 : 7.5,
        align: "right",
      },
    );

    rowY += row.height;
  }

  return y + boxHeight;
}

function drawBottomSection(
  doc: PDFKit.PDFDocument,
  paymentMethod?: string | null,
  notes?: string | null,
  y?: number,
): number {
  const startY = y ?? 0;

  const leftWidth =
    CONTENT_WIDTH * 0.65;

  const rightWidth =
    CONTENT_WIDTH - leftWidth;

  const sectionHeight = 105;

  /*
   * TERMS & CONDITIONS
   */

  drawBox(
    doc,
    MARGIN,
    startY,
    leftWidth,
    sectionHeight,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "TERMS & CONDITIONS",
      MARGIN + 8,
      startY + 8,
      {
        width:
          leftWidth - 16,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7);

  const terms = [
    "Invoice generated electronically by BillNest.",
    "Please retain this invoice for your records.",
  ];

  let termsY =
    startY + 25;

  for (const term of terms) {
    doc.text(
      `• ${term}`,
      MARGIN + 8,
      termsY,
      {
        width:
          leftWidth - 16,
      },
    );

    termsY += 15;
  }

  if (notes) {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(
        "Notes:",
        MARGIN + 8,
        termsY + 3,
      );

    doc
      .font("Helvetica")
      .fontSize(7)
      .text(
        notes,
        MARGIN + 8,
        termsY + 16,
        {
          width:
            leftWidth - 16,
          height: 45,
        },
      );
  }

  /*
   * PAYMENT & SIGNATURE
   */

  const rightX =
    MARGIN + leftWidth;

  drawBox(
    doc,
    rightX,
    startY,
    rightWidth,
    sectionHeight,
  );

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      "PAYMENT & AUTHORIZATION",
      rightX + 8,
      startY + 8,
      {
        width:
          rightWidth - 16,
        align: "center",
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `Payment Method: ${formatPaymentMethod(
        paymentMethod,
      )}`,
      rightX + 8,
      startY + 30,
      {
        width:
          rightWidth - 16,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(
      "For the above-mentioned shop",
      rightX + 8,
      startY + 55,
      {
        width:
          rightWidth - 16,
        align: "center",
      },
    );

  doc
    .moveTo(
      rightX + 18,
      startY + 85,
    )
    .lineTo(
      rightX +
        rightWidth -
        18,
      startY + 85,
    )
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(7)
    .text(
      "Authorized Signature",
      rightX + 8,
      startY + 89,
      {
        width:
          rightWidth - 16,
        align: "center",
      },
    );

  return startY + sectionHeight;
}

export async function generateInvoicePdf(
  invoiceId: string,
  shopId: string,
) {
  /*
   * Verify invoice belongs to shop.
   */

  const invoice =
    await findInvoiceByIdForShop(
      invoiceId,
      shopId,
    );

  if (!invoice) {
    throw new ApiError(
      404,
      "Invoice not found.",
      "INVOICE_NOT_FOUND",
    );
  }

  /*
   * Load all related data.
   */

  const [
    items,
    customer,
    shop,
  ] = await Promise.all([
    findInvoiceItems(
      invoiceId,
    ),

    findCustomerByIdForShop(
      invoice.customerId.toString(),
      shopId,
    ),

    findShopById(shopId),
  ]);

  if (!customer) {
    throw new ApiError(
      404,
      "Invoice customer not found.",
      "CUSTOMER_NOT_FOUND",
    );
  }

  if (!shop) {
    throw new ApiError(
      404,
      "Shop not found.",
      "SHOP_NOT_FOUND",
    );
  }

  /*
   * Create A4 PDF.
   */

  const document =
    new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: {
        Title:
          `Invoice ${invoice.invoiceNumber}`,
        Author: shop.name,
        Subject:
          "BillNest Tax Invoice",
        Creator: "BillNest",
      },
    });

  /*
   * FIRST PAGE HEADER
   */

  let y =
    drawInvoiceHeader(
      document,
      {
        name: shop.name,
        phone: shop.phone,
        email: shop.email,
        taxId: shop.taxId,
        address: shop.address,
      },
      {
        invoiceNumber:
          invoice.invoiceNumber,
        issueDate:
          invoice.issueDate,
        dueDate:
          invoice.dueDate,
        status:
          invoice.status,
      },
    );

  y += 10;

  /*
   * CUSTOMER SECTIONS
   */

  y =
    drawCustomerSections(
      document,
      {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      y,
    );

  y += 12;

  /*
   * ITEMS TABLE HEADER
   */

  drawTableHeader(
    document,
    y,
  );

  y += TABLE_HEADER_HEIGHT;

  const pdfItems: PdfItem[] =
    items.map(
      (item) => ({
        productName:
          item.productName,
        sku: item.sku,
        quantity:
          item.quantity,
        unitPrice:
          item.unitPrice,
        discount:
          item.discount,
        taxRate:
          item.taxRate,
        lineTax:
          item.lineTax,
        lineTotal:
          item.lineTotal,
      }),
    );

  /*
   * ITEMS
   */

  for (
    let index = 0;
    index < pdfItems.length;
    index++
  ) {
    const item =
      pdfItems[index];

    document
      .font("Helvetica")
      .fontSize(7);

    const rowHeight =
      calculateRowHeight(
        document,
        item,
      );

    /*
     * If the row does not fit,
     * create a continuation page.
     */

    if (
      y + rowHeight >
      CONTENT_BOTTOM
    ) {
      document.addPage();

      y = MARGIN;

      drawTableHeader(
        document,
        y,
      );

      y +=
        TABLE_HEADER_HEIGHT;
    }

    drawTableRow(
      document,
      item,
      index + 1,
      y,
      rowHeight,
    );

    y += rowHeight;

    drawHorizontalLine(
      document,
      y,
    );

    y += 5;
  }

  /*
   * TOTALS
   */

  const totalsHeight =
    118;

  const bottomSectionHeight =
    105;

  const requiredSpace =
    10 +
    totalsHeight +
    10 +
    bottomSectionHeight;

  if (
    y + requiredSpace >
    CONTENT_BOTTOM
  ) {
    document.addPage();

    y = MARGIN;
  } else {
    y += 10;
  }

  y =
    drawTotals(
      document,
      {
        subtotal:
          invoice.subtotal,
        discount:
          invoice.discount,
        tax:
          invoice.tax,
        total:
          invoice.total,
        amountPaid:
          invoice.amountPaid,
        amountDue:
          invoice.amountDue,
      },
      y,
    );

  /*
   * BOTTOM SECTION
   */

  if (
    y +
      10 +
      bottomSectionHeight >
    CONTENT_BOTTOM
  ) {
    document.addPage();

    y = MARGIN;
  } else {
    y += 10;
  }

  drawBottomSection(
    document,
    invoice.paymentMethod,
    invoice.notes,
    y,
  );

  /*
   * FOOTERS
   *
   * Switch only to existing buffered
   * pages. No new pages are created.
   */

  const pageRange =
    document.bufferedPageRange();

  for (
    let index = 0;
    index < pageRange.count;
    index++
  ) {
    document.switchToPage(
      pageRange.start + index,
    );

    drawPageFooter(
      document,
      index + 1,
      pageRange.count,
    );
  }

  return {
    document,
    invoiceNumber:
      invoice.invoiceNumber,
  };
}