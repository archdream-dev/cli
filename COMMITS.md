# Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <short description>

[optional body]
```

## Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability for users |
| `fix` | Bug fix |
| `docs` | Documentation only changes (README, guides) |
| `chore` | Maintenance: build config, deps, gitignore, tooling |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `style` | Formatting, whitespace, no logic change |

## Scope (optional)

Use the affected area, e.g. `feat(snapshot):`, `fix(cli):`, `chore(tests):`.

## Branches

Branch names must mirror commit conventions — the branch must suit the change just like the commit.

**Format:**

```
<type>/<kebab-case-description>
```

or with optional scope:

```
<type>/<scope>-<kebab-case-description>
```

**Rules:**

- Use the same `<type>` as the commit (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`)
- Use kebab-case, lowercase, no spaces, no trailing punctuation
- Keep it short and imperative — describe the change, not the ticket
- One branch per logical change — don't mix unrelated work (same rule as commits)
- Branch from `main` and open PR against `main`

**Examples:**

```
feat/seed-gitkeep
feat/scope-edit-remove
refactor/project-restructure
refactor/command-registry
fix/cli-help-duplication
chore/ignore-ds-store
docs/readme-badges
test/cli-help-coverage
```

## Rules

- Subject line: imperative mood, lowercase, no period, max ~72 chars
- One logical change per commit — don't mix unrelated work
- Breaking changes: add `!` after type/scope and describe in the body

## Examples

```
feat(snapshot): add create snapshot command to save custom architectures
fix(cli): treat non-existent paths as target dirs instead of unknown commands
refactor(types): make scopes dynamic to support custom scope discovery
test(cli): cover help output and error messages
docs: update readme with commands table and help pointer
chore: ignore .DS_Store files
```

## Guidance for AI models

When asked to commit changes made by an AI agent:

1. Run `git status` and `git diff` first; group changes by concern
2. Stage only files belonging to each commit (`git add <paths>`)
3. Pick the most specific type; prefer `feat`/`fix` over `chore`
4. Never commit secrets, credentials, or OS junk files (`.DS_Store`)
5. Verify the working tree is clean after the last commit
