import * as p from "@clack/prompts";
import { listCustomSnapshots, removeSnapshot } from "../../domains/snapshot/snapshot.js";
import type { Command, CommandContext } from "../../core/command.js";

export const removeSnapshotCommand: Command = {
  name: "remove",
  subcommand: "snapshot",
  description: "Delete a custom snapshot (interactive picker if name omitted)",
  async run(ctx: CommandContext) {
    const args = ctx.args;
    const scopeArg = ctx.flags.scopeArg;
    let id = args[0];
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
      [scope, id] = (selected as string).split("/");
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
  },
};
