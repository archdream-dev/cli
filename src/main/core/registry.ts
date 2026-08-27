import type { Command, CommandContext } from "./command.js";

export class Registry {
  private commands: Command[] = [];

  register(cmd: Command): void {
    this.commands.push(cmd);
  }

  list(): Command[] {
    return [...this.commands];
  }

  resolve(command?: string, subcommand?: string): Command | undefined {
    // exact match command+subcommand first
    if (command && subcommand) {
      const exact = this.commands.find((c) => c.name === command && c.subcommand === subcommand);
      if (exact) return exact;
    }
    if (command) {
      const single = this.commands.find((c) => c.name === command && !c.subcommand);
      if (single) return single;
    }
    return undefined;
  }

  helpLines(): string[] {
    return this.commands.map((c) => {
      const key = c.subcommand ? `${c.name} ${c.subcommand}` : c.name;
      return `  archdream ${key.padEnd(35)} ${c.description}`;
    });
  }
}

export function createRegistry(): Registry {
  return new Registry();
}
