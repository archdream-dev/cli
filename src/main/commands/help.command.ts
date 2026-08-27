import type { Command } from "../core/command.js";
import type { Registry } from "../core/registry.js";
import { printHelp } from "../core/help.js";

export function createHelpCommand(registry: Registry): Command {
  return {
    name: "help",
    description: "Show this help message",
    async run() {
      printHelp(registry);
    },
  };
}
