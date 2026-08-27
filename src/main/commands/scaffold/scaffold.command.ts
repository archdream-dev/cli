import path from "node:path";
import process from "node:process";
import * as p from "@clack/prompts";
import { generate } from "../../generate.js";
import { getScopes, loadArchitectures } from "../../load-architectures.js";
import { confirmNonEmpty, promptArchitecture, promptGitkeep, promptScope } from "../../prompts/scaffold.js";
import { scopeLabel } from "../../types.js";
import type { Command, CommandContext } from "../../core/command.js";

function resolveTargetDir(arg: string | undefined): string {
  if (!arg) return process.cwd();
  return path.resolve(process.cwd(), arg);
}

export const scaffoldCommand: Command = {
  name: "scaffold",
  description: "Scaffold a folder structure (dir is created if missing)",
  async run(ctx: CommandContext) {
    // scaffold is default: ctx.args[0] may be target-dir or undefined
    // ctx.flags.gitkeepFlag already parsed
    const targetArg = ctx.args[0];
    const targetDir = resolveTargetDir(targetArg);
    const gitkeepFlag = ctx.flags.gitkeepFlag;

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
        skipped.dirs.length ? `Skipped dirs (exist):\n  ${skipped.dirs.join("\n  ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      "Summary",
    );

    p.outro(`Scaffold ready at ${targetDir}`);
  },
};

// helper for cli to detect scaffold target
export function isScaffoldTarget(arg: string | undefined): boolean {
  if (!arg) return true; // no args = scaffold cwd
  if (arg === "list" || arg === "help" || arg === "create" || arg === "remove" || arg === "edit") return false;
  if (arg.startsWith("-")) return false;
  return true;
}
