# archdream-cli

CLI that scaffolds folder structures from architecture presets. Published on npm as [`archdream`](https://www.npmjs.com/package/archdream).

Run it from the folder where you want the layout (e.g. `src/`). Folders are created in the current directory — no extra wrapper paths.

## Install

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install -g archdream
```

Try without a global install (works the same on every OS):

```bash
npx archdream
```

## Platform notes

Commands below assume a POSIX shell (`bash` / `zsh`). On Windows, use **PowerShell** or **Windows Terminal** unless noted.

### macOS

**Install Node**

- [nodejs.org](https://nodejs.org/) installer — common, but global `npm` may end up in a root-owned directory (see permission fix below).
- [Homebrew](https://brew.sh/): `brew install node` — usually avoids global permission issues.
- [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) — recommended; keeps Node and global packages under your home directory.

**Global install permission errors (`EACCES`)**

The official macOS Node installer often leaves `/usr/local/lib/node_modules` owned by root. Do **not** use `sudo npm install -g`.

Fix with a user-owned prefix:

```bash
mkdir -p ~/.npm-global
npm config set prefix "$HOME/.npm-global"
```

Add to `~/.zshrc` (default shell on recent macOS):

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

Reload the shell (`source ~/.zshrc`), then:

```bash
npm install -g archdream
```

**Security and privacy**

- macOS does not need special Full Disk Access for `archdream` — it only creates folders under paths you choose.
- If you download Node manually (not via Homebrew/npm), Gatekeeper may quarantine the binary. Remove quarantine if `node` refuses to run:

```bash
xattr -dr com.apple.quarantine /path/to/node
```

**Usage**

```bash
mkdir -p my-app/src && cd my-app/src
archdream
archdream ./src
```

---

### Linux

**Install Node**

Distro packages are often outdated (below Node 18). Prefer one of:

- [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm)
- [NodeSource](https://github.com/nodesource/distributions) setup script for your distribution
- [nodejs.org](https://nodejs.org/) binary tarball

Check your version:

```bash
node -v   # should be v18 or higher
```

**Global install permission errors (`EACCES`)**

Same pattern as macOS — use a user prefix instead of `sudo`:

```bash
mkdir -p ~/.npm-global
npm config set prefix "$HOME/.npm-global"
```

Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile` (whichever your shell loads):

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
```

Reload, then `npm install -g archdream`.

**Snap / Flatpak Node**

Global installs inside Snap or Flatpak sandboxes can fail or install to unexpected locations. Use nvm/fnm or the official tarball instead of `snap install node` if `archdream` is not found after install.

**Usage**

```bash
mkdir -p my-app/src && cd my-app/src
archdream
archdream ./src
```

On WSL, treat the environment as Linux (paths like `/home/you/project/src`).

---

### Windows

**Install Node**

- Installer from [nodejs.org](https://nodejs.org/) (includes npm; adds global bin dir to PATH).
- Package managers:

```powershell
winget install OpenJS.NodeJS.LTS
```

```powershell
choco install nodejs-lts
```

Restart the terminal after install so `node` and `npm` are on PATH.

**`archdream` not recognized after global install**

Global npm binaries live in:

```text
%AppData%\npm
```

The Node installer normally adds this to PATH. If the command is not found:

1. Open **Settings → System → About → Advanced system settings → Environment Variables**.
2. Under your user **Path**, ensure `%AppData%\npm` is listed.
3. Open a **new** terminal window and run `archdream` again.

Do **not** run `npm install -g` in an elevated (“Run as administrator”) terminal unless you intend to; mixing admin and user global installs causes confusing PATH behavior.

**PowerShell execution policy**

If npm or npx scripts fail with an execution policy error:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Usage**

PowerShell or cmd:

```powershell
mkdir my-app\src
cd my-app\src
archdream
archdream .\src
```

Forward slashes also work: `archdream ./src`.

**WSL**

Install Node inside WSL (Linux notes above). Run `archdream` from the WSL shell when working on files under the Linux filesystem (`/home/...`). Accessing Windows paths (`/mnt/c/...`) works but can be slower; prefer Linux paths for active development.

---

## Usage

```bash
# Interactive: pick a preset in the current directory
archdream

# Scaffold into a specific path (relative or absolute)
archdream ./src

# List available presets and their folder trees
archdream list
```

### What happens when you run it

1. **Target directory** — Defaults to the current working directory, or the path you pass on the command line.
2. **Non-empty directory** — If the target already has files or folders, you can continue (existing paths are skipped) or abort.
3. **Preset selection** — Choose a layout from the interactive menu.
4. **Generation** — Missing directories are created; paths that already exist are left unchanged and reported in the summary.

### Example session

```text
$ mkdir -p my-app/src && cd my-app/src
$ archdream
```

You will be prompted to choose a preset. When finished, the CLI prints which directories were created and which were skipped.

To preview presets before running:

```bash
archdream list
```
