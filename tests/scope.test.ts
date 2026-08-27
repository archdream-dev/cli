import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  countSnapshotsInScope,
  getCustomDir,
  getCustomScopes,
  isBuiltinScope,
  removeScope,
  renameScope,
  saveArchitecture,
  snapshotToArchitecture,
} from "../src/snapshot.js";

const CLI = path.resolve(import.meta.dirname, "..", "dist", "cli.js");

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "archdream-scope-"));
}

function createScopeWithSnapshots(scope: string, ids: string[]): void {
  for (const id of ids) {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    const arch = snapshotToArchitecture(dir, id, scope);
    saveArchitecture(arch);
    fs.rmSync(dir, { recursive: true });
  }
}

function cleanupScope(scope: string): void {
  fs.rmSync(path.join(getCustomDir(), scope), { recursive: true, force: true });
}

function uniqueScope(prefix = "test-scope"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ── helpers ──────────────────────────────────────────────────────────

test("getCustomScopes lists only custom scopes sorted", () => {
  const a = uniqueScope("scope-a");
  const b = uniqueScope("scope-b");
  createScopeWithSnapshots(a, ["snap-a"]);
  createScopeWithSnapshots(b, ["snap-b"]);
  try {
    const scopes = getCustomScopes();
    assert.ok(scopes.includes(a));
    assert.ok(scopes.includes(b));
    // sorted
    const sorted = [...scopes].sort((x, y) => x.localeCompare(y));
    assert.deepEqual(scopes, sorted);
  } finally {
    cleanupScope(a);
    cleanupScope(b);
  }
});

test("isBuiltinScope correctly identifies builtins", () => {
  assert.equal(isBuiltinScope("backend"), true);
  assert.equal(isBuiltinScope("frontend"), true);
  assert.equal(isBuiltinScope("mobile"), false);
  assert.equal(isBuiltinScope("custom"), false);
});

test("countSnapshotsInScope counts yaml files", () => {
  const scope = uniqueScope("count-scope");
  createScopeWithSnapshots(scope, ["one", "two", "three"]);
  try {
    assert.equal(countSnapshotsInScope(scope), 3);
    assert.equal(countSnapshotsInScope("no-such-scope-xyz"), 0);
  } finally {
    cleanupScope(scope);
  }
});

test("countSnapshotsInScope returns 0 for builtin without custom dir", () => {
  const count = countSnapshotsInScope("backend");
  assert.equal(typeof count, "number");
});

test("removeScope deletes custom scope dir and snapshots", () => {
  const scope = uniqueScope("rm-scope");
  createScopeWithSnapshots(scope, ["snap1", "snap2"]);
  const dir = path.join(getCustomDir(), scope);
  assert.ok(fs.existsSync(dir));
  try {
    const removed = removeScope(scope);
    assert.equal(removed, dir);
    assert.ok(!fs.existsSync(dir));
    assert.equal(getCustomScopes().includes(scope), false);
  } finally {
    cleanupScope(scope);
  }
});

test("removeScope deletes empty scope dir", () => {
  const scope = uniqueScope("empty-scope");
  const dir = path.join(getCustomDir(), scope);
  fs.mkdirSync(dir, { recursive: true });
  try {
    const removed = removeScope(scope);
    assert.equal(removed, dir);
    assert.ok(!fs.existsSync(dir));
  } finally {
    cleanupScope(scope);
  }
});

test("removeScope throws for builtin scope", () => {
  assert.throws(() => removeScope("backend"), /Cannot remove builtin scope/);
  assert.throws(() => removeScope("frontend"), /Cannot remove builtin scope/);
});

test("removeScope throws for missing custom scope", () => {
  assert.throws(() => removeScope("no-such-scope-xyz-123"), /Custom scope "no-such-scope-xyz-123" not found/);
});

test("renameScope moves dir and preserves snapshots", () => {
  const oldScope = uniqueScope("rename-old");
  const newScope = uniqueScope("rename-new");
  createScopeWithSnapshots(oldScope, ["a", "b"]);
  try {
    const { oldPath, newPath } = renameScope(oldScope, newScope);
    assert.equal(oldPath, path.join(getCustomDir(), oldScope));
    assert.equal(newPath, path.join(getCustomDir(), newScope));
    assert.ok(!fs.existsSync(oldPath));
    assert.ok(fs.existsSync(newPath));
    assert.equal(countSnapshotsInScope(newScope), 2);
    assert.equal(countSnapshotsInScope(oldScope), 0);
    assert.ok(fs.existsSync(path.join(newPath, "a.yaml")));
    assert.ok(fs.existsSync(path.join(newPath, "b.yaml")));
  } finally {
    cleanupScope(oldScope);
    cleanupScope(newScope);
  }
});

test("renameScope blocks renaming builtin scope", () => {
  assert.throws(() => renameScope("backend", "new-name"), /Cannot rename builtin scope/);
});

test("renameScope blocks renaming to builtin scope", () => {
  const oldScope = uniqueScope("rename-to-builtin");
  createScopeWithSnapshots(oldScope, ["x"]);
  try {
    assert.throws(() => renameScope(oldScope, "backend"), /Cannot rename to builtin scope/);
    assert.throws(() => renameScope(oldScope, "frontend"), /Cannot rename to builtin scope/);
  } finally {
    cleanupScope(oldScope);
  }
});

test("renameScope throws for missing old scope", () => {
  assert.throws(() => renameScope("does-not-exist-xyz", "new-scope"), /Custom scope "does-not-exist-xyz" not found/);
});

test("renameScope throws when new scope already exists", () => {
  const a = uniqueScope("dup-a");
  const b = uniqueScope("dup-b");
  createScopeWithSnapshots(a, ["snap"]);
  createScopeWithSnapshots(b, ["snap"]);
  try {
    assert.throws(() => renameScope(a, b), /Scope ".*already exists/);
  } finally {
    cleanupScope(a);
    cleanupScope(b);
  }
});

test("renameScope throws for invalid new name", () => {
  const oldScope = uniqueScope("invalid-new");
  createScopeWithSnapshots(oldScope, ["snap"]);
  try {
    assert.throws(() => renameScope(oldScope, "!!!"), /Invalid scope name/);
    assert.throws(() => renameScope(oldScope, "   "), /Invalid scope name/);
  } finally {
    cleanupScope(oldScope);
  }
});

test("renameScope throws when new name equals old name", () => {
  const scope = uniqueScope("same-name");
  createScopeWithSnapshots(scope, ["snap"]);
  try {
    assert.throws(() => renameScope(scope, scope), /already exists/);
  } finally {
    cleanupScope(scope);
  }
});

test("renameScope sanitizes new name", () => {
  const oldScope = uniqueScope("sanitize-old");
  createScopeWithSnapshots(oldScope, ["snap"]);
  const sanitized = "My New Scope!";
  const expected = "my-new-scope";
  try {
    const { newPath } = renameScope(oldScope, sanitized);
    assert.ok(newPath.endsWith(expected));
    assert.ok(fs.existsSync(newPath));
  } finally {
    cleanupScope(oldScope);
    cleanupScope(expected);
  }
});

// ── CLI ───────────────────────────────────────────────────────────────

test("help includes remove scope and edit scope", () => {
  const result = spawnSync(process.execPath, [CLI, "help"], { encoding: "utf8", timeout: 15_000 });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /remove scope/);
  assert.match(result.stdout, /edit scope/);
});

test("remove scope via CLI deletes empty scope without confirm", () => {
  const scope = uniqueScope("cli-rm-empty");
  const dir = path.join(getCustomDir(), scope);
  fs.mkdirSync(dir, { recursive: true });
  try {
    const result = spawnSync(process.execPath, [CLI, "remove", "scope", scope], {
      encoding: "utf8",
      timeout: 15_000,
    });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Removed scope/);
    assert.ok(!fs.existsSync(dir));
  } finally {
    cleanupScope(scope);
  }
});

