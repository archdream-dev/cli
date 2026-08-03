export const SCOPES = ["backend", "frontend"] as const;

export type Scope = (typeof SCOPES)[number];

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

export const SCOPE_LABELS: Record<Scope, string> = {
  backend: "Backend",
  frontend: "Frontend",
};
