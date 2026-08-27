export interface CommandContext {
  args: string[];
  flags: {
    scopeArg?: string;
    gitkeepFlag?: boolean;
  };
}

export interface Command {
  /** primary name, e.g. "create", "remove", "edit", "list", "help", "scaffold" */
  name: string;
  /** subcommand for families like "create snapshot" */
  subcommand?: string;
  description: string;
  /** run the command; throw to signal error, caller handles exit */
  run(ctx: CommandContext): Promise<void> | void;
}
