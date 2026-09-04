import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { initFirebase } from "./config/firebase";
import { initializeSystemRoles } from "./services/role.service";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    initFirebase();
    console.log("Firebase initialized successfully.");

    await initializeSystemRoles();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();