import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { generate } from "../src/generate.js";
import { loadArchitectures } from "../src/load-architectures.js";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "archdream-test-"));
}

function removeTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true });
}

function withParents(tree: string[]): string[] {
  const result = new Set<string>();
  for (const entry of tree) {
    const segments = entry.split("/");
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      result.add(current);
    }
  }
  return [...result];
}

function listDirsRecursive(dir: string, base = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const result: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    result.push(rel);
    result.push(...listDirsRecursive(path.join(dir, entry.name), rel));
  }
  return result;
}

test("generate builds full tree in empty target dir", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find(
    (a) => a.id === "layered",
  );
  assert.ok(arch);

  const targetDir = makeTempDir();
  const expectedTree = withParents(arch.tree).sort();

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir);
    const actualTree = listDirsRecursive(targetDir).sort();

    // Assert
    assert.deepEqual(actualTree, expectedTree);
    for (const dir of arch.tree) {
      assert.ok(created.dirs.includes(dir), `expected created to include ${dir}`);
    }
    assert.deepEqual(skipped.dirs, []);
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate is idempotent when run twice on same folder", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "frontend" }).find(
    (a) => a.id === "react-feature-sliced",
  );
  assert.ok(arch);

  const targetDir = makeTempDir();
  generate(arch, targetDir);

  try {
    // Act
    const secondRun = generate(arch, targetDir);

    // Assert
    assert.deepEqual(secondRun.created.dirs, []);
    assert.deepEqual(secondRun.skipped.dirs.sort(), [...arch.tree].sort());
    assert.deepEqual(
      listDirsRecursive(targetDir).sort(),
      withParents(arch.tree).sort(),
    );
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate only adds missing dirs to existing structure", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "frontend" }).find(
    (a) => a.id === "nextjs-app-router",
  );
  assert.ok(arch);

  const targetDir = makeTempDir();
  fs.mkdirSync(path.join(targetDir, "app"));
  fs.mkdirSync(path.join(targetDir, "lib"));

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir);

    // Assert
    assert.deepEqual(skipped.dirs, ["lib"]);
    assert.deepEqual(
      created.dirs.sort(),
      arch.tree.filter((d) => d !== "lib").sort(),
    );
    assert.deepEqual(
      listDirsRecursive(targetDir).sort(),
      withParents(arch.tree).sort(),
    );
  } finally {
    removeTempDir(targetDir);
  }
});
