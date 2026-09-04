import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller";

import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";

import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "../models/inventoryItem.model";

const router = Router();

// View inventory
router.get(
  "/",
  authenticate,
  checkPermission("inventoryItems", "view"),
  inventoryController.getAllItems
);

// View single inventory item
router.get(
  "/:id",
  authenticate,
  checkPermission("inventoryItems", "view"),
  inventoryController.getItemById
);

// Create inventory item
router.post(
  "/",
  authenticate,
  checkPermission("inventoryItems", "create"),
  validateBody(createInventoryItemSchema),
  inventoryController.createItem
);

// Edit inventory item
router.patch(
  "/:id",
  authenticate,
  checkPermission("inventoryItems", "edit"),
  validateBody(updateInventoryItemSchema),
  inventoryController.updateItem
);

// Delete inventory item
router.delete(
  "/:id",
  authenticate,
  checkPermission("inventoryItems", "delete"),
  inventoryController.deleteItem
);

// Adjust stock
router.post(
  "/:id/adjust-stock",
  authenticate,
  checkPermission("inventoryItems", "edit"),
  inventoryController.adjustStock
);

export default router;