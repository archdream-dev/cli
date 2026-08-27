import type { Registry } from "./registry.js";

export function printHelp(_registry: Registry): void {
  console.log(`Archdream CLI - scaffold folder structures from architecture presets

Usage:
  archdream [target-dir] [--gitkeep]  Scaffold a folder structure (dir is created if missing)
  archdream list                      List all available architectures
  archdream create snapshot [name] [target-dir] [--scope <scope>]
                                       Save the target's folder structure as a reusable architecture
  archdream remove snapshot [name] [--scope <scope>]
                                       Delete a custom snapshot (interactive picker if name omitted)
  archdream remove scope [name]        Delete a custom scope (builtin protected, confirms if not empty)
  archdream edit scope [name]          Rename or delete a custom scope (interactive picker)
  archdream help                      Show this help message

Options:
  --gitkeep                            Seed empty dirs with .gitkeep (also prompted interactively)

Examples:
  archdream my-app
  archdream my-app --gitkeep
  archdream create snapshot my-backend my-project
  archdream create snapshot            Snapshot current directory as <folder-name>
  archdream remove snapshot my-backend --scope backend
  archdream remove scope my-custom
  archdream edit scope my-custom
`);
}
