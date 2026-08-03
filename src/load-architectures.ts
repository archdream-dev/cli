import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

import { SCOPES, type Architecture, type ArchitectureYaml, type Scope } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHITECTURE_DIR = path.join(__dirname, "..", "architecture");

export { SCOPES };
export type { Scope };

export function getArchitectureDir(): string {
  return ARCHITECTURE_DIR;
}

function readScopeArchitectures(scope: Scope): Architecture[] {
  const scopeDir = path.join(ARCHITECTURE_DIR, scope);

  if (!fs.existsSync(scopeDir)) {
    return [];
  }

  const files = fs
    .readdirSync(scopeDir)
    .filter((f: string) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  return files.map((file: string) => {
    const raw = fs.readFileSync(path.join(scopeDir, file), "utf8");
    const arch = yaml.load(raw) as ArchitectureYaml | null;

    if (!arch?.id || !arch?.name) {
      throw new Error(`Invalid architecture file: ${scope}/${file} (missing id or name)`);
    }

    return {
      id: arch.id,
      name: arch.name,
      description: arch.description ?? "",
      scope,
      tree: arch.tree ?? [],
    };
  });
}

export function loadArchitectures(options: { scope?: Scope } = {}): Architecture[] {
  const architectures = SCOPES.flatMap((s) => readScopeArchitectures(s));

  if (!options.scope) {
    return architectures;
  }

  return architectures.filter((arch) => arch.scope === options.scope);
}
