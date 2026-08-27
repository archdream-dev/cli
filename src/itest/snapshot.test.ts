import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadArchitectures } from "../main/load-architectures.js";
import { saveArchitecture, snapshotToArchitecture, getCustomDir } from "../main/snapshot.js";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "archdream-test-"));
}

test("snapshotToArchitecture captures directory tree", () => {
  // Arrange
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, "src/components/ui"), { recursive: true });
  fs.mkdirSync(path.join(dir, ".git"));
  fs.mkdirSync(path.join(dir, "node_modules/pkg"), { recursive: true });

  try {
    // Act
    const arch = snapshotToArchitecture(dir, "my-snap", "backend");

    // Assert
    assert.equal(arch.id, "my-snap");
    assert.equal(arch.scope, "backend");
    assert.deepEqual(arch.tree, ["src", "src/components", "src/components/ui"]);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test("snapshotToArchitecture throws on empty dir", () => {
  // Arrange
  const dir = makeTempDir();

  // Act & Assert
  assert.throws(() => snapshotToArchitecture(dir, "x", "frontend"));
  fs.rmSync(dir, { recursive: true });
});

test("snapshotToArchitecture ignores .gitkeep files", () => {
  // Arrange
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, "src/components"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", ".gitkeep"), "");
  fs.writeFileSync(path.join(dir, "src/components", ".gitkeep"), "");

  try {
    // Act
    const arch = snapshotToArchitecture(dir, "gitkeep-snap", "frontend");

    // Assert
    // .gitkeep is a file, not a directory, so tree must not include it
    assert.deepEqual(arch.tree, ["src", "src/components"]);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test("saveArchitecture writes yaml loadable by loader", () => {
  // Arrange
  const sourceDir = makeTempDir();
  fs.mkdirSync(path.join(sourceDir, "domain"), { recursive: true });
  const arch = snapshotToArchitecture(sourceDir, "snap-test-tmp", "backend");
  const customDir = getCustomDir();
  const hadCustomDir = fs.existsSync(customDir);

  try {
    // Act
    saveArchitecture(arch);
    const loaded = loadArchitectures({ scope: "backend" }).find(
      (a) => a.id === "snap-test-tmp",
    );

    // Assert
    assert.ok(loaded);
    assert.equal(loaded.scope, "backend");
    assert.deepEqual(loaded.tree, ["domain"]);
  } finally {
    fs.rmSync(path.join(customDir, "backend", "snap-test-tmp.yaml"), { force: true });
    if (!hadCustomDir) fs.rmSync(customDir, { recursive: true, force: true });
    fs.rmSync(sourceDir, { recursive: true });
  }
});
