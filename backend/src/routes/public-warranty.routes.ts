import { Router } from "express";

import {
  getPublicWarrantyCard,
} from "../controllers/public-warranty.controller";

import {
  asyncHandler,
} from "../utils/async-handler";

const router = Router();

router.get(
  "/warranties/:warrantyId/:token",
  asyncHandler(
    getPublicWarrantyCard,
  ),
);

export default router;
