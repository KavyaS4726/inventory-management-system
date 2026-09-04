import { getFirestore } from "../config/firebase";
import { ApiError } from "../utils/ApiError";

const ROLES_COLLECTION = "roles";
const PERMISSIONS_COLLECTION = "permissions";

type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete";

export type PermissionMap = Record<
  string,
  Partial<Record<PermissionAction, boolean>>
>;

/**
 * Get permissions for one role.
 *
 * Firestore structure:
 *
 * permissions
 *   └── {roleId}
 *         ├── roleId
 *         ├── permissions
 *         └── updatedAt
 */
export async function getPermissionsForRole(
  roleId: string
): Promise<PermissionMap> {
  const db = getFirestore();

  const permissionDoc = await db
    .collection(PERMISSIONS_COLLECTION)
    .doc(roleId)
    .get();

  if (!permissionDoc.exists) {
    return {};
  }

  const data = permissionDoc.data() || {};

  return (data.permissions || {}) as PermissionMap;
}

/**
 * Convert a permission map into permission IDs.
 *
 * Example:
 *
 * {
 *   products: {
 *     view: true,
 *     create: true
 *   }
 * }
 *
 * becomes:
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

  for (const [module, actions] of Object.entries(
    permissions
  )) {
    for (const action of [
      "view",
      "create",
      "edit",
      "delete",
    ] as PermissionAction[]) {
      if (actions?.[action] === true) {
        ids.push(`${module}_${action}`);
      }
    }
  }

  return ids;
}

/**
 * Replace ALL permissions for a role.
 *
 * IMPORTANT:
 *
 * The permissions document belongs entirely
 * to this role.
 *
 * permissions/{roleId}
 *
 * Therefore we intentionally DO NOT use
 * merge: true here.
 *
 * Using merge: true can leave old nested
 * permission fields behind.
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
    throw ApiError.notFound(
      `Role with id "${roleId}" not found`
    );
  }

  /**
   * Remove duplicate permission IDs.
   */
  const uniquePermissionIds = [
    ...new Set(permissionIds),
  ];

  const permissions: PermissionMap = {};

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
    const separatorIndex =
      permissionId.lastIndexOf("_");

    if (separatorIndex === -1) {
      continue;
    }

    const module =
      permissionId.substring(
        0,
        separatorIndex
      );

    const action =
      permissionId.substring(
        separatorIndex + 1
      ) as PermissionAction;

    if (
      ![
        "view",
        "create",
        "edit",
        "delete",
      ].includes(action)
    ) {
      continue;
    }

    if (!permissions[module]) {
      permissions[module] = {};
    }

    permissions[module][action] = true;
  }

  /**
   * IMPORTANT:
   *
   * Replace the entire document.
   *
   * DO NOT use:
   *
   * { merge: true }
   *
   * because removed permissions must actually
   * disappear from Firestore.
   *
   * Example:
   *
   * BEFORE:
   *
   * buyers:
   *   view: true
   *   create: true
   *
   * AFTER user unchecks buyers:
   *
   * buyers should not exist at all.
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