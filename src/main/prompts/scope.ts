import * as p from "@clack/prompts";
import { getCustomScopes } from "../domains/scope/scope.js";
import { scopeLabel, type Scope } from "../types.js";
import { exit, sanitizeScopeName } from "./shared.js";

export async function promptCustomScope(message = "Choose a scope"): Promise<Scope> {
  const customScopes = getCustomScopes();
  if (!customScopes.length) {
    p.cancel("No custom scopes found.");
    exit(1);
  }
  const selected = await p.select({
    message,
    options: customScopes.map((scope) => ({
      value: scope,
      label: scopeLabel(scope),
      hint: `scope: ${scope}`,
    })),
  });
  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    exit(0);
  }
  return selected as Scope;
}

export async function promptScopeRename(oldScope: Scope): Promise<Scope> {
  for (;;) {
    const answer = await p.text({
      message: `Enter new name for scope "${oldScope}"`,
      placeholder: "e.g. mobile, cli-tool",
    });
    if (p.isCancel(answer)) {
      p.cancel("Cancelled.");
      exit(0);
    }
    const sanitized = sanitizeScopeName(answer ?? "");
    if (!sanitized) {
      p.log.error("Scope name cannot be empty. Try again.");
      continue;
    }
    if (sanitized === oldScope) {
      p.log.error(`Scope "${sanitized}" already exists. Choose a different name.`);
      continue;
    }
    const customScopes = getCustomScopes();
    if (customScopes.includes(sanitized)) {
      p.log.error(`Scope "${sanitized}" already exists. Choose a different name.`);
      continue;
    }
    return sanitized;
  }
}

export async function promptEditAction(): Promise<"rename" | "delete"> {
  const selected = await p.select({
    message: "What do you want to do?",
    options: [
      { value: "rename", label: "Rename scope" },
      { value: "delete", label: "Delete scope" },
    ],
  });
  if (p.isCancel(selected)) {
    p.cancel("Cancelled.");
    exit(0);
  }
  return selected as "rename" | "delete";
}

export async function confirmScopeDelete(scope: Scope, count: number): Promise<boolean> {
  const message = count > 0 ? `Scope "${scope}" has ${count} snapshot(s). Delete anyway?` : `Delete scope "${scope}"?`;
  const choice = await p.confirm({
    message,
    initialValue: false,
  });
  if (p.isCancel(choice)) {
    p.cancel("Cancelled.");
    exit(0);
  }
  if (!choice) {
    p.cancel("Aborted.");
    exit(0);
  }
  return true;
}
