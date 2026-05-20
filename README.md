# archdream

Terminal CLI that scaffolds folder structures from architecture presets.

## Install

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install -g archdream
```

Try without installing globally:

```bash
npx archdream
```

### Permission errors on global install

If `npm install -g` fails with `EACCES`, your global npm directory is probably owned by root (common with the macOS Node installer). Do **not** use `sudo`.

Use a user-owned prefix:

```bash
mkdir -p ~/.npm-global
npm config set prefix "$HOME/.npm-global"
```

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

Reload your shell, then run `npm install -g archdream` again.

Alternatively, use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) so global packages install under your home directory.

## Usage

```bash
# From the folder where you want the layout (e.g. src/)
cd src
archdream

# Or pass a target directory (created if missing)
archdream ./src

# List built-in architectures
archdream list
```

## Example session

```text
$ mkdir -p my-app/src && cd my-app/src
$ archdream

┌  archdream
│
◇  Choose an architecture
│  Clean Architecture
│
◇  Done.
│
└  Scaffold ready at .../my-app/src
```

Result (clean, created directly in `src/`):

```text
src/
├── domain/
├── application/
│   ├── dto/
│   ├── usecase/
│   └── exception/
└── infrastructure/
    ├── config/
    └── adapter/
        ├── jpa/
        └── rest/
```

Result (layered):

```text
src/
├── config/
├── controller/
├── service/
├── repository/
├── model/
└── mapper/
```

## Architectures

Definitions live in `architectures/*.yaml` — edit YAML to change folder trees without touching generator code.

| id      | name                 | layout |
|---------|----------------------|--------|
| layered | Layered Architecture | `config/`, `controller/`, `service/`, `repository/`, `model/`, `mapper/` |
| clean   | Clean Architecture   | `domain/`, `application/{dto,usecase,exception}/`, `infrastructure/config/`, `infrastructure/adapter/{jpa,rest}/` |

## Behavior

- Loads all `architectures/*.yaml` at runtime
- Run from the folder where you want the layout; folders are created there (no extra `src/` wrapper in the paths)
- Prompts for architecture, then `mkdir -p` for each `tree` entry (folders only, no files)
- If the target directory is not empty, asks once to abort or continue; never overwrites existing paths

## Development

Clone the repo and link locally (for contributors):

```bash
git clone <repo-url>
cd archdream
npm install
npm link
```

If `npm link` hits `EACCES`, fix your npm prefix (see [Permission errors](#permission-errors-on-global-install)) or use:

```bash
alias archdream='node /absolute/path/to/archdream/bin/archdream'
```

Publish a new version:

```bash
npm login
npm publish
```

Bump `version` in `package.json` before each publish.
