import { Router } from "express";
import {
  getAllRolesHandler,
  getRoleByIdHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from "../controllers/role.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validateBody } from "../middleware/validate";
import { createRoleSchema, updateRoleSchema } from "../models/role.model";

const router = Router();

router.get("/", authenticate, checkPermission("roles", "view"), getAllRolesHandler);
router.get("/:id", authenticate, checkPermission("roles", "view"), getRoleByIdHandler);
router.post(
  "/",
  authenticate,
  checkPermission("roles", "create"),
  validateBody(createRoleSchema),
  createRoleHandler
);
router.patch(
  "/:id",
  authenticate,
  checkPermission("roles", "edit"),
  validateBody(updateRoleSchema),
  updateRoleHandler
);
router.delete("/:id", authenticate, checkPermission("roles", "delete"), deleteRoleHandler);

export default router;