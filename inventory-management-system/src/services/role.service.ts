import { getFirestore } from "../config/firebase";
import { ApiError } from "../utils/ApiError";
import {
  RoleDoc,
  CreateRoleInput,
  UpdateRoleInput,
} from "../models/role.model";
import {
  getPermissionsForRole,
  getPermissionIdsForRole,
  replaceRolePermissions,
} from "./rolePermission.service";

const ROLES_COLLECTION = "roles";
const USERS_COLLECTION = "users";
const PERMISSIONS_COLLECTION = "permissions";

function collection() {
  return getFirestore().collection(ROLES_COLLECTION);
}

function usersCollection() {
  return getFirestore().collection(USERS_COLLECTION);
}

/**
 * Get all roles.
 */
export async function getAllRoles(): Promise<RoleDoc[]> {
  const snapshot = await collection()
    .orderBy("createdAt", "desc")
    .get();

  const roles: RoleDoc[] = [];

  for (const doc of snapshot.docs) {
    const role = doc.data() as RoleDoc;

    const permissionIds =
      await getPermissionIdsForRole(doc.id);

    roles.push({
      ...role,
      id: doc.id,
      permissionIds,
    });
  }

  return roles;
}

/**
 * Get one role.
 */
export async function getRoleById(
  id: string
): Promise<RoleDoc> {
  const doc = await collection()
    .doc(id)
    .get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `Role with id "${id}" not found`
    );
  }

  const role = doc.data() as RoleDoc;

  const permissionIds =
    await getPermissionIdsForRole(id);

  return {
    ...role,
    id: doc.id,
    permissionIds,
  };
}

/**
 * Find role by lowercase name.
 */
async function findByNameLower(
  nameLower: string
) {
  const snapshot = await collection()
    .where("nameLower", "==", nameLower)
    .limit(1)
    .get();

  return snapshot.empty
    ? null
    : snapshot.docs[0];
}

/**
 * Make sure a user is not already assigned
 * to another role.
 */
async function assertUsersNotAlreadyAssigned(
  userUids: string[],
  excludeRoleId?: string
) {
  if (userUids.length === 0) {
    return;
  }

  const snapshot =
    await collection().get();

  for (const doc of snapshot.docs) {
    if (doc.id === excludeRoleId) {
      continue;
    }

    const role = doc.data() as RoleDoc;

    const currentUsers =
      role.users || [];

    const conflictUid =
      currentUsers.find((uid) =>
        userUids.includes(uid)
      );

    if (conflictUid) {
      const userDoc =
        await usersCollection()
          .doc(conflictUid)
          .get();

      const user = userDoc.exists
        ? userDoc.data()
        : null;

      const label = user
        ? `${user.name || "User"} (${user.email || conflictUid})`
        : conflictUid;

      throw ApiError.badRequest(
        `${label} is already assigned to the role "${role.name}". Remove them from that role first.`
      );
    }
  }
}

/**
 * Synchronize roleId on users.
 */
async function syncUsersToRole(
  roleId: string,
  userUids: string[],
  previousUserUids: string[] = []
) {
  const db = getFirestore();

  const batch = db.batch();

  const newUsers = [
    ...new Set(userUids),
  ];

  const oldUsers = [
    ...new Set(previousUserUids),
  ];

  const removedUsers =
    oldUsers.filter(
      (uid) => !newUsers.includes(uid)
    );

  /**
   * Remove role from users that
   * were removed from this role.
   */
  for (const uid of removedUsers) {
    const userRef =
      usersCollection().doc(uid);

    batch.update(userRef, {
      roleId: null,
      updatedAt: new Date(),
    });
  }

  /**
   * Assign role to current users.
   */
  for (const uid of newUsers) {
    const userRef =
      usersCollection().doc(uid);

    batch.update(userRef, {
      roleId,
      updatedAt: new Date(),
    });
  }

  if (
    removedUsers.length > 0 ||
    newUsers.length > 0
  ) {
    await batch.commit();
  }
}

/**
 * Create a new role.
 */
