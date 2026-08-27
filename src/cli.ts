#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import * as p from "@clack/prompts";

import { generate } from "./generate.js";
import { getScopes, loadArchitectures } from "./load-architectures.js";
import { confirmNonEmpty, promptArchitecture, promptGitkeep, promptScope, sanitizeScopeName } from "./prompts.js";
import { listCustomSnapshots, removeSnapshot, saveArchitecture, snapshotToArchitecture } from "./snapshot.js";
import { scopeLabel, type Architecture, type Scope } from "./types.js";

function printArchitectures(architectures: Architecture[]): void {
  for (const scope of getScopes()) {
    const scoped = architectures.filter((arch) => arch.scope === scope);
    if (!scoped.length) continue;

    console.log(`${scopeLabel(scope)}:`);
    for (const arch of scoped) {
      console.log(`  ${arch.id}\t${arch.name}`);
      console.log(`    ${arch.description}`);
      console.log(`    dirs: ${arch.tree.join(", ")}`);
    }
    console.log();
  }
}

function resolveTargetDir(arg: string | undefined): string {
  if (!arg) return process.cwd();
  return path.resolve(process.cwd(), arg);
}

function loadOrExit(): Architecture[] {
  try {
    return loadArchitectures();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load architectures: ${message}`);
    process.exit(1);
  }
}

async function createSnapshot(
  name: string,
  targetArg: string | undefined,
  scopeArg: string | undefined,
): Promise<void> {
  const targetDir = resolveTargetDir(targetArg);

  let scope: Scope;
  if (scopeArg) {
    const sanitized = sanitizeScopeName(scopeArg);
    if (!sanitized) {
      console.error(`Invalid scope name: ${scopeArg}`);
      process.exit(1);
    }
    scope = sanitized;
  } else {
    scope = await promptScope();
  }

  try {
    const arch = snapshotToArchitecture(targetDir, name, scope);
    const filePath = saveArchitecture(arch);
    p.outro(`Snapshot saved: ${filePath} (${arch.tree.length} dirs)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.cancel(message);
    process.exit(1);
  }
}

async function removeSnapshotCommand(
  name: string | undefined,
  scopeArg: string | undefined,
): Promise<void> {
  let id = name;
  let scope = scopeArg;

  if (!id) {
    const snapshots = listCustomSnapshots();
    if (!snapshots.length) {
      p.cancel("No custom snapshots found.");
      process.exit(1);
    }

    const selected = await p.select({
      message: "Choose a snapshot to remove",
      options: snapshots.map((s) => ({
        value: `${s.scope}/${s.id}`,
        label: s.id,
        hint: `scope: ${s.scope}`,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    [scope, id] = selected.split("/");
  }

  if (!id) {
    p.cancel("Snapshot id is required.");
    process.exit(1);
  }

  try {
    const filePath = removeSnapshot(id, scope);
    p.outro(`Removed snapshot: ${filePath}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.cancel(message);
    process.exit(1);
  }
}

function printHelp(): void {  console.log(`Archdream CLI - scaffold folder structures from architecture presets

Usage:
  archdream [target-dir] [--gitkeep]  Scaffold a folder structure (dir is created if missing)
  archdream list                      List all available architectures
  archdream create snapshot [name] [target-dir] [--scope <scope>]
                                       Save the target's folder structure as a reusable architecture
                                       (defaults: name = current folder name, target = current directory)
  archdream remove snapshot [name] [--scope <scope>]
                                       Delete a custom snapshot (interactive picker if name is omitted)
  archdream help                      Show this help message

Options:
  --gitkeep                            Seed empty dirs with .gitkeep (also prompted interactively)

Examples:
  archdream my-app
  archdream my-app --gitkeep
  archdream create snapshot my-backend my-project
  archdream create snapshot            Snapshot current directory as <folder-name>
  archdream remove snapshot my-backend --scope backend
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const scopeFlagIndex = args.indexOf("--scope");
  const scopeArg = scopeFlagIndex !== -1 ? args.splice(scopeFlagIndex, 2)[1] : undefined;
  const gitkeepFlagIndex = args.indexOf("--gitkeep");
  const gitkeepFlag = gitkeepFlagIndex !== -1 ? Boolean(args.splice(gitkeepFlagIndex, 1)) : undefined;
  const command = args[0];
  const architectures = loadOrExit();

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    printArchitectures(architectures);
    return;
  }

  if (command === "create") {
    if (args[1] !== "snapshot") {
      console.error(
        `Unknown subcommand: archdream create ${args[1] ?? ""}\nDid you mean "archdream create snapshot <name>"? Run "archdream help" for usage.`,      );
      process.exit(1);
    }
    const name = args[2];
    const targetArg = args[3];

    if (!name && targetArg) {
      console.error("Usage: archdream create snapshot [name] [target-dir]");
      process.exit(1);
    }

    const resolvedName =
      name ?? path.basename(path.resolve(process.cwd(), targetArg ?? "."));

    await createSnapshot(resolvedName, targetArg, scopeArg);
    return;
  }

  if (command === "remove") {
    if (args[1] !== "snapshot") {
      console.error(
        `Unknown subcommand: archdream remove ${args[1] ?? ""}\nDid you mean "archdream remove snapshot <name>"? Run "archdream help" for usage.`,
      );
      process.exit(1);
    }
    await removeSnapshotCommand(args[2], scopeArg);
    return;
  }

  if (command && command.startsWith("-")) {
    console.error(
      `Archdream CLI does not have option "${command}".\nRun "archdream help" to see available commands.`,
    );
    process.exit(1);
  }

  const targetArg = command && command !== "list" ? command : undefined;
  const targetDir = resolveTargetDir(targetArg);

  p.intro("Archdream CLI");

  await confirmNonEmpty(targetDir);

  const scope = await promptScope();
  const scopedArchitectures = loadArchitectures({ scope });

  if (!scopedArchitectures.length) {
    p.cancel(`No architectures found for ${scopeLabel(scope)}.`);
    process.exit(1);
  }

  const architecture = await promptArchitecture(scopedArchitectures);

  const gitkeep = gitkeepFlag ?? (await promptGitkeep());

  const spinner = p.spinner();
  spinner.start(`Generating ${architecture.name}…`);

  const { created, skipped } = generate(architecture, targetDir, { gitkeep });

  spinner.stop("Done.");

  p.note(
    [
      `Target: ${targetDir}`,
      `Scope: ${scopeLabel(architecture.scope)}`,
      `Architecture: ${architecture.name}`,
      `Gitkeep: ${gitkeep ? "yes" : "no"}`,
      "",
      created.dirs.length ? `Created dirs:\n  ${created.dirs.join("\n  ")}` : "",
      skipped.dirs.length
        ? `Skipped dirs (exist):\n  ${skipped.dirs.join("\n  ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Summary",
  );

  p.outro(`Scaffold ready at ${targetDir}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
