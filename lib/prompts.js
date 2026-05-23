import * as p from "@clack/prompts";
import { SCOPES } from "./load-architectures.js";
import { isDirEmpty } from "./generate.js";

const SCOPE_LABELS = {
  backend: "Backend",
  frontend: "Frontend",
};

export async function promptScope() {
  const selected = await p.select({
    message: "Choose project scope",
    options: SCOPES.map((scope) => ({
      value: scope,
      label: SCOPE_LABELS[scope] ?? scope,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  return selected;
}

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
