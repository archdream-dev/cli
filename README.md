# archdream-cli

CLI that scaffolds folder structures from architecture presets. Published on npm as [`archdream`](https://www.npmjs.com/package/archdream).

Run it from the folder where you want the layout (e.g. `src/`). Folders are created in the current directory — no extra wrapper paths.

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
cd src
archdream

archdream ./src
archdream list
```

## Example

```text
$ mkdir -p my-app/src && cd my-app/src
$ archdream
```

**Layered** — classic backend tiers plus shared pieces:

```text
config/
controller/
service/
repository/
model/
mapper/
```

**Clean** — domain at the center, application orchestration, infrastructure adapters:

```text
domain/
application/dto/
application/usecase/
application/exception/
infrastructure/config/
infrastructure/adapter/jpa/
infrastructure/adapter/rest/
```

## Architectures

### Layered

Controller → service → repository flow, with config, model, and mapper folders.

- `config/`
- `controller/`
- `service/`
- `repository/`
- `model/`
- `mapper/`

### Clean

Domain, application layer (DTOs, use cases, exceptions), and infrastructure (config, JPA/REST adapters). Pragmatic layout — dependencies point inward without over-splitting packages.

- `domain/`
- `application/dto/`
- `application/usecase/`
- `application/exception/`
- `infrastructure/config/`
- `infrastructure/adapter/jpa/`
- `infrastructure/adapter/rest/`

---

<p align="center">
  <b>Omar Ismayilov</b><br>
  <i>Software Engineer • Backend & System Design Enthusiast</i><br>
  Building reliable systems with simplicity and architecture in mind.
</p>
