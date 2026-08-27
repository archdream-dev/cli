import fs from "node:fs";
import path from "node:path";

import type { Architecture, GenerateOptions, GenerateResult } from "./types.js";

export function isDirEmpty(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).length === 0;
}

function isEffectivelyEmptyForGitkeep(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;
  const entries = fs.readdirSync(dir);
  return entries.length === 0;
}

function ensureGitkeep(dirPath: string): boolean {
  const gitkeepPath = path.join(dirPath, ".gitkeep");
  if (fs.existsSync(gitkeepPath)) return false;
  fs.writeFileSync(gitkeepPath, "", { flag: "wx" });
  return true;
}

export function generate(
  architecture: Architecture,
  targetDir: string,
  opts: GenerateOptions = {},
): GenerateResult {
  const created = { dirs: [] as string[], files: [] as string[] };
  const skipped = { dirs: [] as string[], files: [] as string[] };

  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of architecture.tree) {
    const fullPath = path.join(targetDir, entry);
    const gitkeepRel = `${entry}/.gitkeep`;

    if (fs.existsSync(fullPath)) {
      skipped.dirs.push(entry);
      if (opts.gitkeep) {
        const gitkeepPath = path.join(fullPath, ".gitkeep");
        if (fs.existsSync(gitkeepPath)) {
          skipped.files.push(gitkeepRel);
        } else if (isEffectivelyEmptyForGitkeep(fullPath)) {
          ensureGitkeep(fullPath);
          created.files.push(gitkeepRel);
        } else {
          skipped.files.push(gitkeepRel);
        }
      }
      continue;
    }
    fs.mkdirSync(fullPath, { recursive: true });
    created.dirs.push(entry);
    if (opts.gitkeep) {
      ensureGitkeep(fullPath);
      created.files.push(gitkeepRel);
    }
  }

  return { created, skipped };
}
