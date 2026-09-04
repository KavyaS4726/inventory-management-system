import { Router } from "express";
import {
  createSupplierHandler,
  getAllSuppliersHandler,
  getSupplierByIdHandler,
  updateSupplierHandler,
  deleteSupplierHandler,
} from "../controllers/supplier.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validate } from "../middleware/validate.middleware";
import { createSupplierSchema, updateSupplierSchema } from "../validators/supplier.validator";

const router = Router();

/**
 * @openapi
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Distributors
 *               email:
 *                 type: string
 *                 example: contact@acme.com
 *               phone:
 *                 type: string
 *                 example: "+91 9876543210"
 *               address:
 *                 type: string
 *                 example: 12 Industrial Road, Chennai
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — insufficient permission
 */
router.post(
  "/",
  authenticate,
  checkPermission("suppliers", "create"),
  validate(createSupplierSchema),
  createSupplierHandler
);

/**
 * @openapi
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, checkPermission("suppliers", "view"), getAllSuppliersHandler);

/**
 * @openapi
 * /suppliers/{id}:
 *   get:
 *     summary: Get a supplier by ID
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier found
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticate, checkPermission("suppliers", "view"), getSupplierByIdHandler);

/**
 * @openapi
 * /suppliers/{id}:
 *   put:
 *     summary: Update a supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — insufficient permission
 */
router.put(
  "/:id",
  authenticate,
  checkPermission("suppliers", "edit"),
  validate(updateSupplierSchema),
  updateSupplierHandler
);

/**
 * @openapi
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       403:
 *         description: Forbidden — insufficient permission
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticate, checkPermission("suppliers", "delete"), deleteSupplierHandler);

export default router;