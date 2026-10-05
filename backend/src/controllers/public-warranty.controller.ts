import type {
  Request,
  Response,
} from "express";

import {
  getPublicWarranty,
} from "../services/customer-portal.service";

import {
  ApiError,
} from "../utils/api-error";

export async function getPublicWarrantyCard(
  request: Request,
  response: Response,
) {
  const warrantyId =
    typeof request.params.warrantyId ===
    "string"
      ? request.params.warrantyId
      : "";

  const token =
    typeof request.params.token ===
    "string"
      ? request.params.token
      : "";

  if (!warrantyId || !token) {
    throw new ApiError(
      400,
      "Invalid warranty verification link.",
      "INVALID_WARRANTY_LINK",
    );
  }

  const data =
    await getPublicWarranty(
      warrantyId,
      token,
    );

  response.status(200).json({
    success: true,
    data,
  });
}
