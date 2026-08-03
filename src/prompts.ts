import * as p from "@clack/prompts";
import process from "node:process";

import { isDirEmpty } from "./generate.js";
import { SCOPES } from "./load-architectures.js";
import { SCOPE_LABELS, type Architecture, type Scope } from "./types.js";

function exit(code = 0): never {
  process.exit(code);
}

export async function promptScope(): Promise<Scope> {
  const selected = await p.select({
    message: "Choose project scope",
    options: SCOPES.map((scope) => ({
      value: scope,
      label: SCOPE_LABELS[scope],
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    exit(0);
  }

  return selected;
}

export async function promptArchitecture(
  architectures: Architecture[],
): Promise<Architecture> {
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
    exit(0);
  }

  const architecture = architectures.find((a) => a.id === selected);
  if (!architecture) {
    p.cancel("Architecture not found.");
    exit(1);
  }

  return architecture;
}

export async function confirmNonEmpty(targetDir: string): Promise<true> {
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
    exit(0);
  }

  return true;
}
