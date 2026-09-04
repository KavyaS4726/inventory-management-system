import { z } from "zod";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;

  /**
   * Dynamic role assigned to the user.
   *
   * roleId is the source of truth.
   */
  roleId?: string | null;

  isActive: boolean;

  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

/**
 * Public registration.
 *
 * A role is NOT supplied here.
 * Roles are assigned through the Roles & Permissions system.
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .refine((val) => !/^\d+$/.test(val), {
      message: "Name cannot be only numbers",
    }),

  email: z
    .string()
    .email("Invalid email")
    .refine((val) => val.endsWith(".com"), {
      message: "Email must end with .com",
    }),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(10, "Password must be at most 10 characters"),
});

/**
 * Login
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Update user.
 *
 * roleId identifies the dynamic role assigned to the user.
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .refine((val) => !/^\d+$/.test(val), {
      message: "Name cannot be only numbers",
    })
    .optional(),

  roleId: z.string().trim().min(1).nullable().optional(),

  isActive: z.boolean().optional(),
});

/**
 * Admin-created user.
 *
 * The admin can optionally assign a dynamic role.
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z.string().email("Invalid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  roleId: z.string().trim().min(1).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;