test("remove scope via CLI blocks builtin", () => {
  const result = spawnSync(process.execPath, [CLI, "remove", "scope", "backend"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  assert.equal(result.status, 1);
  const combined = `${result.stdout}${result.stderr}`;
  assert.match(combined, /Cannot remove builtin scope/);
});

test("remove scope via CLI errors for missing scope", () => {
  const result = spawnSync(process.execPath, [CLI, "remove", "scope", "no-such-scope-xyz-123"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  assert.equal(result.status, 1);
  const combined = `${result.stdout}${result.stderr}`;
  assert.match(combined, /Custom scope "no-such-scope-xyz-123" not found/);
});

test("remove scope via CLI errors for invalid name", () => {
  const result = spawnSync(process.execPath, [CLI, "remove", "scope", "!!!"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  assert.equal(result.status, 1);
  const combined = `${result.stdout}${result.stderr}`;
  assert.match(combined, /Invalid scope name/);
});

test("edit scope via CLI blocks builtin on delete path (rename guard)", () => {
  const result = spawnSync(process.execPath, [CLI, "edit", "scope", "!!!"], {
    encoding: "utf8",
    timeout: 15_000,
  });
  assert.equal(result.status, 1);
  const combined = `${result.stdout}${result.stderr}`;
  assert.match(combined, /Invalid scope name/);
});

test("archdream remove with unknown subcommand suggests usage", () => {
  const result = spawnSync(process.execPath, [CLI, "remove", "bogus"], { encoding: "utf8", timeout: 15_000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown subcommand: archdream remove bogus/);
  assert.match(result.stderr, /remove scope/);
});

test("archdream edit with unknown subcommand suggests usage", () => {
  const result = spawnSync(process.execPath, [CLI, "edit", "bogus"], { encoding: "utf8", timeout: 15_000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown subcommand: archdream edit bogus/);
  assert.match(result.stderr, /edit scope/);
});

test("archdream edit scope help via edit unknown suggests edit scope", () => {
  const result = spawnSync(process.execPath, [CLI, "edit", "snapshot"], { encoding: "utf8", timeout: 15_000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Did you mean "archdream edit scope/);
});
