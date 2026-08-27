export interface ParsedArgs {
  command: string | undefined;
  subcommand: string | undefined;
  positional: string[]; // remaining after command/subcommand
  flags: {
    scopeArg?: string;
    gitkeepFlag?: boolean;
  };
  raw: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const raw = [...argv];
  const args = [...argv];

  const scopeFlagIndex = args.indexOf("--scope");
  const scopeArgRaw = scopeFlagIndex !== -1 ? args.splice(scopeFlagIndex, 2)[1] : undefined;

  const gitkeepFlagIndex = args.indexOf("--gitkeep");
  const gitkeepFlagRaw = gitkeepFlagIndex !== -1 ? Boolean(args.splice(gitkeepFlagIndex, 1)) : undefined;

  const command = args[0];
  const subcommand = args[1];
  const positional = args.slice(2);

  const flags: ParsedArgs["flags"] = {};
  if (scopeArgRaw !== undefined) flags.scopeArg = scopeArgRaw;
  if (gitkeepFlagRaw !== undefined) flags.gitkeepFlag = gitkeepFlagRaw;

  return { command, subcommand, positional, flags, raw };
}
