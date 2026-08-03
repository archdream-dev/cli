import fs from "node:fs";
import path from "node:path";

import type { Architecture, GenerateResult } from "./types.js";

export function isDirEmpty(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).length === 0;
}

export function generate(architecture: Architecture, targetDir: string): GenerateResult {
  const created = { dirs: [] as string[] };
  const skipped = { dirs: [] as string[] };

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of architecture.tree) {
    const fullPath = path.join(targetDir, entry);
    if (fs.existsSync(fullPath)) {
      skipped.dirs.push(entry);
      continue;
    }
    fs.mkdirSync(fullPath, { recursive: true });
    created.dirs.push(entry);
  }

  return { created, skipped };
}
