import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { getScopes, loadArchitectures } from "../src/load-architectures.js";
import { saveArchitecture, snapshotToArchitecture, getCustomDir } from "../src/snapshot.js";
import { sanitizeScopeName } from "../src/prompts.js";

const CLI = path.resolve(import.meta.dirname, "..", "dist", "cli.js");

test("custom scope round-trip: snapshot then scaffold-load", () => {
  // Arrange
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-src-"));
  fs.mkdirSync(path.join(sourceDir, "features"), { recursive: true });
  const customYaml = path.join(getCustomDir(), "mobile", "mobile-app.yaml");

  try {
    // Act
    const arch = snapshotToArchitecture(sourceDir, "mobile-app", "mobile");
    saveArchitecture(arch);

    const loaded = loadArchitectures({ scope: "mobile" });

    // Assert
    assert.deepEqual(getScopes().includes("mobile"), true);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, "mobile-app");
    assert.deepEqual(loaded[0].tree, ["features"]);
  } finally {
    fs.rmSync(customYaml, { force: true });
    if (fs.existsSync(path.join(getCustomDir(), "mobile"))) {
      fs.rmdirSync(path.join(getCustomDir(), "mobile"));
    }
    fs.rmSync(sourceDir, { recursive: true, force: true });
  }
});

test("--scope with a new name creates a custom scope on the fly", () => {
  // Arrange
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-scope-"));
  fs.mkdirSync(path.join(sourceDir, "lib"), { recursive: true });
  const yamlPath = path.join(getCustomDir(), "brandnew", "scope-flag-test.yaml");

  try {
    // Act
    const result = spawnSync(
      process.execPath,
      [CLI, "create", "snapshot", "scope-flag-test", sourceDir, "--scope", "brandnew"],
      { encoding: "utf8", timeout: 15_000 },
    );

    // Assert
    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(yamlPath));
    assert.ok(getScopes().includes("brandnew"));
  } finally {
    fs.rmSync(yamlPath, { force: true });
    fs.rmSync(sourceDir, { recursive: true, force: true });
  }
});

test("invalid --scope name exits with error", () => {
  // Act
  const result = spawnSync(
    process.execPath,
    [CLI, "create", "snapshot", "x", "--scope", "!!!"],
    { encoding: "utf8", cwd: os.tmpdir(), timeout: 15_000 },
  );

  // Assert
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid scope name/);
});

test("sanitizeScopeName normalizes free-text scope names", () => {
  // Act & Assert
  assert.equal(sanitizeScopeName("My App!"), "my-app");
  assert.equal(sanitizeScopeName("  CLI Tools  "), "cli-tools");
  assert.equal(sanitizeScopeName("mobile"), "mobile");
  assert.equal(sanitizeScopeName("!!!"), "");
});
