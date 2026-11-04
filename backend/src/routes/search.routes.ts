import { Router } from "express";
import { globalSearch } from "../controllers/search.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth, requireRole("shopkeeper"));
router.get("/", asyncHandler(globalSearch));
export default router;
