import admin, { getFirestore } from "../config/firebase";
import {
  UpdateUserInput,
  UserProfile,
  CreateUserInput,
} from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { applyListQuery, ListQuery } from "../utils/queryHelper";

const USERS_COLLECTION = "users";
const ROLES_COLLECTION = "roles";

function collection() {
  return getFirestore().collection(USERS_COLLECTION);
}

function rolesCollection() {
  return getFirestore().collection(ROLES_COLLECTION);
}

export async function getAllUsers(query: ListQuery) {
  const snapshot = await collection().get();

  const users = snapshot.docs.map(
    (doc) => doc.data() as UserProfile
  );

  return applyListQuery(users, query, {
    searchableFields: ["name", "email"],
    filterableFields: ["isActive"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    defaultLimit: 10,
  });
}

export async function getUserById(
  uid: string
): Promise<UserProfile> {
  const doc = await collection().doc(uid).get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `User with id "${uid}" not found`
    );
  }

  return doc.data() as UserProfile;
}

export async function createUser(
  data: CreateUserInput
): Promise<UserProfile> {
  const existing = await collection()
    .where("email", "==", data.email)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw ApiError.badRequest(
      `A user with email "${data.email}" already exists`
    );
  }

  /*
   * If a role was supplied, make sure that role exists.
   * roleId is the source of truth for the user's role.
   */
  if (data.roleId) {
    const roleDoc = await rolesCollection()
      .doc(data.roleId)
      .get();

    if (!roleDoc.exists) {
      throw ApiError.badRequest(
        "Selected role does not exist"
      );
    }

    const roleData = roleDoc.data();

    if (roleData?.isActive === false) {
      throw ApiError.badRequest(
        "Selected role is inactive"
      );
    }
  }

  const userRecord = await admin.auth().createUser({
    email: data.email,
    password: data.password,
    displayName: data.name,
  });

  const now = new Date();

  const profile: UserProfile = {
    uid: userRecord.uid,
    name: data.name,
    email: data.email,
    roleId: data.roleId ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await collection()
    .doc(userRecord.uid)
    .set(profile);

  return profile;
}

export async function updateUser(
  uid: string,
  data: UpdateUserInput
): Promise<UserProfile> {
  const docRef = collection().doc(uid);

  const doc = await docRef.get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `User with id "${uid}" not found`
    );
  }

  /*
   * Validate roleId before assigning it.
   */
  if (data.roleId !== undefined && data.roleId !== null) {
    const roleDoc = await rolesCollection()
      .doc(data.roleId)
      .get();

    if (!roleDoc.exists) {
      throw ApiError.badRequest(
        "Selected role does not exist"
      );
    }

    const roleData = roleDoc.data();

    if (roleData?.isActive === false) {
      throw ApiError.badRequest(
        "Selected role is inactive"
      );
    }
  }

  await docRef.update({
    ...data,
    updatedAt: new Date(),
  });

  if (typeof data.isActive === "boolean") {
    await admin.auth().updateUser(uid, {
      disabled: !data.isActive,
    });
  }

  const updated = await docRef.get();

  return updated.data() as UserProfile;
}

export async function deleteUser(
  uid: string
): Promise<void> {
  const docRef = collection().doc(uid);

  const doc = await docRef.get();

  if (!doc.exists) {
    throw ApiError.notFound(
      `User with id "${uid}" not found`
    );
  }

  await admin.auth().deleteUser(uid);

  await docRef.delete();
}