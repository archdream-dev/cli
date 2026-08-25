export const BUILTIN_SCOPES = ["backend", "frontend"] as const;

export type Scope = string;

export interface Architecture {
  id: string;
  name: string;
  description: string;
  scope: Scope;
  tree: string[];
}

export interface ArchitectureYaml {
  id?: string;
  name?: string;
  description?: string;
  tree?: string[];
}

export interface GenerateResult {
  created: { dirs: string[] };
  skipped: { dirs: string[] };
}

export const SCOPE_LABELS: Partial<Record<Scope, string>> = {
  backend: "Backend",
  frontend: "Frontend",
};

export function scopeLabel(scope: Scope): string {
  return SCOPE_LABELS[scope] ?? scope.charAt(0).toUpperCase() + scope.slice(1);
}
