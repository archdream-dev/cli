import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { generate } from "../main/generate.js";
import { loadArchitectures } from "../main/load-architectures.js";

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

test("generate with gitkeep seeds .gitkeep in every created dir", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find((a) => a.id === "layered");
  assert.ok(arch);
  const targetDir = makeTempDir();

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir, { gitkeep: true });

    // Assert
    assert.deepEqual(created.dirs.sort(), [...arch.tree].sort());
    assert.deepEqual(skipped.dirs, []);
    assert.deepEqual(created.files.sort(), arch.tree.map((d) => `${d}/.gitkeep`).sort());
    assert.deepEqual(skipped.files, []);
    for (const dir of arch.tree) {
      const gitkeepPath = path.join(targetDir, dir, ".gitkeep");
      assert.ok(fs.existsSync(gitkeepPath), `expected .gitkeep at ${dir}/.gitkeep`);
      assert.equal(fs.readFileSync(gitkeepPath, "utf8"), "");
    }
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate with gitkeep:false creates no .gitkeep files", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find((a) => a.id === "layered");
  assert.ok(arch);
  const targetDir = makeTempDir();

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir, { gitkeep: false });

    // Assert
    assert.deepEqual(created.files, []);
    assert.deepEqual(skipped.files, []);
    for (const dir of arch.tree) {
      assert.ok(!fs.existsSync(path.join(targetDir, dir, ".gitkeep")));
    }
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate with gitkeep seeds empty skipped dirs but skips non-empty", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find((a) => a.id === "layered");
  assert.ok(arch);
  const targetDir = makeTempDir();
  // config will be empty -> should get .gitkeep
  // controller will be non-empty -> should NOT get .gitkeep
  fs.mkdirSync(path.join(targetDir, "config"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "controller"), { recursive: true });
  fs.writeFileSync(path.join(targetDir, "controller", "README.md"), "hi");

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir, { gitkeep: true });

    // Assert
    assert.ok(skipped.dirs.includes("config"));
    assert.ok(skipped.dirs.includes("controller"));
    assert.ok(created.files.includes("config/.gitkeep"), "empty skipped dir should be seeded");
    assert.ok(fs.existsSync(path.join(targetDir, "config", ".gitkeep")));
    assert.ok(skipped.files.includes("controller/.gitkeep"), "non-empty dir should be in skipped.files");
    assert.ok(!fs.existsSync(path.join(targetDir, "controller", ".gitkeep")), "non-empty dir must not get .gitkeep");
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate with gitkeep is idempotent on second run", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find((a) => a.id === "hexagonal");
  assert.ok(arch);
  const targetDir = makeTempDir();
  generate(arch, targetDir, { gitkeep: true });

  try {
    // Act
    const second = generate(arch, targetDir, { gitkeep: true });

    // Assert
    assert.deepEqual(second.created.dirs, []);
    assert.deepEqual(second.created.files, []);
    assert.deepEqual(second.skipped.dirs.sort(), [...arch.tree].sort());
    assert.deepEqual(second.skipped.files.sort(), arch.tree.map((d) => `${d}/.gitkeep`).sort());
    for (const dir of arch.tree) {
      assert.ok(fs.existsSync(path.join(targetDir, dir, ".gitkeep")));
    }
  } finally {
    removeTempDir(targetDir);
  }
});

test("generate with gitkeep preserves existing .gitkeep and does not overwrite", () => {
  // Arrange
  const arch = loadArchitectures({ scope: "backend" }).find((a) => a.id === "layered");
  assert.ok(arch);
  const targetDir = makeTempDir();
  fs.mkdirSync(path.join(targetDir, "config"), { recursive: true });
  fs.writeFileSync(path.join(targetDir, "config", ".gitkeep"), "custom");

  try {
    // Act
    const { created, skipped } = generate(arch, targetDir, { gitkeep: true });

    // Assert
    assert.equal(fs.readFileSync(path.join(targetDir, "config", ".gitkeep"), "utf8"), "custom");
    assert.ok(skipped.files.includes("config/.gitkeep"));
    assert.ok(!created.files.includes("config/.gitkeep"));
    assert.ok(skipped.dirs.includes("config"));
  } finally {
    removeTempDir(targetDir);
  }
});
