import { getScopes, loadArchitectures } from "../load-architectures.js";
import { scopeLabel } from "../types.js";
import type { Command } from "../core/command.js";

function printArchitectures(): void {
  const architectures = loadArchitectures();
  for (const scope of getScopes()) {
    const scoped = architectures.filter((arch) => arch.scope === scope);
    if (!scoped.length) continue;
    console.log(`${scopeLabel(scope)}:`);
    for (const arch of scoped) {
      console.log(`  ${arch.id}\t${arch.name}`);
      console.log(`    ${arch.description}`);
      console.log(`    dirs: ${arch.tree.join(", ")}`);
    }
    console.log();
  }
}

export const listCommand: Command = {
  name: "list",
  description: "List all available architectures",
  async run() {
    printArchitectures();
  },
};
