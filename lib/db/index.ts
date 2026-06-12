import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { loadEnv } from "@/lib/load-env";
import * as schema from "./schema";

loadEnv();

const filePath = process.env.SQLITE_PATH
  ? resolve(process.cwd(), process.env.SQLITE_PATH)
  : join(process.cwd(), "data", "sheetmate.db");

mkdirSync(dirname(filePath), { recursive: true });

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS practice_logs (
  id TEXT PRIMARY KEY NOT NULL,
  piece_id TEXT NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT DEFAULT '' NOT NULL,
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
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS piece_practice_goals_user_idx ON piece_practice_goals (user_id);
`);

function ensureColumn(table: string, column: string, definition: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn("practice_logs", "passage_notes", "TEXT DEFAULT '' NOT NULL");
ensureColumn("practice_logs", "audio_storage_key", "TEXT");
ensureColumn("practice_logs", "audio_mime_type", "TEXT");
ensureColumn("practice_logs", "audio_analysis", "TEXT");
ensureColumn("piece_practice_goals", "goals_text", "TEXT DEFAULT '' NOT NULL");

export const db = drizzle(sqlite, { schema });
