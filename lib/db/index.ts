import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { loadEnv } from "@/lib/load-env";
import { ensureDataDirectories, getSqliteFilePath, getUploadRoot } from "@/lib/paths/data-dir";
import * as schema from "./schema";

loadEnv();

const MIGRATIONS_FOLDER = join(process.cwd(), "drizzle");
const INITIAL_MIGRATION_TAG = "0000_naive_lizard";

const filePath = getSqliteFilePath();
ensureDataDirectories(filePath, getUploadRoot());

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

const db = drizzle(sqlite, { schema });

function tableExists(table: string): boolean {
  const row = sqlite
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get(table);
  return !!row;
}

function ensureColumn(table: string, column: string, definition: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (cols.some((c) => c.name === column)) return;
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("duplicate column")) return;
    throw err;
  }
}

/** DBs bootstrapped before Drizzle migrations only had practice tables — drop them so migrate can run. */
function dropPartialBootstrapTables() {
  if (!tableExists("users") && tableExists("practice_logs")) {
    sqlite.exec("DROP TABLE IF EXISTS practice_logs");
    sqlite.exec("DROP TABLE IF EXISTS piece_practice_goals");
  }
}

/** Local DBs created via drizzle-kit push have tables but no migration journal. */
function baselineDrizzleJournalIfNeeded() {
  if (!tableExists("users") || tableExists("__drizzle_migrations")) return;

  const migrationPath = join(MIGRATIONS_FOLDER, `${INITIAL_MIGRATION_TAG}.sql`);
  if (!existsSync(migrationPath)) return;

  const query = readFileSync(migrationPath, "utf8");
  const hash = createHash("sha256").update(query).digest("hex");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);
  sqlite.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run(
    hash,
    Date.now()
  );
}

function runLegacyColumnPatches() {
  if (!tableExists("practice_logs")) return;

  ensureColumn("practice_logs", "passage_notes", "TEXT DEFAULT '' NOT NULL");
  ensureColumn("practice_logs", "audio_storage_key", "TEXT");
  ensureColumn("practice_logs", "audio_mime_type", "TEXT");
  ensureColumn("practice_logs", "audio_analysis", "TEXT");
  ensureColumn("piece_practice_goals", "goals_text", "TEXT DEFAULT '' NOT NULL");
}

function runMigrations() {
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    dropPartialBootstrapTables();
    sqlite.exec("COMMIT");
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }

  if (!tableExists("users")) {
    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } else {
    baselineDrizzleJournalIfNeeded();
  }

  sqlite.exec("BEGIN IMMEDIATE");
  try {
    runLegacyColumnPatches();
    sqlite.exec("COMMIT");
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }
}

runMigrations();

export { db };
