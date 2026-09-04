import { Router } from "express";
import { dashboardSummaryHandler } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";

const router = Router();

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary (stock overview and reports)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: >
 *           Summary including total products, total stock value,
 *           low-stock items, recent stock movements, and products
 *           grouped by category
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/summary",
  authenticate,
  checkPermission("dashboard", "view"),
  dashboardSummaryHandler
);

export default router;