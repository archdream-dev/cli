import path from "node:path";
import process from "node:process";
import * as p from "@clack/prompts";
import { sanitizeScopeName } from "../../prompts/shared.js";
import { promptScope } from "../../prompts/scaffold.js";
import { saveArchitecture, snapshotToArchitecture } from "../../domains/snapshot/snapshot.js";
import type { Command, CommandContext } from "../../core/command.js";

function resolveTargetDir(arg: string | undefined): string {
  if (!arg) return process.cwd();
  return path.resolve(process.cwd(), arg);
}

export const createSnapshotCommand: Command = {
  name: "create",
  subcommand: "snapshot",
  description: "Save the target's folder structure as a reusable architecture",
  async run(ctx: CommandContext) {
    const args = ctx.args; // after "create snapshot"
    const scopeArg = ctx.flags.scopeArg;
    const name = args[0];
    const targetArg = args[1];

    if (!name && targetArg) {
      console.error("Usage: archdream create snapshot [name] [target-dir]");
      process.exit(1);
    }
    const resolvedName = name ?? path.basename(path.resolve(process.cwd(), targetArg ?? "."));
    const targetDir = resolveTargetDir(targetArg);

    let scope: string;
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
      const arch = snapshotToArchitecture(targetDir, resolvedName, scope);
      const filePath = saveArchitecture(arch);
      p.outro(`Snapshot saved: ${filePath} (${arch.tree.length} dirs)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      p.cancel(message);
      process.exit(1);
    }
  },
};
