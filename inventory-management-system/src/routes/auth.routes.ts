import { Router } from "express";
import { z } from "zod";
import * as authController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth.middleware";
import { registerSchema, loginSchema } from "../models/user.model";

const router = Router();

const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
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
 *               
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", validateBody(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in and receive an auth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful, returns auth token
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateBody(loginSchema), authController.login);
router.post(
  "/google",
  authController.loginWithGoogle
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, authController.me);

/**
 * @openapi
 * /auth/me:
 *   patch:
 *     summary: Update the currently authenticated user's own name
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/me", authenticate, validateBody(updateMeSchema), authController.updateMe);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change the currently authenticated user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password incorrect, or validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

export default router;