import { Router } from "express";

import {
  processOcrDocument,
} from "../controllers/ocr.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  uploadOcrImage,
} from "../middleware/upload.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router =
  Router();

/*
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

router.use(
  requireAuth,
);

/*
 * ============================================================
 * SHOPKEEPER ONLY
 * ============================================================
 */

router.use(
  requireRole("shopkeeper"),
);

/*
 * ============================================================
 * OCR DOCUMENT PROCESSING
 * ============================================================
 *
 * POST
 * /api/ocr/process
 *
 * Content-Type:
 * multipart/form-data
 *
 * Field:
 * file
 */

router.post(
  "/process",
  uploadOcrImage,
  asyncHandler(
    processOcrDocument,
  ),
);

export default router;