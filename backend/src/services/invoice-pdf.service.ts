import PDFDocument from "pdfkit";

import {
  findInvoiceByIdForShop,
  findInvoiceItems,
} from "../repositories/invoice.repository";

import { findCustomerById } from "../repositories/customer.repository";

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

const CONTENT_BOTTOM = 790;

const FOOTER_Y =
  PAGE_HEIGHT - 30;

/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const COLORS = {
  navy: "#12263A",
  blue: "#2563EB",
  blueSoft: "#EEF5FF",

  text: "#172033",
  muted: "#617084",

  border: "#D7DFEA",
  panel: "#F6F9FC",

  red: "#D92D20",
  redSoft: "#FEECEC",

  green: "#16803C",
  greenSoft: "#EAF8EF",

  white: "#FFFFFF",
};

/*
|--------------------------------------------------------------------------
| BASIC FORMATTERS
|--------------------------------------------------------------------------
*/

function money(
  value: number,
): string {
  return `INR ${Number(
    value || 0,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value?: Date | string | null,
): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function statusLabel(
  status: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    draft: "Draft",
    paid: "Paid",
    partially_paid:
      "Partially Paid",
    cancelled: "Cancelled",
    unpaid: "Unpaid",
  };

  return (
    labels[status] ??
    status.replace(/_/g, " ")
  );
}

function paymentLabel(
  method?: string | null,
): string {
  const labels: Record<
    string,
    string
  > = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer:
      "Bank Transfer",
    credit: "Credit",
  };

  if (!method) {
    return "-";
  }

  return (
    labels[method] ??
    method
  );
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
    .filter(Boolean)
    .join(", ");
}

/*
|--------------------------------------------------------------------------
| NUMBER TO WORDS
|--------------------------------------------------------------------------
*/

function numberToWords(
  value: number,
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
    number: number,
  ): string {
    let result = "";

    if (number >= 100) {
      result +=
        `${ones[
          Math.floor(number / 100)
        ]} Hundred`;

      number %= 100;

      if (number > 0) {
        result += " ";
      }
    }

    if (number >= 20) {
      result +=
        tens[
          Math.floor(number / 10)
        ];

      number %= 10;

      if (number > 0) {
        result +=
          ` ${ones[number]}`;
      }
    } else if (number > 0) {
      result +=
        ones[number];
    }

    return result;
  }

  if (value === 0) {
    return "Zero";
  }

  let number =
    Math.floor(value);

  const crore =
    Math.floor(
      number / 10000000,
    );

  number %= 10000000;

  const lakh =
    Math.floor(
      number / 100000,
    );

  number %= 100000;

  const thousand =
    Math.floor(
      number / 1000,
    );

  const remainder =
    number % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(
      `${belowThousand(
        crore,
      )} Crore`,
    );
  }

  if (lakh > 0) {
    parts.push(
      `${belowThousand(
        lakh,
      )} Lakh`,
    );
  }

  if (thousand > 0) {
    parts.push(
      `${belowThousand(
        thousand,
      )} Thousand`,
    );
  }

  if (remainder > 0) {
    parts.push(
      belowThousand(
        remainder,
      ),
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

  if (paise > 0) {
    return (
      `Rupees ${numberToWords(
        rupees,
      )} and ${numberToWords(
        paise,
      )} Paise Only`
    );
  }

  return (
    `Rupees ${numberToWords(
      rupees,
    )} Only`
  );
}

/*
|--------------------------------------------------------------------------
| DRAWING HELPERS
|--------------------------------------------------------------------------
*/

function roundedRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill?: string,
  stroke?: string,
  radius = 8,
) {
  doc.save();

  doc.roundedRect(
    x,
    y,
    width,
    height,
    radius,
  );

  if (fill) {
    doc
      .fillColor(fill)
      .fill();
  }

  if (stroke) {
    doc
      .lineWidth(0.7)
      .strokeColor(stroke)
      .stroke();
  }

  doc.restore();
}

function drawText(
  doc: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number,
  options: {
    size?: number;
    font?:
      | "Helvetica"
      | "Helvetica-Bold"
      | "Helvetica-Oblique";
    color?: string;
    align?:
      | "left"
      | "center"
      | "right";
  } = {},
) {
  doc
    .font(
      options.font ??
        "Helvetica",
    )
    .fontSize(
      options.size ?? 8,
    )
    .fillColor(
      options.color ??
        COLORS.text,
    )
    .text(
      value,
      x,
      y,
      {
        width,
        align:
          options.align ??
          "left",
        lineGap: 1,
      },
    );
}

/*
|--------------------------------------------------------------------------
| BILLNEST LOGO
|--------------------------------------------------------------------------
*/

function drawLogo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
) {
  doc.save();

  doc
    .roundedRect(
      x,
      y,
      42,
      42,
      10,
    )
    .fillColor(
      COLORS.blue,
    )
    .fill();

  doc
    .fillColor(
      COLORS.white,
    )
    .font(
      "Helvetica-Bold",
    )
    .fontSize(27)
    .text(
      "B",
      x + 10,
      y + 4,
      {
        width: 22,
        align: "center",
      },
    );

  doc.restore();

  drawText(
    doc,
    "BillNest",
    x + 51,
    y + 1,
    150,
    {
      size: 18,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
    },
  );

  drawText(
    doc,
    "Business Made Simple",
    x + 52,
    y + 23,
    150,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );
}

/*
|--------------------------------------------------------------------------
| FOOTER
|--------------------------------------------------------------------------
*/

function drawFooter(
  doc: PDFKit.PDFDocument,
  page: number,
  totalPages: number,
) {
  doc
    .moveTo(
      MARGIN,
      PAGE_HEIGHT - 48,
    )
    .lineTo(
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 48,
    )
    .lineWidth(0.5)
    .strokeColor(
      COLORS.border,
    )
    .stroke();

  drawText(
    doc,
    "Thank you for choosing BillNest!",
    MARGIN,
    PAGE_HEIGHT - 39,
    CONTENT_WIDTH,
    {
      size: 7.5,
      font:
        "Helvetica-Oblique",
      color:
        COLORS.muted,
      align: "center",
    },
  );

  drawText(
    doc,
    `Computer generated invoice • Page ${page} of ${totalPages}`,
    MARGIN,
    FOOTER_Y,
    CONTENT_WIDTH,
    {
      size: 6.5,
      color:
        COLORS.muted,
      align: "center",
    },
  );
}

/*
|--------------------------------------------------------------------------
| INVOICE HEADER
|--------------------------------------------------------------------------
*/

function drawInvoiceHeader(
  doc: PDFKit.PDFDocument,
  shop: ShopPdfData,
  invoice: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date | null;
    status: string;
  },
): number {
  let y = MARGIN;

  drawLogo(
    doc,
    MARGIN,
    y,
  );

  drawText(
    doc,
    "Manage Today.",
    PAGE_WIDTH -
      MARGIN -
      120,
    y + 2,
    120,
    {
      size: 8,
      color:
        COLORS.muted,
      align: "right",
    },
  );

  drawText(
    doc,
    "Grow Tomorrow.",
    PAGE_WIDTH -
      MARGIN -
      120,
    y + 14,
    120,
    {
      size: 8,
      color:
        COLORS.muted,
      align: "right",
    },
  );

  y += 55;

  /*
   * SHOP INFORMATION
   */

  drawText(
    doc,
    shop.name,
    MARGIN,
    y,
    310,
    {
      size: 14,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
    },
  );

  drawText(
    doc,
    addressToString(
      shop.address,
    ),
    MARGIN,
    y + 20,
    315,
    {
      size: 8,
      color:
        COLORS.muted,
    },
  );

  const contactParts = [
    shop.phone
      ? `Mobile: ${shop.phone}`
      : null,

    shop.email
      ? `Email: ${shop.email}`
      : null,

    shop.taxId
      ? `GSTIN: ${shop.taxId}`
      : null,
  ].filter(
    (
      value,
    ): value is string =>
      Boolean(value),
  );

  drawText(
    doc,
    contactParts.join(
      "  •  ",
    ) || "-",
    MARGIN,
    y + 35,
    330,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  /*
   * TAX INVOICE
   */

  const infoX = 370;

  drawText(
    doc,
    "TAX INVOICE",
    infoX,
    y - 1,
    197,
    {
      size: 17,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
      align: "right",
    },
  );

  doc
    .moveTo(
      infoX + 35,
      y + 24,
    )
    .lineTo(
      PAGE_WIDTH - MARGIN,
      y + 24,
    )
    .lineWidth(1)
    .strokeColor(
      COLORS.blue,
    )
    .stroke();

  const rows = [
    [
      "Invoice No.",
      invoice.invoiceNumber,
    ],
    [
      "Invoice Date",
      formatDate(
        invoice.issueDate,
      ),
    ],
    [
      "Due Date",
      formatDate(
        invoice.dueDate,
      ),
    ],
  ];

  rows.forEach(
    (row, index) => {
      drawText(
        doc,
        row[0],
        infoX,
        y + 32 +
          index * 16,
        70,
        {
          size: 7.5,
          color:
            COLORS.muted,
        },
      );

      drawText(
        doc,
        row[1],
        infoX + 70,
        y + 32 +
          index * 16,
        127,
        {
          size: 7.5,
          font:
            "Helvetica-Bold",
          align: "right",
        },
      );
    },
  );

  /*
   * STATUS
   */

  const isPaid =
    invoice.status ===
    "paid";

  const isCancelled =
    invoice.status ===
    "cancelled";

  const statusColor =
    isPaid
      ? COLORS.green
      : isCancelled
        ? COLORS.red
        : COLORS.red;

  const statusBackground =
    isPaid
      ? COLORS.greenSoft
      : COLORS.redSoft;

  roundedRect(
    doc,
    infoX + 105,
    y + 81,
    92,
    20,
    statusBackground,
    undefined,
    10,
  );

  drawText(
    doc,
    statusLabel(
      invoice.status,
    ),
    infoX + 105,
    y + 87,
    92,
    {
      size: 7.5,
      font:
        "Helvetica-Bold",
      color:
        statusColor,
      align: "center",
    },
  );

  return y + 112;
}

/*
|--------------------------------------------------------------------------
| CUSTOMER / BILLING SECTION
|--------------------------------------------------------------------------
*/

function drawCustomerSections(
  doc: PDFKit.PDFDocument,
  customer: CustomerPdfData,
  y: number,
): number {
  const gap = 12;

  const width =
    (CONTENT_WIDTH -
      gap) /
    2;

  const height = 102;

  /*
   * BILL TO
   */

  roundedRect(
    doc,
    MARGIN,
    y,
    width,
    height,
    COLORS.panel,
    COLORS.border,
  );

  drawText(
    doc,
    "BILL TO",
    MARGIN + 14,
    y + 12,
    width - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  drawText(
    doc,
    customer.name,
    MARGIN + 14,
    y + 31,
    width - 28,
    {
      size: 10.5,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
    },
  );

  drawText(
    doc,
    customer.phone
      ? `Mobile: ${customer.phone}`
      : "-",
    MARGIN + 14,
    y + 50,
    width - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    customer.email
      ? `Email: ${customer.email}`
      : "-",
    MARGIN + 14,
    y + 64,
    width - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    addressToString(
      customer.address,
    ),
    MARGIN + 14,
    y + 78,
    width - 28,
    {
      size: 7,
      color:
        COLORS.muted,
    },
  );

  /*
   * CUSTOMER DETAILS
   */

  const rightX =
    MARGIN +
    width +
    gap;

  roundedRect(
    doc,
    rightX,
    y,
    width,
    height,
    COLORS.panel,
    COLORS.border,
  );

  drawText(
    doc,
    "CUSTOMER DETAILS",
    rightX + 14,
    y + 12,
    width - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  drawText(
    doc,
    "Customer",
    rightX + 14,
    y + 34,
    80,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    customer.name,
    rightX + 94,
    y + 34,
    width - 108,
    {
      size: 7.5,
      font:
        "Helvetica-Bold",
      align: "right",
    },
  );

  drawText(
    doc,
    "Customer Type",
    rightX + 14,
    y + 51,
    80,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    "Regular",
    rightX + 94,
    y + 51,
    width - 108,
    {
      size: 7.5,
      align: "right",
    },
  );

  drawText(
    doc,
    "GSTIN",
    rightX + 14,
    y + 68,
    80,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    "-",
    rightX + 94,
    y + 68,
    width - 108,
    {
      size: 7.5,
      align: "right",
    },
  );

  drawText(
    doc,
    "Payment Terms",
    rightX + 14,
    y + 85,
    80,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    "Immediate",
    rightX + 94,
    y + 85,
    width - 108,
    {
      size: 7.5,
      align: "right",
    },
  );

  return y + height;
}

/*
|--------------------------------------------------------------------------
| ITEMS TABLE
|--------------------------------------------------------------------------
*/

function drawItemsTable(
  doc: PDFKit.PDFDocument,
  items: PdfItem[],
  y: number,
): number {
  const columns = [
    {
      label: "#",
      width: 26,
    },
    {
      label: "Item / Product",
      width: 166,
    },
    {
      label: "SKU",
      width: 58,
    },
    {
      label: "Qty",
      width: 40,
    },
    {
      label: "Unit Price",
      width: 70,
    },
    {
      label: "Discount",
      width: 66,
    },
    {
      label: "Amount",
      width:
        CONTENT_WIDTH -
        426,
    },
  ];

  /*
   * HEADER
   */

  roundedRect(
    doc,
    MARGIN,
    y,
    CONTENT_WIDTH,
    28,
    COLORS.navy,
    undefined,
    7,
  );

  let x = MARGIN;

  columns.forEach(
    (column) => {
      drawText(
        doc,
        column.label,
        x + 5,
        y + 9,
        column.width - 10,
        {
          size: 7,
          font:
            "Helvetica-Bold",
          color:
            COLORS.white,
          align:
            column.label ===
            "Item / Product"
              ? "left"
              : "center",
        },
      );

      x +=
        column.width;
    },
  );

  y += 28;

  /*
   * ROWS
   */

  items.forEach(
    (item, index) => {
      const rowHeight =
        item.productName.length >
        45
          ? 42
          : 34;

      const background =
        index % 2 === 0
          ? COLORS.white
          : "#FBFCFE";

      doc
        .rect(
          MARGIN,
          y,
          CONTENT_WIDTH,
          rowHeight,
        )
        .fillColor(
          background,
        )
        .fill();

      doc
        .rect(
          MARGIN,
          y,
          CONTENT_WIDTH,
          rowHeight,
        )
        .lineWidth(0.5)
        .strokeColor(
          COLORS.border,
        )
        .stroke();

      const values = [
        String(index + 1),

        item.sku
          ? `${item.productName}\nSKU: ${item.sku}`
          : item.productName,

        item.sku ??
          "-",

        String(
          item.quantity,
        ),

        money(
          item.unitPrice,
        ),

        money(
          item.discount,
        ),

        money(
          item.lineTotal,
        ),
      ];

      x = MARGIN;

      values.forEach(
        (value, valueIndex) => {
          const columnWidth =
            columns[
              valueIndex
            ].width;

          drawText(
            doc,
            value,
            x + 5,
            y +
              (value.includes(
                "\n",
              )
                ? 7
                : 11),
            columnWidth - 10,
            {
              size:
                valueIndex === 1
                  ? 7.2
                  : 7,

              font:
                valueIndex === 6
                  ? "Helvetica-Bold"
                  : "Helvetica",

              color:
                COLORS.text,

              align:
                valueIndex === 1
                  ? "left"
                  : "right",
            },
          );

          x +=
            columnWidth;
        },
      );

      y += rowHeight;
    },
  );

  return y;
}

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

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
  const leftWidth = 300;

  const rightWidth =
    CONTENT_WIDTH -
    leftWidth -
    12;

  const height = 112;

  /*
   * AMOUNT IN WORDS
   */

  roundedRect(
    doc,
    MARGIN,
    y,
    leftWidth,
    height,
    COLORS.panel,
    COLORS.border,
  );

  drawText(
    doc,
    "AMOUNT IN WORDS",
    MARGIN + 14,
    y + 13,
    leftWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  drawText(
    doc,
    amountInWords(
      invoice.total,
    ),
    MARGIN + 14,
    y + 31,
    leftWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
    },
  );

  drawText(
    doc,
    "Payment Summary",
    MARGIN + 14,
    y + 63,
    leftWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  drawText(
    doc,
    `Amount Paid: ${money(
      invoice.amountPaid,
    )}`,
    MARGIN + 14,
    y + 81,
    leftWidth - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    `Balance Due: ${money(
      invoice.amountDue,
    )}`,
    MARGIN + 14,
    y + 96,
    leftWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        invoice.amountDue > 0
          ? COLORS.red
          : COLORS.green,
    },
  );

  /*
   * TOTALS
   */

  const totalsX =
    MARGIN +
    leftWidth +
    12;

  roundedRect(
    doc,
    totalsX,
    y,
    rightWidth,
    height,
    COLORS.panel,
    COLORS.border,
  );

  const rows = [
    {
      label: "Subtotal",
      value:
        invoice.subtotal,
    },

    {
      label:
        "Total Discount",
      value:
        invoice.discount,
    },

    {
      label: "Tax",
      value:
        invoice.tax,
    },
  ];

  rows.forEach(
    (row, index) => {
      const rowY =
        y +
        13 +
        index * 19;

      drawText(
        doc,
        row.label,
        totalsX + 14,
        rowY,
        rightWidth - 28,
        {
          size: 7.5,
          color:
            COLORS.muted,
        },
      );

      drawText(
        doc,
        money(row.value),
        totalsX + 14,
        rowY,
        rightWidth - 28,
        {
          size: 7.5,
          align: "right",
        },
      );
    },
  );

  /*
   * TOTAL HIGHLIGHT
   */

  doc
    .rect(
      totalsX,
      y + 68,
      rightWidth,
      44,
    )
    .fillColor(
      COLORS.blueSoft,
    )
    .fill();

  drawText(
    doc,
    "TOTAL AMOUNT",
    totalsX + 14,
    y + 81,
    rightWidth - 28,
    {
      size: 8.5,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
    },
  );

  drawText(
    doc,
    money(invoice.total),
    totalsX + 14,
    y + 80,
    rightWidth - 28,
    {
      size: 10,
      font:
        "Helvetica-Bold",
      color:
        COLORS.navy,
      align: "right",
    },
  );

  return y + height;
}

/*
|--------------------------------------------------------------------------
| PAYMENT + TERMS
|--------------------------------------------------------------------------
*/

function drawBottomSection(
  doc: PDFKit.PDFDocument,
  paymentMethod:
    | string
    | null
    | undefined,
  amountPaid: number,
  notes:
    | string
    | null
    | undefined,
  y: number,
): number {
  const gap = 12;

  const leftWidth =
    (CONTENT_WIDTH - gap) *
    0.54;

  const rightWidth =
    CONTENT_WIDTH -
    gap -
    leftWidth;

  const height = 118;

  /*
   * PAYMENT INFORMATION
   */

  roundedRect(
    doc,
    MARGIN,
    y,
    leftWidth,
    height,
    COLORS.panel,
    COLORS.border,
  );

  drawText(
    doc,
    "PAYMENT INFORMATION",
    MARGIN + 14,
    y + 13,
    leftWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  drawText(
    doc,
    "Payment Method",
    MARGIN + 14,
    y + 37,
    leftWidth - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    paymentLabel(
      paymentMethod,
    ),
    MARGIN + 14,
    y + 37,
    leftWidth - 28,
    {
      size: 7.5,
      font:
        "Helvetica-Bold",
      align: "right",
    },
  );

  drawText(
    doc,
    "Transaction ID",
    MARGIN + 14,
    y + 56,
    leftWidth - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    "-",
    MARGIN + 14,
    y + 56,
    leftWidth - 28,
    {
      size: 7.5,
      align: "right",
    },
  );

  drawText(
    doc,
    "Payment Date",
    MARGIN + 14,
    y + 75,
    leftWidth - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    "-",
    MARGIN + 14,
    y + 75,
    leftWidth - 28,
    {
      size: 7.5,
      align: "right",
    },
  );

  drawText(
    doc,
    "Amount Paid",
    MARGIN + 14,
    y + 94,
    leftWidth - 28,
    {
      size: 7.5,
      color:
        COLORS.muted,
    },
  );

  drawText(
    doc,
    money(amountPaid),
    MARGIN + 14,
    y + 94,
    leftWidth - 28,
    {
      size: 7.5,
      font:
        "Helvetica-Bold",
      align: "right",
    },
  );

  /*
   * TERMS
   */

  const rightX =
    MARGIN +
    leftWidth +
    gap;

  roundedRect(
    doc,
    rightX,
    y,
    rightWidth,
    height,
    COLORS.panel,
    COLORS.border,
  );

  drawText(
    doc,
    "TERMS & CONDITIONS",
    rightX + 14,
    y + 13,
    rightWidth - 28,
    {
      size: 8,
      font:
        "Helvetica-Bold",
      color:
        COLORS.blue,
    },
  );

  const terms = [
    "Goods once sold will not be taken back or exchanged.",
    "Manufacturer warranty is applicable as per company policy.",
    "Bill is required for any warranty claim.",
    "Please check products at the time of delivery.",
    "Prices are subject to change without prior notice.",
    "Any dispute will be subject to applicable local jurisdiction.",
  ];

  terms.forEach(
    (term, index) => {
      drawText(
        doc,
        `${index + 1}. ${term}`,
        rightX + 14,
        y + 31 +
          index * 12,
        rightWidth - 28,
        {
          size: 6.6,
          color:
            COLORS.muted,
        },
      );
    },
  );

  if (notes) {
    drawText(
      doc,
      `Note: ${notes}`,
      rightX + 14,
      y + 101,
      rightWidth - 28,
      {
        size: 6.5,
        color:
          COLORS.muted,
      },
    );
  }

  y +=
    height + 12;

  drawText(
    doc,
    "This is a computer generated invoice. Signature not required.",
    MARGIN,
    y,
    CONTENT_WIDTH,
    {
      size: 7.5,
      font:
        "Helvetica-Bold",
      color:
        COLORS.muted,
      align: "center",
    },
  );

  return y + 18;
}

/*
|--------------------------------------------------------------------------
| MAIN PDF GENERATOR
|--------------------------------------------------------------------------
*/

export async function generateInvoicePdf(
  invoiceId: string,
  shopId: string,
) {
  /*
   * Find invoice
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
   * Load all required data
   */

  const [
    items,
    customer,
    shop,
  ] = await Promise.all([
    findInvoiceItems(
      invoiceId,
    ),

    findCustomerById(invoice.customerId.toString()),

    findShopById(
      shopId,
    ),
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
   * Create A4 document
   */

  const document =
    new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,

      info: {
        Title:
          `Invoice ${invoice.invoiceNumber}`,

        Author:
          shop.name,

        Subject:
          "BillNest Tax Invoice",

        Creator:
          "BillNest",
      },
    });

  /*
   * HEADER
   */

  let y =
    drawInvoiceHeader(
      document,
      {
        name:
          shop.name,

        phone:
          shop.phone,

        email:
          shop.email,

        taxId:
          shop.taxId,

        address:
          shop.address,
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
   * CUSTOMER
   */

  y =
    drawCustomerSections(
      document,
      {
        name:
          customer.name,

        email:
          customer.email,

        phone:
          customer.phone,

        address:
          customer.address,
      },
      y,
    );

  y += 12;

  /*
   * ITEMS
   */

  const pdfItems: PdfItem[] =
    items.map(
      (item: PdfItem) => ({
        productName:
          item.productName,

        sku:
          item.sku,

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
   * If customer section has consumed
   * too much space, continue on page 2.
   */

  if (y > 600) {
    document.addPage();

    y = MARGIN;
  }

  y =
    drawItemsTable(
      document,
      pdfItems,
      y,
    );

  y += 12;

  /*
   * TOTALS
   */

  const totalsRequiredSpace =
    112 + 12 + 155;

  if (
    y +
      totalsRequiredSpace >
    CONTENT_BOTTOM
  ) {
    document.addPage();

    y = MARGIN;
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

  y += 12;

  /*
   * PAYMENT + TERMS
   */

  if (
    y + 155 >
    CONTENT_BOTTOM
  ) {
    document.addPage();

    y = MARGIN;
  }

  drawBottomSection(
    document,

    invoice.paymentMethod,

    invoice.amountPaid,

    invoice.notes,

    y,
  );

  /*
   * FOOTERS
   */

  const pageRange =
    document.bufferedPageRange();

  for (
    let index = 0;
    index < pageRange.count;
    index++
  ) {
    document.switchToPage(
      pageRange.start +
        index,
    );

    drawFooter(
      document,
      index + 1,
      pageRange.count,
    );
  }

  /*
   * Return document
   */

  return {
    document,

    invoiceNumber:
      invoice.invoiceNumber,
  };
}