import { mkdirSync } from "fs";
import { defineConfig } from "drizzle-kit";
import { dirname, join, resolve } from "path";
import { loadEnv } from "./lib/load-env";

loadEnv();

const filePath = process.env.SQLITE_PATH
  ? resolve(process.cwd(), process.env.SQLITE_PATH)
  : join(process.cwd(), "data", "sheetmate.db");

mkdirSync(dirname(filePath), { recursive: true });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${filePath}`,
  },
});
