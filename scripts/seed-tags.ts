import { loadEnv } from "../lib/load-env";

loadEnv();

import { ensurePresetTags } from "../lib/tags/ensure-presets";

async function main() {
  await ensurePresetTags();
  console.log("Preset tags ensured.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
