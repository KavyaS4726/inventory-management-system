import { Router } from "express";
import {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  getBuyerOrderSummaryHandler,
} from "../controllers/order.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validate } from "../middleware/validate.middleware";
import { createOrderSchema } from "../validators/order.validator";

const router = Router();

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order for a buyer (deducts stock)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 */
router.post(
  "/",
  authenticate,
  checkPermission("orders", "create"),
  validate(createOrderSchema),
  createOrderHandler
);

router.get("/", authenticate, checkPermission("orders", "view"), getAllOrdersHandler);
router.get("/:id", authenticate, checkPermission("orders", "view"), getOrderByIdHandler);

router.get(
  "/buyer/:buyerId",
  authenticate,
  checkPermission("orders", "view"),
  getBuyerOrderSummaryHandler
);

export default router;