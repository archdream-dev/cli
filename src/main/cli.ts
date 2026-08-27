#!/usr/bin/env node

import process from "node:process";
import { parseArgs } from "./core/args.js";
import { createRegistry } from "./core/registry.js";
import { printHelp } from "./core/help.js";
import { loadArchitectures } from "./load-architectures.js";
import { listCommand } from "./commands/list.command.js";
import { createHelpCommand } from "./commands/help.command.js";
import { createSnapshotCommand } from "./commands/create/snapshot.command.js";
import { removeSnapshotCommand } from "./commands/remove/snapshot.command.js";
import { removeScopeCommand } from "./commands/remove/scope.command.js";
import { editScopeCommand } from "./commands/edit/scope.command.js";
import { isScaffoldTarget, scaffoldCommand } from "./commands/scaffold/scaffold.command.js";

function loadOrExit() {
  try {
    return loadArchitectures();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load architectures: ${message}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const registry = createRegistry();

  // Register all commands
  registry.register(listCommand);
  registry.register(createSnapshotCommand);
  registry.register(removeSnapshotCommand);
  registry.register(removeScopeCommand);
  registry.register(editScopeCommand);
  // help needs registry reference
  registry.register(createHelpCommand(registry));

  // Load architectures eagerly for early exit paths (keeps original behavior)
  loadOrExit();

  const { command, subcommand, positional, flags } = parsed;

  // --help / -h / help
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp(registry);
    return;
  }

  // list
  if (command === "list" && !subcommand) {
    await listCommand.run({ args: [], flags });
    return;
  }

  // Try registry for explicit commands (create/remove/edit)
  const resolved = registry.resolve(command, subcommand);
  if (resolved) {
    // positional already holds args after command/subcommand
    await resolved.run({ args: positional, flags });
    return;
  }

  // Unknown subcommand handling for families
  if (command === "create" || command === "remove" || command === "edit") {
    const hint =
      command === "create"
        ? 'Did you mean "archdream create snapshot <name>"? Run "archdream help" for usage.'
        : command === "remove"
          ? 'Did you mean "archdream remove snapshot <name>" or "archdream remove scope <name>"? Run "archdream help" for usage.'
          : 'Did you mean "archdream edit scope <name>"? Run "archdream help" for usage.';
    console.error(`Unknown subcommand: archdream ${command} ${subcommand ?? ""}\n${hint}`);
    process.exit(1);
  }

  // Unknown flag (starts with -) not handled by parseArgs
  if (command && command.startsWith("-")) {
    console.error(`Archdream CLI does not have option "${command}".\nRun "archdream help" to see available commands.`);
    process.exit(1);
  }

  // Scaffold fallback: no command or target-dir (e.g. "my-app" or ".")
  if (!command || isScaffoldTarget(command)) {
    const targetArgs = command ? [command, ...positional] : [];
    // include any remaining positional that could be target? scaffold only expects 0 or 1 arg
    // If user passed "my-app --gitkeep", parsed positional is empty, command is "my-app", so targetArgs = ["my-app"]
    // If no command, targetArgs = []
    await scaffoldCommand.run({ args: targetArgs.slice(0, 1), flags });
    return;
  }

  // Fallback help
  printHelp(registry);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
