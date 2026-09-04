import admin, { getFirestore } from "../config/firebase";
import {
  RegisterInput,
  LoginInput,
  UserProfile,
} from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { getPermissionsForUser } from "./role.service";

const USERS_COLLECTION = "users";

/**
 * Register a new Firebase user and create their Firestore profile.
 *
 * Roles are assigned separately through the dynamic Roles & Permissions system.
 */
export async function registerUser(
  input: RegisterInput
): Promise<UserProfile> {
  const { name, email, password } = input;

  let userRecord;

  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
  } catch (err: any) {
    if (err.code === "auth/email-already-exists") {
      throw ApiError.badRequest(
        "An account with this email already exists"
      );
    }

    throw ApiError.badRequest(
      err.message || "Failed to create user"
    );
  }

  const now = new Date();

  const profile: UserProfile = {
    uid: userRecord.uid,
    email,
    name,
    roleId: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await getFirestore()
    .collection(USERS_COLLECTION)
    .doc(userRecord.uid)
    .set(profile);

  return profile;
}

/**
 * Login using Firebase Authentication REST API.
 */
export async function loginUser(
  input: LoginInput
): Promise<{
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw ApiError.internal(
      "FIREBASE_WEB_API_KEY is not configured on the server"
    );
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        returnSecureToken: true,
      }),
    }
  );

  const data: any = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message === "INVALID_LOGIN_CREDENTIALS"
        ? "Invalid email or password"
        : data?.error?.message || "Login failed";

    throw ApiError.badRequest(message);
  }

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

/**
 * Get the user's Firestore profile and dynamic permissions.
 */
export async function getUserProfile(
  uid: string
): Promise<UserProfile & { permissions: Record<string, any> }> {
  const doc = await getFirestore()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .get();

  if (!doc.exists) {
    throw ApiError.notFound("User profile not found");
  }

  const profile = doc.data() as UserProfile;

  const permissions = await getPermissionsForUser(uid);

  return {
    ...profile,
    permissions,
  };
}

/**
 * Update the currently logged-in user's own profile.
 *
 * Users can only change their name here.
 * Role assignment is handled by the Roles & Permissions system.
 */
export async function updateOwnProfile(
  uid: string,
  data: { name: string }
): Promise<UserProfile> {
  const docRef = getFirestore()
    .collection(USERS_COLLECTION)
    .doc(uid);

  const doc = await docRef.get();

  if (!doc.exists) {
    throw ApiError.notFound("User profile not found");
  }

  await docRef.update({
    name: data.name,
    updatedAt: new Date(),
  });

  await admin.auth().updateUser(uid, {
    displayName: data.name,
  });

  const updated = await docRef.get();

  return updated.data() as UserProfile;
}

/**
 * Change the currently logged-in user's password.
 */
export async function changePassword(
  uid: string,
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw ApiError.internal(
      "FIREBASE_WEB_API_KEY is not configured on the server"
    );
  }

  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    }
  );

  if (!verifyRes.ok) {
    throw ApiError.badRequest(
      "Current password is incorrect"
    );
  }

  await admin.auth().updateUser(uid, {
    password: newPassword,
  });
}
/**
 * Sign in / register a user through Google Firebase Authentication.
 *
 * The frontend sends a Firebase ID token obtained from Google Sign-In.
 * We verify that token with Firebase Admin and create a Firestore
 * profile if this is the user's first login.
 */
export async function loginWithGoogle(
  idToken: string
): Promise<{
  uid: string;
  email: string;
  name: string;
}> {
  let decodedToken;

  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch {
    throw ApiError.unauthorized("Invalid Google authentication token");
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email;

  if (!email) {
    throw ApiError.badRequest(
      "Google account does not have an email address"
    );
  }

  const userRecord = await admin.auth().getUser(uid);

  const db = getFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const now = new Date();

    const profile: UserProfile = {
      uid,
      email,
      name:
        userRecord.displayName ||
        decodedToken.name ||
        email.split("@")[0],
      roleId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(profile);
  }

  return {
    uid,
    email,
    name:
      userRecord.displayName ||
      decodedToken.name ||
      email.split("@")[0],
  };
}