import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

import { getCustomDir } from "./snapshot.js";
import {
  BUILTIN_SCOPES,
  type Architecture,
  type ArchitectureYaml,
  type Scope,
} from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function resolveArchitectureDir(): string {
  const candidates = [
    path.join(__dirname, "..", "architecture"), // dist -> root/architecture
    path.join(__dirname, "..", "..", "architecture"), // src/main -> root/architecture (tsx dev)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0] as string;
}
const ARCHITECTURE_DIR = resolveArchitectureDir();

export { BUILTIN_SCOPES as SCOPES };
export type { Scope };

export function getArchitectureDir(): string {
  return ARCHITECTURE_DIR;
}

export function getScopes(): Scope[] {
  const scopes = new Set<Scope>(BUILTIN_SCOPES);
  const customDir = getCustomDir();

  if (fs.existsSync(customDir)) {
    for (const entry of fs.readdirSync(customDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scopes.add(entry.name);
      }
    }
  }

  return [...scopes];
}

function readScopeArchitectures(scope: Scope): Architecture[] {
  const scopeDirs = [
    path.join(ARCHITECTURE_DIR, scope),
    path.join(getCustomDir(), scope),
  ];

  const architectures: Architecture[] = [];

  for (const scopeDir of scopeDirs) {
    if (!fs.existsSync(scopeDir)) {
      continue;
    }

    const files = fs
      .readdirSync(scopeDir)
      .filter((f: string) => f.endsWith(".yaml") || f.endsWith(".yml"))
      .sort();

    for (const file of files) {
      const raw = fs.readFileSync(path.join(scopeDir, file), "utf8");
      const arch = yaml.load(raw) as ArchitectureYaml | null;

      if (!arch?.id || !arch?.name) {
        throw new Error(`Invalid architecture file: ${scope}/${file} (missing id or name)`);
      }

      architectures.push({
        id: arch.id,
        name: arch.name,
        description: arch.description ?? "",
        scope,
        tree: arch.tree ?? [],
      });
    }
  }

  return architectures;
}

export function loadArchitectures(options: { scope?: Scope } = {}): Architecture[] {
  const architectures = getScopes().flatMap((s) => readScopeArchitectures(s));

  if (!options.scope) {
    return architectures;
  }

  return architectures.filter((arch) => arch.scope === options.scope);
}
