import { Router } from "express";
import {
  createBuyerHandler,
  getAllBuyersHandler,
  getBuyerByIdHandler,
  updateBuyerHandler,
  deleteBuyerHandler,
} from "../controllers/buyer.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createBuyerSchema,
  updateBuyerSchema,
} from "../validators/buyer.validator";

const router = Router();

/**
 * @openapi
 * /buyers:
 *   post:
 *     summary: Create a new buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Buyer created
 */
router.post(
  "/",
  authenticate,
  checkPermission("buyers", "create"),
  validate(createBuyerSchema),
  createBuyerHandler
);

/**
 * @openapi
 * /buyers:
 *   get:
 *     summary: Get all buyers
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buyers
 */
router.get(
  "/",
  authenticate,
  checkPermission("buyers", "view"),
  getAllBuyersHandler
);

/**
 * @openapi
 * /buyers/{id}:
 *   get:
 *     summary: Get a buyer by ID
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer found
 *       404:
 *         description: Buyer not found
 */
router.get(
  "/:id",
  authenticate,
  checkPermission("buyers", "view"),
  getBuyerByIdHandler
);

/**
 * @openapi
 * /buyers/{id}:
 *   put:
 *     summary: Update a buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer updated
 */
router.put(
  "/:id",
  authenticate,
  checkPermission("buyers", "edit"),
  validate(updateBuyerSchema),
  updateBuyerHandler
);

/**
 * @openapi
 * /buyers/{id}:
 *   delete:
 *     summary: Delete a buyer
 *     tags: [Buyer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer deleted
 */
router.delete(
  "/:id",
  authenticate,
  checkPermission("buyers", "delete"),
  deleteBuyerHandler
);

export default router;