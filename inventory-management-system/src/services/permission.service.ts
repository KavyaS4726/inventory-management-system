import { getFirestore } from "../config/firebase";
import {
  ACTIONS,
  MODULES,
  PermissionDoc,
  PermissionMap,
} from "../models/permission.model";

const PERMISSIONS_COLLECTION = "permissions";
const ROLES_COLLECTION = "roles";

/**
 * Generate all available permission definitions.
 *
 * IMPORTANT:
 *
 * These permissions are NOT stored individually
 * in Firestore.
 *
 * They are definitions used by the application.
 */
function getPermissionDefinitions(): PermissionDoc[] {
  const permissions: PermissionDoc[] = [];

  for (const module of MODULES) {
    for (const action of ACTIONS) {
      // Dashboard is view-only.
      if (
        module === "dashboard" &&
        action !== "view"
      ) {
        continue;
      }

      permissions.push({
        id: `${module}_${action}`,
        module,
        action,
        name: `${action} ${module}`,
        isActive: true,
      });
    }
  }

  return permissions;
}

/**
 * Get all available permission definitions.
 *
 * This reads from code, NOT Firestore.
 */
export async function getAllPermissions(): Promise<
  PermissionDoc[]
> {
  return getPermissionDefinitions();
}

/**
 * Get one permission definition.
 *
 * This reads from code, NOT Firestore.
 */
export async function getPermissionById(
  id: string
): Promise<PermissionDoc | null> {
  const permission =
    getPermissionDefinitions().find(
      (item) => item.id === id
    );

  return permission || null;
}

/**
 * Get permissions assigned to a role.
 *
 * Firestore:
 *
 * permissions/{roleId}
 */
export async function getPermissionsForRole(
  roleId: string
): Promise<PermissionMap> {
  const db = getFirestore();

  const doc = await db
    .collection(PERMISSIONS_COLLECTION)
    .doc(roleId)
    .get();

  if (!doc.exists) {
    return {} as PermissionMap;
  }

  const data = doc.data();

  if (!data?.permissions) {
    return {} as PermissionMap;
  }

  return data.permissions as PermissionMap;
}

/**
 * Convert:
 *
 * {
 *   products: {
 *     view: true,
 *     create: true
 *   }
 * }
 *
 * into:
 *
 * [
 *   "products_view",
 *   "products_create"
 * ]
 */
export async function getPermissionIdsForRole(
  roleId: string
): Promise<string[]> {
  const permissions =
    await getPermissionsForRole(roleId);

  const ids: string[] = [];

  for (const module of MODULES) {
    const modulePermissions =
      permissions[module];

    if (!modulePermissions) {
      continue;
    }

    for (const action of ACTIONS) {
      if (modulePermissions[action]) {
        ids.push(`${module}_${action}`);
      }
    }
  }

  return ids;
}

/**
 * Replace all permissions for a role.
 *
 * ONLY ONE Firestore document is used:
 *
 * permissions/{roleId}
 */
export async function replaceRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<void> {
  const db = getFirestore();

  /**
   * Make sure the role exists.
   */
  const roleDoc = await db
    .collection(ROLES_COLLECTION)
    .doc(roleId)
    .get();

  if (!roleDoc.exists) {
    throw new Error(
      `Role with id "${roleId}" not found`
    );
  }

  /**
   * Remove duplicate IDs.
   */
  const uniquePermissionIds = [
    ...new Set(permissionIds),
  ];

  /**
   * Start with an empty permission map.
   */
  const permissions: Record<
    string,
    Record<string, boolean>
  > = {};

  /**
   * Convert:
   *
   * products_view
   * products_create
   * categories_view
   *
   * into:
   *
   * {
   *   products: {
   *     view: true,
   *     create: true
   *   },
   *   categories: {
   *     view: true
   *   }
   * }
   */
  for (const permissionId of uniquePermissionIds) {
    const permission =
      getPermissionDefinitions().find(
        (item) => item.id === permissionId
      );

    /**
     * Ignore invalid permission IDs.
     */
    if (!permission) {
      continue;
    }

    if (!permissions[permission.module]) {
      permissions[permission.module] = {};
    }

    permissions[permission.module][
      permission.action
    ] = true;
  }

  /**
   * Save ONE document for the role.
   */
  await db
    .collection(PERMISSIONS_COLLECTION)
    .doc(roleId)
    .set({
      roleId,
      permissions,
      updatedAt: new Date(),
    });
}

/**
 * Assign one permission to a role.
 */
export async function assignPermissionToRole(
  roleId: string,
  permissionId: string
): Promise<void> {
  const currentIds =
    await getPermissionIdsForRole(roleId);

  if (!currentIds.includes(permissionId)) {
    currentIds.push(permissionId);
  }

  await replaceRolePermissions(
    roleId,
    currentIds
  );
}

/**
 * Remove one permission from a role.
 */
export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<void> {
  const currentIds =
    await getPermissionIdsForRole(roleId);

  const updatedIds =
    currentIds.filter(
      (id) => id !== permissionId
    );

  await replaceRolePermissions(
    roleId,
    updatedIds
  );
}