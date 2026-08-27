import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const CLI = path.resolve(import.meta.dirname, "..", "dist", "cli.js");

function runCli(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    timeout: 15_000,
  });
}

test("help prints usage and available commands", () => {
  // Act
  const result = runCli(["help"]);

  // Assert
  assert.equal(result.status, 0);
  const out = result.stdout;
  assert.match(out, /Usage:/);
  assert.match(out, /Archdream CLI - scaffold folder structures from architecture presets/);
  assert.match(out, /archdream \[target-dir\]/);
  assert.match(out, /archdream list/);
  assert.match(out, /archdream create snapshot \[name\] \[target-dir\]/);
  assert.match(out, /archdream help/);
});

test("help includes --gitkeep flag", () => {
  // Act
  const result = runCli(["help"]);

  // Assert
  assert.match(result.stdout, /--gitkeep/);
  assert.match(result.stdout, /Seed empty dirs with \.gitkeep/);
});

test("--help and -h behave like help", () => {
  // Act
  const longResult = runCli(["--help"]);
  const shortResult = runCli(["-h"]);

  // Assert
  assert.equal(longResult.status, 0);
  assert.equal(shortResult.status, 0);
  assert.equal(longResult.stdout, shortResult.stdout);
});

test("list prints architectures grouped by scope", () => {
  // Act
  const result = runCli(["list"]);

  // Assert
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Backend:/);
  assert.match(result.stdout, /Frontend:/);
  assert.match(result.stdout, /hexagonal/);
  assert.match(result.stdout, /layered/);
  assert.match(result.stdout, /nextjs-app-router/);
});

test("unknown option (flag) exits with error and suggests help", () => {
  // Act
  const result = runCli(["--bogus"]);

  // Assert
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not have option "--bogus"/);
  assert.match(result.stderr, /archdream help/);
});

test("--gitkeep is accepted as known flag", () => {
  // Arrange
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-gitkeep-cli-"));
  try {
    // Act — start scaffold with --gitkeep; prompts will wait for input, we just verify no unknown-option error
    const result = spawnSync(process.execPath, [CLI, "--gitkeep", "my-app"], {
      encoding: "utf8",
      cwd: tmp,
      timeout: 15_000,
    });
    const combined = `${result.stdout}${result.stderr}`;
    // Assert
    assert.ok(
      !combined.includes('does not have option "--gitkeep"'),
      `should not report --gitkeep as unknown, got: ${combined}`,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("--gitkeep after target is also accepted", () => {
  // Arrange
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-gitkeep-cli2-"));
  try {
    // Act
    const result = spawnSync(process.execPath, [CLI, "my-app", "--gitkeep"], {
      encoding: "utf8",
      cwd: tmp,
      timeout: 15_000,
    });
    const combined = `${result.stdout}${result.stderr}`;
    // Assert
    assert.ok(
      !combined.includes('does not have option "--gitkeep"'),
      `should not report --gitkeep as unknown, got: ${combined}`,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("non-existent directory is treated as target dir, not a command", () => {
  // Arrange
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-new-"));
  const target = path.join(tmp, "temp", "new");

  try {
    // Act — scaffolding starts interactively; feed EOF so prompts abort.
    const result = spawnSync(process.execPath, [CLI, "temp/new"], {
      encoding: "utf8",
      cwd: tmp,
      timeout: 15_000,
    });
    const combined = `${result.stdout}${result.stderr}`;

    // Assert
    assert.ok(
      !combined.includes("does not have"),
      `should not report unknown command, got: ${combined}`,
    );
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test("existing directory is not treated as unknown command", () => {
  // Act — scaffolding starts interactively; feed EOF so prompts abort.
  // We only verify it does NOT fail with the unknown-command message.
  const result = runCli(["."]);

  // Assert
  const combined = `${result.stdout}${result.stderr}`;
  assert.ok(
    !combined.includes("does not have"),
    `should not report unknown command, got: ${combined}`,
  );
});

test("create with unknown subcommand suggests create snapshot", () => {
  // Act
  const result = runCli(["create", "bogus"]);

  // Assert
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown subcommand: archdream create bogus/);
  assert.match(result.stderr, /archdream create snapshot <name>/);
});

test("create snapshot without name uses current folder name", () => {
  // Arrange
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "archdream-cwd-"));
  const projectDir = path.join(tmp, "my-project");
  fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });
  const customYaml = path.join(
    os.homedir(),
    ".archdream",
    "backend",
    "my-project.yaml",
  );

  try {
    // Act
    const result = spawnSync(
      process.execPath,
      [CLI, "create", "snapshot", "--scope", "backend"],
      {
        encoding: "utf8",
        cwd: projectDir,
        timeout: 15_000,
      },
    );

    // Assert
    assert.equal(result.status, 0);
    assert.ok(fs.existsSync(customYaml), "snapshot yaml should exist");
    const content = fs.readFileSync(customYaml, "utf8");
    assert.match(content, /id: my-project/);
    assert.match(content, /- src/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(customYaml, { force: true });
  }
});
