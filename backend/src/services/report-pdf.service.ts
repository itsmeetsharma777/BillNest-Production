import PDFDocument from "pdfkit";

import {
  getReportsForOwner,
} from "./report.service";

type ReportData = Awaited<
  ReturnType<typeof getReportsForOwner>
>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 45;
const MARGIN_BOTTOM = 55;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN_LEFT -
  MARGIN_RIGHT;

const FOOTER_Y =
  PAGE_HEIGHT - 32;

const CONTENT_BOTTOM =
  PAGE_HEIGHT -
  MARGIN_BOTTOM -
  12;

type TableColumn = {
  title: string;
  width: number;
  align?: "left" | "center" | "right";
};

function formatCurrency(
  value: number,
) {
  const amount =
    new Intl.NumberFormat(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(
      Number(value) || 0,
    );

  return `INR ${amount}`;
}

function formatNumber(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(
    Number(value) || 0,
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  /*
   * When the backend returns a date-only value such as
   * 2026-09-21, treat it as a local calendar date instead
   * of allowing JavaScript timezone conversion to shift it.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day,
      );

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(date);
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatPaymentMethod(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getStatusLabel(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function sanitizePdfText(
  value: unknown,
) {
  return String(
    value ?? "",
  )
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addPage(
  doc: PDFKit.PDFDocument,
) {
  doc.addPage();

  doc.x =
    MARGIN_LEFT;

  doc.y =
    MARGIN_TOP;
}

function ensureSpace(
  doc: PDFKit.PDFDocument,
  requiredHeight: number,
) {
  if (
    doc.y +
      requiredHeight >
    CONTENT_BOTTOM
  ) {
    addPage(doc);
  }
}

function addTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  ensureSpace(doc, 55);

  doc.x =
    MARGIN_LEFT;

  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor("#111827")
    .text(
      title,
      MARGIN_LEFT,
      doc.y,
      {
        width: CONTENT_WIDTH,
        lineBreak: false,
      },
    );

  doc.y += 7;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280");
}

function addReportPeriod(
  doc: PDFKit.PDFDocument,
  startDate: string | null,
  endDate: string | null,
) {
  ensureSpace(doc, 24);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280")
    .text(
      `Report period: ${formatDate(
        startDate,
      )} — ${formatDate(
        endDate,
      )}`,
      MARGIN_LEFT,
      doc.y,
      {
        width: CONTENT_WIDTH,
        lineBreak: false,
      },
    );

  doc.y += 8;
}

function addSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  ensureSpace(doc, 45);

  doc.x =
    MARGIN_LEFT;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111827")
    .text(
      title,
      MARGIN_LEFT,
      doc.y,
      {
        width: CONTENT_WIDTH,
        lineBreak: false,
      },
    );

  doc.y += 5;

  doc
    .moveTo(
      MARGIN_LEFT,
      doc.y,
    )
    .lineTo(
      MARGIN_LEFT +
        CONTENT_WIDTH,
      doc.y,
    )
    .strokeColor("#D1D5DB")
    .lineWidth(0.7)
    .stroke();

  doc.y += 8;
}

function addEmptyMessage(
  doc: PDFKit.PDFDocument,
  message: string,
) {
  ensureSpace(doc, 24);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6B7280")
    .text(
      sanitizePdfText(message),
      MARGIN_LEFT,
      doc.y,
      {
        width: CONTENT_WIDTH,
        lineBreak: false,
      },
    );

  doc.y += 8;
}

function addKeyValueGrid(
  doc: PDFKit.PDFDocument,
  items: Array<{
    label: string;
    value: string;
  }>,
  columns = 2,
) {
  const rowHeight = 23;

  const columnWidth =
    CONTENT_WIDTH /
    columns;

  for (
    let index = 0;
    index < items.length;
    index += columns
  ) {
    ensureSpace(
      doc,
      rowHeight,
    );

    const rowItems =
      items.slice(
        index,
        index + columns,
      );

    const y =
      doc.y;

    rowItems.forEach(
      (
        item,
        columnIndex,
      ) => {
        const x =
          MARGIN_LEFT +
          columnIndex *
            columnWidth;

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#6B7280")
          .text(
            sanitizePdfText(
              item.label,
            ),
            x,
            y,
            {
              width:
                columnWidth -
                12,
              lineBreak: false,
            },
          );

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#111827")
          .text(
            sanitizePdfText(
              item.value,
            ),
            x +
              105,
            y,
            {
              width:
                columnWidth -
                117,
              align: "right",
              lineBreak: false,
              ellipsis: true,
            },
          );
      },
    );

    doc
      .moveTo(
        MARGIN_LEFT,
        y + 17,
      )
      .lineTo(
        MARGIN_LEFT +
          CONTENT_WIDTH,
        y + 17,
      )
      .strokeColor("#F3F4F6")
      .lineWidth(0.5)
      .stroke();

    doc.y =
      y + rowHeight;
  }
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
) {
  const totalWidth =
    columns.reduce(
      (
        total,
        column,
      ) =>
        total +
        column.width,
      0,
    );

  const y =
    doc.y;

  doc
    .rect(
      MARGIN_LEFT,
      y - 3,
      totalWidth,
      20,
    )
    .fill("#F3F4F6");

  let x =
    MARGIN_LEFT;

  columns.forEach(
    (column) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#374151")
        .text(
          sanitizePdfText(
            column.title,
          ),
          x + 6,
          y + 2,
          {
            width:
              column.width - 12,
            align:
              column.align ??
              "left",
            lineBreak: false,
            ellipsis: true,
          },
        );

      x +=
        column.width;
    },
  );

  doc.y =
    y + 23;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  values: string[],
  options?: {
    bold?: boolean;
    background?: string;
  },
) {
  const rowHeight = 21;

  ensureSpace(
    doc,
    rowHeight + 2,
  );

  const y =
    doc.y;

  const totalWidth =
    columns.reduce(
      (
        total,
        column,
      ) =>
        total +
        column.width,
      0,
    );

  if (
    options?.background
  ) {
    doc
      .rect(
        MARGIN_LEFT,
        y - 3,
        totalWidth,
        rowHeight,
      )
      .fill(
        options.background,
      );
  }

  let x =
    MARGIN_LEFT;

  columns.forEach(
    (
      column,
      index,
    ) => {
      doc
        .font(
          options?.bold
            ? "Helvetica-Bold"
            : "Helvetica",
        )
        .fontSize(7.7)
        .fillColor("#374151")
        .text(
          sanitizePdfText(
            values[index] ??
              "",
          ),
          x + 6,
          y + 2,
          {
            width:
              column.width - 12,
            align:
              column.align ??
              "left",
            lineBreak: false,
            ellipsis: true,
          },
        );

      x +=
        column.width;
    },
  );

  doc
    .moveTo(
      MARGIN_LEFT,
      y + rowHeight - 2,
    )
    .lineTo(
      MARGIN_LEFT +
        totalWidth,
      y + rowHeight - 2,
    )
    .strokeColor("#E5E7EB")
    .lineWidth(0.45)
    .stroke();

  doc.y =
    y + rowHeight;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  rows: string[][],
  options?: {
    totalRow?: string[];
  },
) {
  const requiredHeight =
    23 +
    21;

  ensureSpace(
    doc,
    requiredHeight,
  );

  drawTableHeader(
    doc,
    columns,
  );

  rows.forEach(
    (row) => {
      /*
       * If a page break is required for a row,
       * redraw the table header on the new page.
       */
      if (
        doc.y + 23 >
        CONTENT_BOTTOM
      ) {
        addPage(doc);

        drawTableHeader(
          doc,
          columns,
        );
      }

      drawTableRow(
        doc,
        columns,
        row,
      );
    },
  );

  if (
    options?.totalRow
  ) {
    if (
      doc.y + 23 >
      CONTENT_BOTTOM
    ) {
      addPage(doc);

      drawTableHeader(
        doc,
        columns,
      );
    }

    drawTableRow(
      doc,
      columns,
      options.totalRow,
      {
        bold: true,
        background: "#F9FAFB",
      },
    );
  }

  doc.y += 4;
}

