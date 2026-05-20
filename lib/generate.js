import fs from "node:fs";
import path from "node:path";

function isDirEmpty(dir) {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).length === 0;
}

export function generate(architecture, targetDir) {
  const created = { dirs: [] };
  const skipped = { dirs: [] };

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

export { isDirEmpty };
