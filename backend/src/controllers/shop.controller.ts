import type { Response } from "express";
import {
  createShopForOwner,
  getShopForOwner,
  updateShopForOwner,
} from "../services/shop.service";
import {
  createShopSchema,
  updateShopSchema,
} from "../validators/shop.validator";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function createShop(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = createShopSchema.parse(req.body);

  const shop = await createShopForOwner(
    req.user.id,
    input,
  );

  res.status(201).json({
    success: true,
    message: "Shop created successfully.",
    data: {
      shop,
    },
  });
}

export async function getMyShop(
  req: AuthenticatedRequest,
  res: Response,
) {
  const shop = await getShopForOwner(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      shop,
    },
  });
}

export async function updateMyShop(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input = updateShopSchema.parse(req.body);

  const shop = await updateShopForOwner(
    req.user.id,
    input,
  );

  res.status(200).json({
    success: true,
    message: "Shop updated successfully.",
    data: {
      shop,
    },
  });
}