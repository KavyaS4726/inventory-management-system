import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth.middleware";
import { checkPermission } from "../middleware/checkPermission.middleware";
import { updateUserSchema, createUserSchema } from "../models/user.model";

const router = Router();

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Staff User
 *               email:
 *                 type: string
 *                 example: staff@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error, or email already in use
 *       403:
 *         description: Forbidden — insufficient permission
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticate,
  checkPermission("users", "create"),
  validateBody(createUserSchema),
  userController.createUser
);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden — insufficient permission
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, checkPermission("users", "view"), userController.getAllUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden — insufficient permission
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticate, checkPermission("users", "view"), userController.getUserById);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden — insufficient permission
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id",
  authenticate,
  checkPermission("users", "edit"),
  validateBody(updateUserSchema),
  userController.updateUser
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden — insufficient permission
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authenticate, checkPermission("users", "delete"), userController.deleteUser);

export default router;