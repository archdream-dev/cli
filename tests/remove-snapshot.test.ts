import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { getCustomDir } from "../src/snapshot.js";
import {
  listCustomSnapshots,
  removeSnapshot,
  saveArchitecture,
  snapshotToArchitecture,
} from "../src/snapshot.js";

const CLI = path.resolve(import.meta.dirname, "..", "dist", "cli.js");

function createTestSnapshot(id: string, scope: string): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-rm-"));
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  const arch = snapshotToArchitecture(dir, id, scope);
  saveArchitecture(arch);
  fs.rmSync(dir, { recursive: true });
}

test("removeSnapshot deletes the yaml file", () => {
  // Arrange
  createTestSnapshot("rm-test-a", "backend");
  const expectedPath = path.join(getCustomDir(), "backend", "rm-test-a.yaml");

  try {
    // Act
    const removedPath = removeSnapshot("rm-test-a", "backend");

    // Assert
    assert.equal(removedPath, expectedPath);
    assert.ok(!fs.existsSync(removedPath));
    assert.equal(
      listCustomSnapshots().some((s) => s.id === "rm-test-a"),
      false,
    );
  } finally {
    fs.rmSync(expectedPath, { force: true });
  }
});

test("removeSnapshot throws for unknown snapshot", () => {
  // Act & Assert
  assert.throws(() => removeSnapshot("does-not-exist"), /No custom snapshot/);
});

test("removeSnapshot without scope errors when id exists in multiple scopes", () => {
  // Arrange
  createTestSnapshot("rm-test-multi", "backend");
  createTestSnapshot("rm-test-multi", "frontend");

  try {
    // Act & Assert
    assert.throws(
      () => removeSnapshot("rm-test-multi"),
      /multiple scopes.*--scope/s,
    );

    // With --scope it succeeds
    const removed = removeSnapshot("rm-test-multi", "backend");
    assert.ok(!fs.existsSync(removed));
  } finally {
    fs.rmSync(path.join(getCustomDir(), "backend", "rm-test-multi.yaml"), { force: true });
    fs.rmSync(path.join(getCustomDir(), "frontend", "rm-test-multi.yaml"), { force: true });
  }
});

test("archdream remove snapshot via CLI deletes file and exits 0", () => {
  // Arrange
  createTestSnapshot("rm-cli-test", "backend");

  try {
    // Act
    const result = spawnSync(
      process.execPath,
      [CLI, "remove", "snapshot", "rm-cli-test", "--scope", "backend"],
      { encoding: "utf8", timeout: 15_000 },
    );

    // Assert
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Removed snapshot/);
    assert.ok(
      !fs.existsSync(path.join(getCustomDir(), "backend", "rm-cli-test.yaml")),
    );
  } finally {
    fs.rmSync(path.join(getCustomDir(), "backend", "rm-cli-test.yaml"), { force: true });
  }
});

test("archdream remove snapshot with unknown subcommand suggests usage", () => {
  // Act
  const result = spawnSync(process.execPath, [CLI, "remove", "bogus"], {
    encoding: "utf8",
    timeout: 15_000,
  });

  // Assert
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown subcommand: archdream remove bogus/);
});
