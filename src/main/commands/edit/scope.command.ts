import * as p from "@clack/prompts";
import { sanitizeScopeName } from "../../prompts/shared.js";
import { confirmScopeDelete, promptCustomScope, promptEditAction, promptScopeRename } from "../../prompts/scope.js";
import { countSnapshotsInScope, removeScope, renameScope } from "../../domains/scope/scope.js";
import type { Command, CommandContext } from "../../core/command.js";

export const editScopeCommand: Command = {
  name: "edit",
  subcommand: "scope",
  description: "Rename or delete a custom scope (interactive picker)",
  async run(ctx: CommandContext) {
    const args = ctx.args;
    let scope = args[0] ? sanitizeScopeName(args[0]) : "";
    if (!scope) {
      if (args[0]) {
        console.error(`Invalid scope name: ${args[0]}`);
        process.exit(1);
      }
      scope = await promptCustomScope("Choose a scope to edit");
    }
    if (!scope) {
      p.cancel("Scope name is required.");
      process.exit(1);
    }
    try {
      const action = await promptEditAction();
      if (action === "delete") {
        const count = countSnapshotsInScope(scope);
        if (count > 0) await confirmScopeDelete(scope, count);
        const dir = removeScope(scope);
        p.outro(`Removed scope: ${dir}${count ? ` (${count} snapshot(s))` : ""}`);
        return;
      }
      const newScope = await promptScopeRename(scope);
      const { oldPath, newPath } = renameScope(scope, newScope);
      p.outro(`Renamed scope: ${oldPath} → ${newPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      p.cancel(message);
      process.exit(1);
    }
  },
};