export async function createRole(
  input: CreateRoleInput
): Promise<RoleDoc> {
  const name = input.name.trim();

  const nameLower =
    name.toLowerCase();

  const userUids = [
    ...new Set(input.users || []),
  ];

  const permissionIds = [
    ...new Set(
      input.permissionIds || []
    ),
  ];

  const existing =
    await findByNameLower(nameLower);

  if (existing) {
    throw ApiError.badRequest(
      `A role named "${name}" already exists`
    );
  }

  await assertUsersNotAlreadyAssigned(
    userUids
  );

  const now = new Date();

  const roleData = {
    name,
    nameLower,
    users: userUids,
    isSystem: false,
    isActive:
      input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef =
    await collection().add(
      roleData
    );

  await syncUsersToRole(
    docRef.id,
    userUids
  );

  await replaceRolePermissions(
    docRef.id,
    permissionIds
  );

  return {
    ...roleData,
    id: docRef.id,
    permissionIds,
  } as RoleDoc;
}

/**
 * Update an existing role.
 */
export async function updateRole(
  id: string,
  input: UpdateRoleInput
): Promise<RoleDoc> {
  const db = getFirestore();

  const docRef =
    db.collection(
      ROLES_COLLECTION
    ).doc(id);

  const doc =
    await docRef.get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `Role with id "${id}" not found`
    );
  }

  const existingRole =
    doc.data() as RoleDoc;

  /**
   * ----------------------------------------
   * ROLE DATA
   * ----------------------------------------
   */
  const updateData: Record<
    string,
    any
  > = {
    updatedAt: new Date(),
  };

  /**
   * Update role name.
   */
  if (input.name !== undefined) {
    const roleName =
      input.name.trim();

    const nameLower =
      roleName.toLowerCase();

    const existing =
      await findByNameLower(
        nameLower
      );

    if (
      existing &&
      existing.id !== id
    ) {
      throw ApiError.badRequest(
        `A role named "${roleName}" already exists`
      );
    }

    updateData.name =
      roleName;

    updateData.nameLower =
      nameLower;
  }

  /**
   * Update active state.
   */
  if (
    input.isActive !== undefined
  ) {
    updateData.isActive =
      input.isActive;
  }

  /**
   * ----------------------------------------
   * USERS
   * ----------------------------------------
   */
  let userUids =
    existingRole.users || [];

  if (
    input.users !== undefined
  ) {
    userUids = [
      ...new Set(input.users),
    ];

    await assertUsersNotAlreadyAssigned(
      userUids,
      id
    );

    updateData.users =
      userUids;
  }

  /**
   * ----------------------------------------
   * SAVE ROLE
   * ----------------------------------------
   */
  await docRef.update(
    updateData
  );

  /**
   * Synchronize users.
   */
  await syncUsersToRole(
    id,
    userUids,
    existingRole.users || []
  );

  /**
   * ----------------------------------------
   * SAVE PERMISSIONS
   * ----------------------------------------
   *
   * IMPORTANT:
   *
   * Even when permissionIds is an empty
   * array, we must save it.
   *
   * This allows removing ALL permissions.
   */
  if (
    input.permissionIds !==
    undefined
  ) {
    const permissionIds = [
      ...new Set(
        input.permissionIds
      ),
    ];

    await replaceRolePermissions(
      id,
      permissionIds
    );
  }

  /**
   * ----------------------------------------
   * READ BACK FROM FIRESTORE
   * ----------------------------------------
   *
   * This guarantees that the API response
   * contains the actual saved values.
   */
  const updated =
    await docRef.get();

  if (!updated.exists) {
    throw ApiError.notFound(
      `Role with id "${id}" not found after update`
    );
  }

  const permissionIds =
    await getPermissionIdsForRole(
      id
    );

  return {
    ...(updated.data() as RoleDoc),
    id: updated.id,
    permissionIds,
  } as RoleDoc;
}

/**
 * Delete a role.
 */
