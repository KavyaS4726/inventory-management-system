import { Router } from "express";

import {
  getAllPermissionsHandler,
  getPermissionByIdHandler,
} from "../controllers/permission.controller";

import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";

const router = Router();

/**
 * Get available permission definitions.
 *
 * Definitions come from code.
 */
router.get(
  "/",
  authenticate,
  checkPermission("roles", "view"),
  getAllPermissionsHandler
);

/**
 * Get one permission definition.
 */
router.get(
  "/:id",
  authenticate,
  checkPermission("roles", "view"),
  getPermissionByIdHandler
);

export default router;