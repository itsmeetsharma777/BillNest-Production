import type { Response } from "express";

import {
  getReportsForOwner,
} from "../services/report.service";

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