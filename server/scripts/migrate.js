import { runMigrations } from "../utils/runMigrations.js";
import db from "../config/db.js";

async function run() {
  try {
    await runMigrations();
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await db.end({ timeout: 5 });
  }
}

run();
