import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

function loadServiceAccount(): admin.ServiceAccount | undefined {
  const {
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  // Option A: JSON file on disk
  if (FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(
      process.cwd(),
      FIREBASE_SERVICE_ACCOUNT_PATH
    );

    if (fs.existsSync(resolvedPath)) {
      return JSON.parse(
        fs.readFileSync(resolvedPath, "utf-8")
      );
    }
  }

  // Option B: inline environment variables
  if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return undefined;
}

let app: admin.app.App;

export function initFirebase(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or the inline FIREBASE_* env vars in your .env file."
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  initFirebase();

  return admin.firestore();
}

export function getBucket() {
  initFirebase();

  return admin.storage().bucket();
}

export default admin;