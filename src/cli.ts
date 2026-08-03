#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import * as p from "@clack/prompts";

import { generate } from "./generate.js";
import { loadArchitectures, SCOPES } from "./load-architectures.js";
import { confirmNonEmpty, promptArchitecture, promptScope } from "./prompts.js";
import { SCOPE_LABELS, type Architecture } from "./types.js";

function printArchitectures(architectures: Architecture[]): void {
  for (const scope of SCOPES) {
    const scoped = architectures.filter((arch) => arch.scope === scope);
    if (!scoped.length) continue;

    console.log(`${SCOPE_LABELS[scope]}:`);
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const architectures = loadOrExit();

  if (command === "list") {
    printArchitectures(architectures);
    return;
  }

  const targetArg = command && command !== "list" ? command : undefined;
  const targetDir = resolveTargetDir(targetArg);

  p.intro("archdream");

  await confirmNonEmpty(targetDir);

  const scope = await promptScope();
  const scopedArchitectures = loadArchitectures({ scope });

  if (!scopedArchitectures.length) {
    p.cancel(`No architectures found for ${SCOPE_LABELS[scope]}.`);
    process.exit(1);
  }

  const architecture = await promptArchitecture(scopedArchitectures);

  const spinner = p.spinner();
  spinner.start(`Generating ${architecture.name}…`);

  const { created, skipped } = generate(architecture, targetDir);

  spinner.stop("Done.");

  p.note(
    [
      `Target: ${targetDir}`,
      `Scope: ${SCOPE_LABELS[architecture.scope]}`,
      `Architecture: ${architecture.name}`,
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
