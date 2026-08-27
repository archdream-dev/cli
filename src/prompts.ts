import * as p from "@clack/prompts";
import process from "node:process";

import { isDirEmpty } from "./generate.js";
import { getScopes } from "./load-architectures.js";
import { scopeLabel, type Architecture, type Scope } from "./types.js";

function exit(code = 0): never {
  process.exit(code);
}

export function sanitizeScopeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function promptScope(): Promise<Scope> {
  const NEW_SCOPE = "__new__";

  const selected = await p.select({
    message: "Choose project scope",
    options: [
      ...getScopes().map((scope) => ({
        value: scope,
        label: scopeLabel(scope),
      })),
      { value: NEW_SCOPE, label: "New scope…" },
    ],
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    exit(0);
  }

  if (selected !== NEW_SCOPE) {
    return selected;
  }

  for (;;) {
    const answer = await p.text({
      message: "Enter a name for the new scope",
      placeholder: "e.g. mobile, cli-tool",
    });

    if (p.isCancel(answer)) {
      p.cancel("Cancelled.");
      exit(0);
    }

    const sanitized = sanitizeScopeName(answer ?? "");
    if (sanitized) {
      return sanitized;
    }

    p.log.error("Scope name cannot be empty. Try again.");
  }
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

export async function promptGitkeep(): Promise<boolean> {
  const choice = await p.confirm({
    message: "Seed empty dirs with .gitkeep?",
    initialValue: false,
  });

  if (p.isCancel(choice)) {
    p.cancel("Cancelled.");
    exit(0);
  }

  return Boolean(choice);
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
