import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import { getDashboardForOwner } from "../services/dashboard.service";

import { dashboardQuerySchema } from "../validators/dashboard.validator";

export async function getDashboard(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query = dashboardQuerySchema.parse(
    req.query,
  );

  const dashboard = await getDashboardForOwner(
    req.user.id,
  );

  res.status(200).json({
    success: true,
    data: dashboard,
  });
}