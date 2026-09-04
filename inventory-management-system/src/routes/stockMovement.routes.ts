import { Router } from "express";
import {
  stockInHandler,
  stockOutHandler,
  stockHistoryHandler,
  getAllMovementsHandler,
  getSupplierHistoryHandler,
} from "../controllers/stockMovement.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validate } from "../middleware/validate.middleware";
import { stockMovementSchema } from "../validators/stockMovement.validator";

const router = Router();

/**
 * @openapi
 * /stock-movements/in:
 *   post:
 *     summary: Record stock coming in (increase quantity)
 *     tags: [StockMovement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity, supplierId, unitPrice]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: prod_12345
 *               quantity:
 *                 type: number
 *                 example: 50
 *               supplierId:
 *                 type: string
 *                 example: supplier_67890
 *               unitPrice:
 *                 type: number
 *                 example: 50
 *               note:
 *                 type: string
 *                 example: Restock from supplier delivery
 *     responses:
 *       201:
 *         description: Stock-in recorded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.post("/in", authenticate, checkPermission("stockMovements", "create"), validate(stockMovementSchema), stockInHandler);

/**
 * @openapi
 * /stock-movements/out:
 *   post:
 *     summary: Record stock going out (decrease quantity)
 *     tags: [StockMovement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: prod_12345
 *               quantity:
 *                 type: number
 *                 example: 10
 *               note:
 *                 type: string
 *                 example: Shipped to warehouse B
 *     responses:
 *       201:
 *         description: Stock-out recorded successfully
 *       400:
 *         description: Validation error, or insufficient stock for this quantity
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.post("/out", authenticate, checkPermission("stockMovements", "create"), validate(stockMovementSchema), stockOutHandler);

/**
 * @openapi
 * /stock-movements/history/{productId}:
 *   get:
 *     summary: Get stock movement history for a product
 *     tags: [StockMovement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of stock movements for the product
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, checkPermission("stockMovements", "view"), getAllMovementsHandler);
router.get("/history/:productId", authenticate, checkPermission("stockMovements", "view"), stockHistoryHandler);

/**
 * @openapi
 * /stock-movements/supplier/{supplierId}:
 *   get:
 *     summary: Get stock-in history for a supplier
 *     tags: [StockMovement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: List of stock-in movements from this supplier, with totals
 *       401:
 *         description: Unauthorized
 */
router.get("/supplier/:supplierId", authenticate, checkPermission("stockMovements", "view"), getSupplierHistoryHandler);

export default router;