function addFooter(
  doc: PDFKit.PDFDocument,
) {
  const pageRange =
    doc.bufferedPageRange();

  for (
    let index = 0;
    index <
    pageRange.count;
    index += 1
  ) {
    doc.switchToPage(
      pageRange.start +
        index,
    );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#9CA3AF")
      .text(
        `BillNest Reports & Analytics  •  Page ${
          index + 1
        } of ${pageRange.count}`,
        MARGIN_LEFT,
        FOOTER_Y,
        {
          width:
            CONTENT_WIDTH,
          align: "center",
          lineBreak: false,
        },
      );
  }
}

export async function generateReportPdf(
  ownerId: string,
  range: {
    startDate?: Date;
    endDate?: Date;
  },
): Promise<Buffer> {
  const report: ReportData =
    await getReportsForOwner(
      ownerId,
      range,
    );

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const doc =
        new PDFDocument({
          size: "A4",
          margins: {
            top:
              MARGIN_TOP,
            bottom:
              MARGIN_BOTTOM,
            left:
              MARGIN_LEFT,
            right:
              MARGIN_RIGHT,
          },
          bufferPages: true,
          autoFirstPage: true,
        });

      const chunks: Buffer[] =
        [];

      doc.on(
        "data",
        (
          chunk: Buffer,
        ) => {
          chunks.push(
            chunk,
          );
        },
      );

      doc.on(
        "end",
        () => {
          resolve(
            Buffer.concat(
              chunks,
            ),
          );
        },
      );

      doc.on(
        "error",
        reject,
      );

      /*
       * ======================================================
       * TITLE
       * ======================================================
       */

      addTitle(
        doc,
        "BillNest Reports & Analytics",
      );

      addReportPeriod(
        doc,
        report.period
          .startDate,
        report.period
          .endDate,
      );

      /*
       * ======================================================
       * SUMMARY
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Summary",
      );

      addKeyValueGrid(
        doc,
        [
          {
            label:
              "Total Invoices",
            value:
              formatNumber(
                report
                  .overview
                  .totalInvoices,
              ),
          },
          {
            label:
              "Total Sales",
            value:
              formatCurrency(
                report
                  .overview
                  .totalSales,
              ),
          },
          {
            label:
              "Total Subtotal",
            value:
              formatCurrency(
                report
                  .overview
                  .totalSubtotal,
              ),
          },
          {
            label:
              "Total Discount",
            value:
              formatCurrency(
                report
                  .overview
                  .totalDiscount,
              ),
          },
          {
            label:
              "Total Tax",
            value:
              formatCurrency(
                report
                  .overview
                  .totalTax,
              ),
          },
          {
            label:
              "Average Invoice",
            value:
              formatCurrency(
                report
                  .overview
                  .averageInvoice,
              ),
          },
          {
            label:
              "Amount Collected",
            value:
              formatCurrency(
                report
                  .overview
                  .amountCollected,
              ),
          },
          {
            label:
              "Amount Outstanding",
            value:
              formatCurrency(
                report
                  .overview
                  .amountOutstanding,
              ),
          },
          {
            label:
              "Collection Rate",
            value:
              `${report.overview.collectionRate}%`,
          },
          {
            label:
              "Payment Count",
            value:
              formatNumber(
                report
                  .overview
                  .paymentCount,
              ),
          },
        ],
      );

      /*
       * ======================================================
       * INVOICE STATUS
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Invoice Status",
      );

      drawTable(
        doc,
        [
          {
            title:
              "Status",
            width: 390,
          },
          {
            title:
              "Count",
            width: 105,
            align:
              "right",
          },
        ],
        [
          [
            "Paid",
            formatNumber(
              report
                .invoices
                .paid,
            ),
          ],
          [
            "Partially Paid",
            formatNumber(
              report
                .invoices
                .partiallyPaid,
            ),
          ],
          [
            "Draft",
            formatNumber(
              report
                .invoices
                .draft,
            ),
          ],
          [
            "Cancelled",
            formatNumber(
              report
                .invoices
                .cancelled,
            ),
          ],
        ],
        {
          totalRow: [
            "Total",
            formatNumber(
              report
                .invoices
                .total,
            ),
          ],
        },
      );

      /*
       * ======================================================
       * PAYMENT METHODS
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Payment Methods",
      );

      if (
        report.payments
          .byMethod.length ===
        0
      ) {
        addEmptyMessage(
          doc,
          "No payment data available.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Payment Method",
              width: 280,
            },
            {
              title:
                "Count",
              width: 80,
              align:
                "right",
            },
            {
              title:
                "Amount",
              width: 135,
              align:
                "right",
            },
          ],
          report.payments
            .byMethod.map(
              (item) => [
                formatPaymentMethod(
                  item.method,
                ),
                formatNumber(
                  item.count,
                ),
                formatCurrency(
                  item.amount,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * SALES TREND
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Sales Trend",
      );

      if (
        report.trends
          .sales.length ===
        0
      ) {
        addEmptyMessage(
          doc,
          "No sales recorded during this period.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Date",
              width: 245,
            },
            {
              title:
                "Sales",
              width: 175,
              align:
                "right",
            },
            {
              title:
                "Invoices",
              width: 75,
              align:
                "right",
            },
          ],
          report.trends
            .sales.map(
              (item) => [
                formatDate(
                  item.date,
                ),
                formatCurrency(
                  item.sales,
                ),
                formatNumber(
                  item.invoices,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * PAYMENT TREND
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Payment Trend",
      );

      if (
        report.trends
          .payments.length ===
        0
      ) {
        addEmptyMessage(
          doc,
          "No payments recorded during this period.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Date",
              width: 245,
            },
            {
              title:
                "Amount",
              width: 175,
              align:
                "right",
            },
            {
              title:
                "Payments",
              width: 75,
              align:
                "right",
            },
          ],
          report.trends
            .payments.map(
              (item) => [
                formatDate(
                  item.date,
                ),
                formatCurrency(
                  item.amount,
                ),
                formatNumber(
                  item.payments,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * TOP PRODUCTS
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Top Products",
      );

      if (
        report.topProducts
          .length === 0
      ) {
        addEmptyMessage(
          doc,
          "No product sales recorded during this period.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Product",
              width: 205,
            },
            {
              title:
                "SKU",
              width: 115,
            },
            {
              title:
                "Quantity",
              width: 80,
              align:
                "right",
            },
            {
              title:
                "Revenue",
              width: 95,
              align:
                "right",
            },
          ],
          report.topProducts
            .map(
              (item) => [
                item.productName,
                item.sku ?? "—",
                formatNumber(
                  item.quantity,
                ),
                formatCurrency(
                  item.revenue,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * TOP CUSTOMERS
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Top Customers",
      );

      if (
        report.topCustomers
          .length === 0
      ) {
        addEmptyMessage(
          doc,
          "No customer purchase data available.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Customer",
              width: 165,
            },
            {
              title:
                "Invoices",
              width: 70,
              align:
                "right",
            },
            {
              title:
                "Purchases",
              width: 110,
              align:
                "right",
            },
            {
              title:
                "Paid",
              width: 100,
              align:
                "right",
            },
            {
              title:
                "Due",
              width: 100,
              align:
                "right",
            },
          ],
          report.topCustomers
            .map(
              (item) => [
                item.name,
                formatNumber(
                  item.invoiceCount,
                ),
                formatCurrency(
                  item.totalPurchases,
                ),
                formatCurrency(
                  item.totalPaid,
                ),
                formatCurrency(
                  item.totalDue,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * OUTSTANDING INVOICES
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Outstanding Invoices",
      );

      if (
        report
          .outstandingInvoices
          .length === 0
      ) {
        addEmptyMessage(
          doc,
          "No outstanding invoices for this period.",
        );
      } else {
        drawTable(
          doc,
          [
            {
              title:
                "Invoice",
              width: 85,
            },
            {
              title:
                "Customer",
              width: 145,
            },
            {
              title:
                "Due Date",
              width: 85,
            },
            {
              title:
                "Status",
              width: 105,
            },
            {
              title:
                "Amount Due",
              width: 125,
              align:
                "right",
            },
          ],
          report
            .outstandingInvoices
            .map(
              (invoice) => [
                invoice.invoiceNumber,
                invoice.customerName,
                formatDate(
                  invoice.dueDate,
                ),
                getStatusLabel(
                  invoice.status,
                ),
                formatCurrency(
                  invoice.amountDue,
                ),
              ],
            ),
        );
      }

      /*
       * ======================================================
       * INVENTORY OVERVIEW
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Inventory Overview",
      );

      addKeyValueGrid(
        doc,
        [
          {
            label:
              "Total Products",
            value:
              formatNumber(
                report
                  .inventory
                  .totalProducts,
              ),
          },
          {
            label:
              "Active Products",
            value:
              formatNumber(
                report
                  .inventory
                  .activeProducts,
              ),
          },
          {
            label:
              "Inactive Products",
            value:
              formatNumber(
                report
                  .inventory
                  .inactiveProducts,
              ),
          },
          {
            label:
              "Total Stock Units",
            value:
              formatNumber(
                report
                  .inventory
                  .totalStockUnits,
              ),
          },
          {
            label:
              "Low Stock Products",
            value:
              formatNumber(
                report
                  .inventory
                  .lowStockProducts,
              ),
          },
          {
            label:
              "Out of Stock Products",
            value:
              formatNumber(
                report
                  .inventory
                  .outOfStockProducts,
              ),
          },
        ],
      );

      /*
       * ======================================================
       * WARRANTY OVERVIEW
       * ======================================================
       */

      addSectionTitle(
        doc,
        "Warranty Overview",
      );

      addKeyValueGrid(
        doc,
        [
          {
            label:
              "Total",
            value:
              formatNumber(
                report
                  .warranties
                  .total,
              ),
          },
          {
            label:
              "Active",
            value:
              formatNumber(
                report
                  .warranties
                  .active,
              ),
          },
          {
            label:
              "Expiring Soon",
            value:
              formatNumber(
                report
                  .warranties
                  .expiringSoon,
              ),
          },
          {
            label:
              "Expired",
            value:
              formatNumber(
                report
                  .warranties
                  .expired,
              ),
          },
          {
            label:
              "No Warranty",
            value:
              formatNumber(
                report
                  .warranties
                  .noWarranty,
              ),
          },
        ],
      );

      /*
       * ======================================================
       * FOOTER
       * ======================================================
       */

      addFooter(doc);

      doc.end();
    },
  );
}