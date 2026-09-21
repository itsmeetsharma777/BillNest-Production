import PDFDocument from "pdfkit";

import {
  getReportsForOwner,
} from "./report.service";

type ReportData = Awaited<
  ReturnType<typeof getReportsForOwner>
>;

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(Number(value) || 0);
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

  const date = new Date(value);

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

function addTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .text(title);

  doc.moveDown(0.3);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#6B7280");
}

function addSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
) {
  if (
    doc.y > 700
  ) {
    doc.addPage();
  }

  doc.moveDown(0.8);

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .text(title);

  doc.moveDown(0.35);

  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#E5E7EB")
    .stroke();

  doc.moveDown(0.4);
}

function addKeyValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
) {
  if (
    doc.y > 750
  ) {
    doc.addPage();
  }

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#6B7280")
    .text(
      label,
      55,
      doc.y,
      {
        continued: true,
        width: 220,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .text(
      ` ${value}`,
      {
        width: 300,
      },
    );
}

function addTableHeader(
  doc: PDFKit.PDFDocument,
  columns: string[],
  widths: number[],
) {
  const startX = 50;
  const y = doc.y;

  let x = startX;

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor("#374151");

  columns.forEach(
    (column, index) => {
      doc.text(
        column,
        x,
        y,
        {
          width:
            widths[index],
          continued: false,
        },
      );

      x += widths[index];
    },
  );

  doc
    .moveTo(
      startX,
      y + 14,
    )
    .lineTo(
      545,
      y + 14,
    )
    .strokeColor("#D1D5DB")
    .stroke();

  doc.y = y + 22;
}

function addTableRow(
  doc: PDFKit.PDFDocument,
  values: string[],
  widths: number[],
) {
  if (
    doc.y > 745
  ) {
    doc.addPage();
  }

  const startX = 50;
  const y = doc.y;

  let x = startX;

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#374151");

  values.forEach(
    (value, index) => {
      doc.text(
        value,
        x,
        y,
        {
          width:
            widths[index],
          height: 32,
          ellipsis: true,
        },
      );

      x += widths[index];
    },
  );

  doc.y =
    Math.max(
      y + 25,
      doc.y,
    );

  doc
    .moveTo(
      startX,
      doc.y,
    )
    .lineTo(
      545,
      doc.y,
    )
    .strokeColor("#F3F4F6")
    .stroke();

  doc.moveDown(0.25);
}

function addFooter(
  doc: PDFKit.PDFDocument,
) {
  const pageCount =
    doc.bufferedPageRange();

  for (
    let index = 0;
    index < pageCount.count;
    index += 1
  ) {
    doc.switchToPage(
      pageCount.start + index,
    );

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9CA3AF")
      .text(
        `BillNest Reports & Analytics  •  Page ${
          index + 1
        } of ${pageCount.count}`,
        50,
        800,
        {
          width: 495,
          align: "center",
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
            top: 50,
            bottom: 55,
            left: 50,
            right: 50,
          },
          bufferPages: true,
        });

      const chunks: Buffer[] =
        [];

      doc.on(
        "data",
        (chunk: Buffer) => {
          chunks.push(chunk);
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

      /* ==================================================== */
      /* TITLE                                                  */
      /* ==================================================== */

      addTitle(
        doc,
        "BillNest Reports & Analytics",
      );

      doc.text(
        `Report period: ${formatDate(
          report.period.startDate,
        )} — ${formatDate(
          report.period.endDate,
        )}`,
      );

      doc.moveDown(0.8);

      /* ==================================================== */
      /* SUMMARY                                                */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Summary",
      );

      addKeyValue(
        doc,
        "Total Invoices",
        formatNumber(
          report.overview
            .totalInvoices,
        ),
      );

      addKeyValue(
        doc,
        "Total Sales",
        formatCurrency(
          report.overview
            .totalSales,
        ),
      );

      addKeyValue(
        doc,
        "Total Subtotal",
        formatCurrency(
          report.overview
            .totalSubtotal,
        ),
      );

      addKeyValue(
        doc,
        "Total Discount",
        formatCurrency(
          report.overview
            .totalDiscount,
        ),
      );

      addKeyValue(
        doc,
        "Total Tax",
        formatCurrency(
          report.overview
            .totalTax,
        ),
      );

      addKeyValue(
        doc,
        "Average Invoice",
        formatCurrency(
          report.overview
            .averageInvoice,
        ),
      );

      addKeyValue(
        doc,
        "Amount Collected",
        formatCurrency(
          report.overview
            .amountCollected,
        ),
      );

      addKeyValue(
        doc,
        "Amount Outstanding",
        formatCurrency(
          report.overview
            .amountOutstanding,
        ),
      );

      addKeyValue(
        doc,
        "Collection Rate",
        `${report.overview.collectionRate}%`,
      );

      addKeyValue(
        doc,
        "Payment Count",
        formatNumber(
          report.overview
            .paymentCount,
        ),
      );

      /* ==================================================== */
      /* INVOICE STATUS                                         */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Invoice Status",
      );

      addTableHeader(
        doc,
        [
          "Status",
          "Count",
        ],
        [
          400,
          95,
        ],
      );

      addTableRow(
        doc,
        [
          "Paid",
          formatNumber(
            report.invoices.paid,
          ),
        ],
        [
          400,
          95,
        ],
      );

      addTableRow(
        doc,
        [
          "Partially Paid",
          formatNumber(
            report.invoices
              .partiallyPaid,
          ),
        ],
        [
          400,
          95,
        ],
      );

      addTableRow(
        doc,
        [
          "Draft",
          formatNumber(
            report.invoices.draft,
          ),
        ],
        [
          400,
          95,
        ],
      );

      addTableRow(
        doc,
        [
          "Cancelled",
          formatNumber(
            report.invoices
              .cancelled,
          ),
        ],
        [
          400,
          95,
        ],
      );

      addTableRow(
        doc,
        [
          "Total",
          formatNumber(
            report.invoices.total,
          ),
        ],
        [
          400,
          95,
        ],
      );

      /* ==================================================== */
      /* PAYMENT METHODS                                       */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Payment Methods",
      );

      if (
        report.payments.byMethod
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No payment data available.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Payment Method",
            "Count",
            "Amount",
          ],
          [
            275,
            90,
            130,
          ],
        );

        report.payments.byMethod.forEach(
          (item) => {
            addTableRow(
              doc,
              [
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
              [
                275,
                90,
                130,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* SALES TREND                                           */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Sales Trend",
      );

      if (
        report.trends.sales
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No sales recorded during this period.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Date",
            "Sales",
            "Invoices",
          ],
          [
            250,
            170,
            75,
          ],
        );

        report.trends.sales.forEach(
          (item) => {
            addTableRow(
              doc,
              [
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
              [
                250,
                170,
                75,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* PAYMENT TREND                                         */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Payment Trend",
      );

      if (
        report.trends.payments
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No payments recorded during this period.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Date",
            "Amount",
            "Payments",
          ],
          [
            250,
            170,
            75,
          ],
        );

        report.trends.payments.forEach(
          (item) => {
            addTableRow(
              doc,
              [
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
              [
                250,
                170,
                75,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* TOP PRODUCTS                                          */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Top Products",
      );

      if (
        report.topProducts
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No product sales recorded during this period.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Product",
            "SKU",
            "Quantity",
            "Revenue",
          ],
          [
            210,
            110,
            75,
            100,
          ],
        );

        report.topProducts.forEach(
          (item) => {
            addTableRow(
              doc,
              [
                item.productName,
                item.sku ?? "—",
                formatNumber(
                  item.quantity,
                ),
                formatCurrency(
                  item.revenue,
                ),
              ],
              [
                210,
                110,
                75,
                100,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* TOP CUSTOMERS                                         */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Top Customers",
      );

      if (
        report.topCustomers
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No customer purchase data available.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Customer",
            "Invoices",
            "Purchases",
            "Paid",
            "Due",
          ],
          [
            175,
            70,
            120,
            115,
            115,
          ],
        );

        report.topCustomers.forEach(
          (item) => {
            addTableRow(
              doc,
              [
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
              [
                175,
                70,
                120,
                115,
                115,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* OUTSTANDING INVOICES                                  */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Outstanding Invoices",
      );

      if (
        report.outstandingInvoices
          .length === 0
      ) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#6B7280")
          .text(
            "No outstanding invoices for this period.",
          );
      } else {
        addTableHeader(
          doc,
          [
            "Invoice",
            "Customer",
            "Due Date",
            "Status",
            "Amount Due",
          ],
          [
            90,
            155,
            90,
            95,
            115,
          ],
        );

        report.outstandingInvoices.forEach(
          (invoice) => {
            addTableRow(
              doc,
              [
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
              [
                90,
                155,
                90,
                95,
                115,
              ],
            );
          },
        );
      }

      /* ==================================================== */
      /* INVENTORY                                             */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Inventory Overview",
      );

      addKeyValue(
        doc,
        "Total Products",
        formatNumber(
          report.inventory
            .totalProducts,
        ),
      );

      addKeyValue(
        doc,
        "Active Products",
        formatNumber(
          report.inventory
            .activeProducts,
        ),
      );

      addKeyValue(
        doc,
        "Inactive Products",
        formatNumber(
          report.inventory
            .inactiveProducts,
        ),
      );

      addKeyValue(
        doc,
        "Total Stock Units",
        formatNumber(
          report.inventory
            .totalStockUnits,
        ),
      );

      addKeyValue(
        doc,
        "Low Stock Products",
        formatNumber(
          report.inventory
            .lowStockProducts,
        ),
      );

      addKeyValue(
        doc,
        "Out of Stock Products",
        formatNumber(
          report.inventory
            .outOfStockProducts,
        ),
      );

      /* ==================================================== */
      /* WARRANTY                                              */
      /* ==================================================== */

      addSectionTitle(
        doc,
        "Warranty Overview",
      );

      addKeyValue(
        doc,
        "Total",
        formatNumber(
          report.warranties.total,
        ),
      );

      addKeyValue(
        doc,
        "Active",
        formatNumber(
          report.warranties.active,
        ),
      );

      addKeyValue(
        doc,
        "Expiring Soon",
        formatNumber(
          report.warranties
            .expiringSoon,
        ),
      );

      addKeyValue(
        doc,
        "Expired",
        formatNumber(
          report.warranties.expired,
        ),
      );

      addKeyValue(
        doc,
        "No Warranty",
        formatNumber(
          report.warranties
            .noWarranty,
        ),
      );

      /* ==================================================== */
      /* FOOTER                                                */
      /* ==================================================== */

      addFooter(doc);

      doc.end();
    },
  );
}