import type { Response } from "express";

import {
  getReportsForOwner,
} from "../services/report.service";

import {
  generateReportPdf,
} from "../services/report-pdf.service";

import {
  reportQuerySchema,
} from "../validators/report.validator";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

export async function getReports(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    reportQuerySchema.parse(
      req.query,
    );

  const result =
    await getReportsForOwner(
      req.user.id,
      {
        startDate:
          query.startDate,

        endDate:
          query.endDate,
      },
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function downloadReportPdf(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    reportQuerySchema.parse(
      req.query,
    );

  const pdf =
    await generateReportPdf(
      req.user.id,
      {
        startDate:
          query.startDate,

        endDate:
          query.endDate,
      },
    );

  const startDate =
    query.startDate
      ? new Date(
          query.startDate,
        )
          .toISOString()
          .slice(0, 10)
      : "report";

  const endDate =
    query.endDate
      ? new Date(
          query.endDate,
        )
          .toISOString()
          .slice(0, 10)
      : "report";

  const filename =
    `billnest-report-${startDate}-to-${endDate}.pdf`;

  res.status(200);

  res.setHeader(
    "Content-Type",
    "application/pdf",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  res.setHeader(
    "Content-Length",
    pdf.length,
  );

  res.end(pdf);
}