import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.join(__dirname, "..", "migrations");

export async function runMigrations() {
  await db`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  let migrationFiles = [];
  try {
    migrationFiles = (await fs.readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort();
  } catch {
    return;
  }

  const appliedMigrations = await db`SELECT name FROM schema_migrations`;
  const appliedMigrationSet = new Set(appliedMigrations.map((row) => row.name));

  for (const migrationFile of migrationFiles) {
    if (appliedMigrationSet.has(migrationFile)) {
      continue;
    }

    const migrationSql = await fs.readFile(path.join(migrationsDirectory, migrationFile), "utf8");

    await db.begin(async (transaction) => {
      await transaction.unsafe(migrationSql);
      await transaction`
        INSERT INTO schema_migrations (name)
        VALUES (${migrationFile})
      `;
    });
  }
}
