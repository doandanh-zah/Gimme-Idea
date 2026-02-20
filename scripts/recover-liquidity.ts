#!/usr/bin/env -S npx tsx

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = process.cwd();
const frontendScript = path.join(
  projectRoot,
  "frontend",
  "scripts",
  "recover-liquidity.mjs"
);

if (!fs.existsSync(frontendScript)) {
  console.error(
    `[recover-liquidity] Missing script: ${frontendScript}\n` +
      "Expected frontend runner was not found."
  );
  process.exit(1);
}

const child = spawnSync(process.execPath, [frontendScript, ...process.argv.slice(2)], {
  cwd: path.join(projectRoot, "frontend"),
  stdio: "inherit",
  env: process.env,
});

if (typeof child.status === "number") {
  process.exit(child.status);
}
process.exit(1);