export async function deleteRole(
  id: string
): Promise<void> {
  const docRef =
    collection().doc(id);

  const doc =
    await docRef.get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `Role with id "${id}" not found`
    );
  }

  const role =
    doc.data() as RoleDoc;

  if (role.isSystem) {
    throw ApiError.badRequest(
      "System roles cannot be deleted"
    );
  }

  if (
    role.users &&
    role.users.length > 0
  ) {
    throw ApiError.badRequest(
      "This role still has users assigned to it. Reassign them before deleting this role."
    );
  }

  const db =
    getFirestore();

  await db
    .collection(
      PERMISSIONS_COLLECTION
    )
    .doc(id)
    .delete();

  await docRef.delete();
}

/**
 * Get permissions for logged-in user.
 */
export async function getPermissionsForUser(
  uid: string
): Promise<
  Record<
    string,
    Record<string, boolean>
  >
> {
  const userDoc =
    await usersCollection()
      .doc(uid)
      .get();

  if (!userDoc.exists) {
    return {};
  }

  const user =
    userDoc.data();

  if (!user?.roleId) {
    return {};
  }

  const roleDoc =
    await collection()
      .doc(user.roleId)
      .get();

  if (!roleDoc.exists) {
    return {};
  }

  const role =
    roleDoc.data() as RoleDoc;

  if (
    role.isActive === false
  ) {
    return {};
  }

  return getPermissionsForRole(
    user.roleId
  );
}

/**
 * Initialize system Admin role.
 */
export async function initializeSystemRoles(): Promise<void> {
  const db =
    getFirestore();

  const adminPermissions = [
    "dashboard_view",
    "dashboard_create",
    "dashboard_edit",
    "dashboard_delete",

    "products_view",
    "products_create",
    "products_edit",
    "products_delete",

    "categories_view",
    "categories_create",
    "categories_edit",
    "categories_delete",

    "suppliers_view",
    "suppliers_create",
    "suppliers_edit",
    "suppliers_delete",

    "stockMovements_view",
    "stockMovements_create",
    "stockMovements_edit",
    "stockMovements_delete",

    "buyers_view",
    "buyers_create",
    "buyers_edit",
    "buyers_delete",

    "orders_view",
    "orders_create",
    "orders_edit",
    "orders_delete",

    "users_view",
    "users_create",
    "users_edit",
    "users_delete",

    "roles_view",
    "roles_create",
    "roles_edit",
    "roles_delete",
  ];

  const existingSnapshot =
    await collection()
      .where(
        "nameLower",
        "==",
        "admin"
      )
      .limit(1)
      .get();

  let adminRoleId: string;

  if (
    existingSnapshot.empty
  ) {
    const roleRef =
      collection().doc();

    await roleRef.set({
      name: "Admin",
      nameLower: "admin",
      users: [],
      isSystem: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    adminRoleId =
      roleRef.id;

    console.log(
      "System Admin role created."
    );
  } else {
    const adminDoc =
      existingSnapshot.docs[0];

    await adminDoc.ref.update({
      isSystem: true,
      isActive: true,
      updatedAt: new Date(),
    });

    adminRoleId =
      adminDoc.id;

    console.log(
      "System Admin role already exists."
    );
  }

  await replaceRolePermissions(
    adminRoleId,
    adminPermissions
  );

  const adminUsersSnapshot =
    await usersCollection()
      .where(
        "role",
        "==",
        "admin"
      )
      .get();

  if (
    adminUsersSnapshot.empty
  ) {
    console.log(
      "No existing admin users found."
    );
    return;
  }

  const batch =
    db.batch();

  adminUsersSnapshot.docs.forEach(
    (userDoc) => {
      const userData =
        userDoc.data();

      if (!userData.roleId) {
        batch.update(
          userDoc.ref,
          {
            roleId:
              adminRoleId,
            updatedAt:
              new Date(),
          }
        );
      }
    }
  );

  await batch.commit();

  console.log(
    `System Admin role initialized. ${adminUsersSnapshot.size} admin user(s) checked.`
  );
}