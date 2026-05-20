import * as p from "@clack/prompts";
import { isDirEmpty } from "./generate.js";

export async function promptArchitecture(architectures) {
  const selected = await p.select({
    message: "Choose an architecture",
    options: architectures.map((arch) => ({
      value: arch.id,
      label: arch.name,
      hint: arch.description,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  return architectures.find((a) => a.id === selected);
}

export async function confirmNonEmpty(targetDir) {
  if (isDirEmpty(targetDir)) return true;

  const choice = await p.select({
    message: `Directory "${targetDir}" is not empty. Continue anyway?`,
    options: [
      { value: "continue", label: "Continue (skip existing paths)" },
      { value: "abort", label: "Abort" },
    ],
  });

  if (p.isCancel(choice) || choice === "abort") {
    p.cancel("Aborted.");
    process.exit(0);
  }

  return true;
}
