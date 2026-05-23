import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHITECTURE_DIR = path.join(__dirname, "..", "architecture");

export const SCOPES = ["backend", "frontend"];

export function getArchitectureDir() {
  return ARCHITECTURE_DIR;
}

function readScopeArchitectures(scope) {
  const scopeDir = path.join(ARCHITECTURE_DIR, scope);

  if (!fs.existsSync(scopeDir)) {
    return [];
  }

  const files = fs
    .readdirSync(scopeDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(scopeDir, file), "utf8");
    const arch = yaml.load(raw);

    if (!arch?.id || !arch?.name) {
      throw new Error(`Invalid architecture file: ${scope}/${file} (missing id or name)`);
    }

    arch.scope = scope;
    arch.tree = arch.tree ?? [];
    return arch;
  });
}

export function loadArchitectures({ scope } = {}) {
  const architectures = SCOPES.flatMap((s) => readScopeArchitectures(s));

  if (!scope) {
    return architectures;
  }

  return architectures.filter((arch) => arch.scope === scope);
}
