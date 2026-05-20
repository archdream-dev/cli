import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHITECTURES_DIR = path.join(__dirname, "..", "architectures");

export function getArchitecturesDir() {
  return ARCHITECTURES_DIR;
}

export function loadArchitectures() {
  const files = fs
    .readdirSync(ARCHITECTURES_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(ARCHITECTURES_DIR, file), "utf8");
    const arch = yaml.load(raw);

    if (!arch?.id || !arch?.name) {
      throw new Error(`Invalid architecture file: ${file} (missing id or name)`);
    }

    arch.tree = arch.tree ?? [];
    return arch;
  });
}
