import { Router } from "express";

import {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  getDocumentsController,
} from "../controllers/document.controller";

import { requireAuth } from "../middleware/auth.middleware";

import { requireRole } from "../middleware/role.middleware";

import {
  uploadDocumentFile,
} from "../middleware/upload.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router =
  Router();

router.use(
  requireAuth,
);

router.use(
  requireRole("shopkeeper"),
);

router.post(
  "/",
  uploadDocumentFile,
  asyncHandler(
    createDocumentController,
  ),
);

router.get(
  "/",
  asyncHandler(
    getDocumentsController,
  ),
);

router.get(
  "/:documentId",
  asyncHandler(
    getDocumentController,
  ),
);

router.delete(
  "/:documentId",
  asyncHandler(
    deleteDocumentController,
  ),
);

export default router;