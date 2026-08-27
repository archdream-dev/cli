import * as p from "@clack/prompts";
import { sanitizeScopeName } from "../../prompts/shared.js";
import { confirmScopeDelete, promptCustomScope } from "../../prompts/scope.js";
import { countSnapshotsInScope, removeScope } from "../../domains/scope/scope.js";
import type { Command, CommandContext } from "../../core/command.js";

export const removeScopeCommand: Command = {
  name: "remove",
  subcommand: "scope",
  description: "Delete a custom scope (builtin protected, confirms if not empty)",
  async run(ctx: CommandContext) {
    const args = ctx.args;
    let scope = args[0] ? sanitizeScopeName(args[0]) : "";
    if (!scope) {
      if (args[0]) {
        console.error(`Invalid scope name: ${args[0]}`);
        process.exit(1);
      }
      scope = await promptCustomScope("Choose a scope to remove");
    }
    if (!scope) {
      p.cancel("Scope name is required.");
      process.exit(1);
    }
    try {
      const count = countSnapshotsInScope(scope);
      if (count > 0) {
        await confirmScopeDelete(scope, count);
      }
      const dir = removeScope(scope);
      p.outro(`Removed scope: ${dir}${count ? ` (${count} snapshot(s))` : ""}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      p.cancel(message);
      process.exit(1);
    }
  },
};
