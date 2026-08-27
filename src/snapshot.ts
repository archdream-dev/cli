import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import yaml from "js-yaml";

import { BUILTIN_SCOPES } from "./types.js";
import type { Architecture, ArchitectureYaml, Scope } from "./types.js";

export function getCustomDir(): string {
  return path.join(os.homedir(), ".archdream");
}

function listDirsRecursive(dir: string, base = ""): string[] {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));
  const result: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    result.push(rel);
    result.push(...listDirsRecursive(path.join(dir, entry.name), rel));
  }
  return result;
}

export function snapshotToArchitecture(
  targetDir: string,
  id: string,
  scope: Scope,
): Architecture {
  const tree = listDirsRecursive(targetDir);

  if (!tree.length) {
    throw new Error(`No directories found under ${targetDir}`);
  }

  return {
    id,
    name: id,
    description: `Snapshot of ${targetDir}`,
    scope,
    tree,
  };
}

export function saveArchitecture(arch: Architecture): string {
  const scopeDir = path.join(getCustomDir(), arch.scope);
  fs.mkdirSync(scopeDir, { recursive: true });

  const filePath = path.join(scopeDir, `${arch.id}.yaml`);
  const content: ArchitectureYaml = {
    id: arch.id,
    name: arch.name,
    description: arch.description,
    tree: arch.tree,
  };
  fs.writeFileSync(filePath, yaml.dump(content, { indent: 2 }), "utf8");
  return filePath;
}

export interface CustomSnapshot {
  id: string;
  scope: string;
  filePath: string;
}

export function listCustomSnapshots(): CustomSnapshot[] {
  const customDir = getCustomDir();
  if (!fs.existsSync(customDir)) {
    return [];
  }

  const snapshots: CustomSnapshot[] = [];
  for (const entry of fs.readdirSync(customDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const scopeDir = path.join(customDir, entry.name);
    for (const file of fs.readdirSync(scopeDir)) {
      if (file.endsWith(".yaml") || file.endsWith(".yml")) {
        snapshots.push({
          id: file.replace(/\.ya?ml$/, ""),
          scope: entry.name,
          filePath: path.join(scopeDir, file),
        });
      }
    }
  }
  return snapshots.sort((a, b) =>
    a.scope === b.scope ? a.id.localeCompare(b.id) : a.scope.localeCompare(b.scope),
  );
}

export function removeSnapshot(id: string, scope?: string): string {
  const matches = listCustomSnapshots().filter(
    (s) => s.id === id && (!scope || s.scope === scope),
  );

  if (matches.length === 0) {
    throw new Error(`No custom snapshot "${id}" found${scope ? ` in scope "${scope}"` : ""}.`);
  }

  if (matches.length > 1) {
    const scopes = matches.map((m) => m.scope).join(", ");
    throw new Error(
      `Snapshot "${id}" exists in multiple scopes (${scopes}). Use --scope to pick one.`,
    );
  }

  const match = matches[0];
  if (!match) {
    throw new Error(`No custom snapshot "${id}" found.`);
  }

  fs.rmSync(match.filePath);
  return match.filePath;
}

export function getCustomScopes(): Scope[] {
  const customDir = getCustomDir();
  if (!fs.existsSync(customDir)) return [];
  const scopes: Scope[] = [];
  for (const entry of fs.readdirSync(customDir, { withFileTypes: true })) {
    if (entry.isDirectory()) scopes.push(entry.name);
  }
  return scopes.sort((a, b) => a.localeCompare(b));
}

export function isBuiltinScope(scope: Scope): boolean {
  return (BUILTIN_SCOPES as readonly string[]).includes(scope);
}

export function countSnapshotsInScope(scope: Scope): number {
  const scopeDir = path.join(getCustomDir(), scope);
  if (!fs.existsSync(scopeDir)) return 0;
  let count = 0;
  for (const file of fs.readdirSync(scopeDir)) {
    if (file.endsWith(".yaml") || file.endsWith(".yml")) count++;
  }
  return count;
}

export function removeScope(scope: Scope): string {
  if (isBuiltinScope(scope)) {
    throw new Error(`Cannot remove builtin scope "${scope}".`);
  }
  const customScopes = getCustomScopes();
  if (!customScopes.includes(scope)) {
    throw new Error(`Custom scope "${scope}" not found.`);
  }
  const scopeDir = path.join(getCustomDir(), scope);
  fs.rmSync(scopeDir, { recursive: true, force: false });
  return scopeDir;
}

export function renameScope(oldScope: Scope, newScopeRaw: string): { oldPath: string; newPath: string } {
  const newScope = newScopeRaw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!newScope) {
    throw new Error(`Invalid scope name: ${newScopeRaw}`);
  }
  if (isBuiltinScope(oldScope)) {
    throw new Error(`Cannot rename builtin scope "${oldScope}".`);
  }
  if (isBuiltinScope(newScope)) {
    throw new Error(`Cannot rename to builtin scope "${newScope}".`);
  }
  const customScopes = getCustomScopes();
  if (!customScopes.includes(oldScope)) {
    throw new Error(`Custom scope "${oldScope}" not found.`);
  }
  if (customScopes.includes(newScope)) {
    throw new Error(`Scope "${newScope}" already exists.`);
  }
  const allScopes = new Set<string>([...(BUILTIN_SCOPES as readonly string[]), ...customScopes]);
  if (allScopes.has(newScope) && !customScopes.includes(oldScope)) {
    throw new Error(`Scope "${newScope}" already exists.`);
  }
  if (oldScope === newScope) {
    throw new Error(`Scope "${newScope}" already exists.`);
  }
  const oldPath = path.join(getCustomDir(), oldScope);
  const newPath = path.join(getCustomDir(), newScope);
  if (fs.existsSync(newPath)) {
    throw new Error(`Scope "${newScope}" already exists.`);
  }
  fs.renameSync(oldPath, newPath);
  return { oldPath, newPath };
}
