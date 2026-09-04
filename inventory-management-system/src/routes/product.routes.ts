import { Router } from "express";
import {
  createProductHandler,
  getAllProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/product.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validate } from "../middleware/validate.middleware";
import { createProductSchema, updateProductSchema } from "../validators/product.validator";

const router = Router();

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku, categoryId, supplierId, quantity, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Wireless Mouse
 *               sku:
 *                 type: string
 *                 example: WM-2026-001
 *               categoryId:
 *                 type: string
 *                 example: cat_12345
 *               supplierId:
 *                 type: string
 *                 example: sup_67890
 *               quantity:
 *                 type: number
 *                 example: 100
 *               price:
 *                 type: number
 *                 example: 499.99
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error, duplicate SKU, or invalid category/supplier reference
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — insufficient permission
 */
router.post(
  "/",
  authenticate,
  checkPermission("products", "create"),
  validate(createProductSchema),
  createProductHandler
);

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Get all products (supports filtering)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Filter by supplier ID
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter to only low-stock products
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, checkPermission("products", "view"), getAllProductsHandler);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticate, checkPermission("products", "view"), getProductByIdHandler);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error, duplicate SKU, or invalid category/supplier reference
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — insufficient permission
 */
router.put(
  "/:id",
  authenticate,
  checkPermission("products", "edit"),
  validate(updateProductSchema),
  updateProductHandler
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Forbidden — insufficient permission
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticate, checkPermission("products", "delete"), deleteProductHandler);

export default router;