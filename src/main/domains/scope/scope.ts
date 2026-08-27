import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BUILTIN_SCOPES } from "../../types.js";
import type { Scope } from "../../types.js";

export function getCustomDir(): string {
  return path.join(os.homedir(), ".archdream");
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
