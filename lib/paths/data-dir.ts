import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

/** Persistent app data root (Railway volume mount). Set to e.g. /data */
export function getDataDir(): string | null {
  const raw = process.env.DATA_DIR?.trim();
  return raw ? resolve(raw) : null;
}

export function getSqliteFilePath(): string {
  if (process.env.SQLITE_PATH?.trim()) {
    const configured = process.env.SQLITE_PATH.trim();
    return configured.startsWith("/") ? configured : resolve(process.cwd(), configured);
  }
  const dataDir = getDataDir();
  if (dataDir) return join(dataDir, "sheetmate.db");
  return join(process.cwd(), "data", "sheetmate.db");
}

export function getUploadRoot(): string {
  if (process.env.UPLOAD_PATH?.trim()) {
    const configured = process.env.UPLOAD_PATH.trim();
    return configured.startsWith("/") ? configured : resolve(process.cwd(), configured);
  }
  const dataDir = getDataDir();
  if (dataDir) return join(dataDir, "uploads");
  return join(process.cwd(), "uploads");
}

export function ensureDataDirectories(sqlitePath: string, uploadRoot: string) {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  mkdirSync(uploadRoot, { recursive: true });
}
