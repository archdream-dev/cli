import process from "node:process";

export function exit(code = 0): never {
  process.exit(code);
}

export function sanitizeScopeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
