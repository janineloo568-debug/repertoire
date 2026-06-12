import { config } from "dotenv";
import { resolve } from "path";

/** Loads `.env.local` then `.env` so Drizzle CLI and scripts see the same vars as Next.js. */
export function loadEnv(): void {
  config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
  config({ path: resolve(process.cwd(), ".env"), quiet: true });
}
