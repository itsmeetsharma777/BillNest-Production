import { Router } from "express";
import { getUserPreferences, updateUserPreferences } from "../controllers/user-preferences.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.use(requireRole("shopkeeper", "customer"));
router.get("/", asyncHandler(getUserPreferences));
router.patch("/", asyncHandler(updateUserPreferences));
export default router;
