import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { loadEnv } from "@/lib/load-env";
import { ensureDataDirectories, getSqliteFilePath, getUploadRoot } from "@/lib/paths/data-dir";
import * as schema from "./schema";

loadEnv();

const filePath = getSqliteFilePath();
ensureDataDirectories(filePath, getUploadRoot());

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

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

function runMigrations() {
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite.exec(`
CREATE TABLE IF NOT EXISTS practice_logs (
  id TEXT PRIMARY KEY NOT NULL,
  piece_id TEXT NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT DEFAULT '' NOT NULL,
  passage_notes TEXT DEFAULT '' NOT NULL,
  audio_storage_key TEXT,
  audio_mime_type TEXT,
  audio_analysis TEXT,
  coach_response TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS practice_logs_piece_user_created_idx
  ON practice_logs (piece_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS practice_logs_user_created_idx
  ON practice_logs (user_id, created_at);

CREATE TABLE IF NOT EXISTS piece_practice_goals (
  piece_id TEXT PRIMARY KEY NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_tempo_bpm INTEGER,
  dynamics_notes TEXT DEFAULT '' NOT NULL,
  emotion_notes TEXT DEFAULT '' NOT NULL,
  passage_notes TEXT DEFAULT '' NOT NULL,
  goals_text TEXT DEFAULT '' NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS piece_practice_goals_user_idx ON piece_practice_goals (user_id);
`);

    // Legacy installs created before columns were in CREATE TABLE above.
    ensureColumn("practice_logs", "passage_notes", "TEXT DEFAULT '' NOT NULL");
    ensureColumn("practice_logs", "audio_storage_key", "TEXT");
    ensureColumn("practice_logs", "audio_mime_type", "TEXT");
    ensureColumn("practice_logs", "audio_analysis", "TEXT");
    ensureColumn("piece_practice_goals", "goals_text", "TEXT DEFAULT '' NOT NULL");

    sqlite.exec("COMMIT");
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }
}

runMigrations();

export const db = drizzle(sqlite, { schema });
