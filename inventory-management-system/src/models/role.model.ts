import { z } from "zod";

export interface RoleDoc {
  id: string;

  name: string;
  nameLower: string;

  /**
   * User UIDs assigned to this role.
   *
   * User's actual role is determined by:
   *
   * users/{uid}.roleId
   */
  users: string[];

  /**
   * System roles such as Admin cannot be deleted.
   */
  isSystem: boolean;

  /**
   * Inactive roles grant no permissions.
   */
  isActive: boolean;

  /**
   * Permissions are NOT stored inside the role document.
   *
   * They are stored separately in:
   *
   * permissions/{roleId}
   *
   * This field is exposed by the service/API response.
   */
  permissionIds: string[];

  createdAt: unknown;
  updatedAt: unknown;
}

export interface CreateRoleInput {
  /**
   * Name of the new role.
   */
  name: string;

  /**
   * User UIDs to assign to the role.
   */
  users?: string[];

  /**
   * Permission IDs such as:
   *
   * products_view
   * products_create
   * products_edit
   * products_delete
   */
  permissionIds?: string[];

  /**
   * Defaults to true.
   */
  isActive?: boolean;
}

export interface UpdateRoleInput {
  /**
   * New role name.
   */
  name?: string;

  /**
   * Replace the users assigned to this role.
   */
  users?: string[];

  /**
   * Replace the permissions assigned to this role.
   */
  permissionIds?: string[];

  /**
   * Enable/disable the role.
   */
  isActive?: boolean;
}

/**
 * Validation schema for creating a role.
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required."),

  users: z
    .array(z.string())
    .optional()
    .default([]),

  permissionIds: z
    .array(z.string())
    .optional()
    .default([]),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

/**
 * Validation schema for updating a role.
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .optional(),

  users: z
    .array(z.string())
    .optional(),

  permissionIds: z
    .array(z.string())
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});
