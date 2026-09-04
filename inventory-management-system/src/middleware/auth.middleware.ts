import { NextFunction, Request, Response } from "express";
import admin, { getFirestore } from "../config/firebase";
import { ApiError } from "../utils/ApiError";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(
      ApiError.unauthorized("Missing or invalid Authorization header")
    );
  }

  const idToken = header.split(" ")[1];

  try {
    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(idToken);

    const db = getFirestore();

    // Get user profile from Firestore
    const userDoc = await db
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return next(ApiError.unauthorized("User not found"));
    }

    const userData = userDoc.data();

    if (!userData?.isActive) {
      return next(ApiError.forbidden("User account is inactive"));
    }

    /**
     * IMPORTANT:
     *
     * We no longer trust a hardcoded Admin/Staff enum.
     *
     * The user's role is determined by roleId,
     * and permissions are checked later by checkPermission().
     */
    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      roleId: userData.roleId || null,
      role: userData.role || null,
    };

    next();
  } catch (error) {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}