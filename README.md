# assistant-ui-downloader

> Interactive CLI and batch downloader for the [assistant-ui](https://www.assistant-ui.com/) component registry. Pull the whole registry, a category, or just the pieces you pick into your own project in one command.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> [!NOTE]
> **Unofficial.** This is a community tool and is not affiliated with or endorsed by assistant-ui. Components are fetched from the public registry at [r.assistant-ui.com](https://r.assistant-ui.com/registry.json) and remain the work of the assistant-ui authors. For the official experience, see the [assistant-ui docs](https://www.assistant-ui.com/docs) and its own CLI (`npx assistant-ui add`).

---

## Why this exists

The official CLI installs components one at a time or by name. This tool adds:

- **Interactive picker** with category and multi-select modes
- **One-shot batch download** of the full registry (`add --all`)
- **`list`**, **`search`**, and **`info`** commands to browse the registry directly from the terminal
- **`--dry-run`** to preview exactly which files would be written
- **Choice of engine**: a direct REST downloader (default, fast) or delegation to the official CLI (`--official`)

---

## Quick start

```bash
npx github:EzioAman/assistant-ui-downloader
```

Run this from the root of your project. The interactive picker launches with every component pre-selected by default.

*(This package is installed straight from GitHub, not from npm.)*

---

## Prerequisites

The downloaded components are source files that expect an existing app. Before installing, make sure your project has:

1. **A React app** (the registry targets Next.js and other React setups)
2. **Tailwind CSS**
3. **The `@/` import alias configured** (components import `@/lib/utils`)
4. **shadcn-style UI primitives** — many components depend on `button`, `collapsible`, `dialog`, `tooltip`, and similar; see the [assistant-ui docs](https://www.assistant-ui.com/docs) for the recommended setup
5. **A current LTS release of Node.js** (the `engines` field is not set, so this is not enforced)

After a run, the CLI prints the exact dependency install command for the packages the downloaded components need (for example `@assistant-ui/react` and `lucide-react`).

---

## Non-interactive usage

```bash
# Download everything
npx github:EzioAman/assistant-ui-downloader add --all

# Download by category
npx github:EzioAman/assistant-ui-downloader add --category core
npx github:EzioAman/assistant-ui-downloader add --category reasoning

# Download specific components
npx github:EzioAman/assistant-ui-downloader add thread elements-composer voice
```

---

## What you get

At the time of writing, the registry exposes **163 items**: 161 modular component packages (187+ `.tsx` / `.ts` files) plus 2 style specifications. Registry contents change over time, so treat `list` as the source of truth.

| Category | `--category` value | Count | Examples (registry slugs) |
|---|---|---|---|
| **Core & Chat Threads** | `core` | 4 | `thread`, `thread-list`, `utils`, `chat/b/ai-sdk-quick-start/json` |
| **Message Architecture** | `messages` | 11 | `elements-message-pair`, `elements-message-branches`, `elements-suggestions`, `quote` |
| **Reasoning & Thinking** | `reasoning` | 5 | `elements-thinking-indicator`, `elements-reasoning-panel`, `reasoning`, `elements-reasoning-effort` |
| **Streaming & State** | `streaming` | 5 | `elements-streaming-text`, `elements-loading-state`, `elements-typing-indicator`, `heat-graph` |
| **Code & Markdown** | `code_markdown` | 9 | `elements-code-diff`, `markdown-text`, `syntax-highlighter`, `shiki-highlighter`, `mermaid-diagram` |
| **Tools, MCP & Voice** | `tools_mcp` | 19 | `tool-fallback`, `mcp-config`, `voice`, `attachment`, `task-card`, `elements-tool-call` |
| **UI Elements & Primitives** | `elements_ui` | 110 | `elements-surfaces`, `elements-computer-use`, `elements-data-table`, `model-selector`, `logos` |

---

## Where files are written

Most components go under `components/assistant-ui/` (in `elements/` and `utils/` subfolders), and they are plain source files you own and can edit. Some registry items also write elsewhere:

- `lib/utils.ts` (the `cn` helper)
- `hooks/` (for example `use-copy-to-clipboard.ts`)
- `components/ui/` (shared UI primitives)
- `app/` (page and API-route templates, such as the AI SDK quick start in the core category)

> [!TIP]
> Because `add --all` includes app-level templates, run it with `--dry-run` first. Existing files are preserved unless you pass `--overwrite`.

---

## How it works

### Interactive mode (default)

Run without arguments to open the terminal UI, built with [Clack](https://github.com/bombshell-dev/clack):

```bash
npx github:EzioAman/assistant-ui-downloader
```

You will be asked for:
1. **Selection mode**: all components, by category, or fine-grained multi-select
2. **Engine**: direct REST download (fast, default) or delegation to the official `assistant-ui add`
3. **Overwrite behavior**: existing files are preserved by default
4. **Progress**: a live spinner with component counts
5. **Summary**: files created, files preserved, and the dependency install command

### Commands

```bash
# List all components grouped by category
npx github:EzioAman/assistant-ui-downloader list

# Search by keyword
npx github:EzioAman/assistant-ui-downloader search mcp

# Inspect a component's dependencies and files
npx github:EzioAman/assistant-ui-downloader info thread

# Dry run: preview without writing files
npx github:EzioAman/assistant-ui-downloader add --all --dry-run
```

### Options

| Flag | Description |
|---|---|
| `--all` | Select every component in the registry |
| `--category <name>` | One of `core`, `messages`, `reasoning`, `streaming`, `tools_mcp`, `code_markdown`, `elements_ui` |
| `-c, --cwd <path>` | Target working directory (defaults to current directory) |
| `-p, --path <path>` | Custom output path for component files |
| `-o, --overwrite` | Overwrite existing files |
| `-y, --yes` | Skip confirmation prompts (useful in CI) |
| `--direct` | Use direct REST downloader (default) |
| `--official` | Delegate to `npx assistant-ui add` in safe batches |
| `--dry-run` | Preview files and dependencies without writing |

### Installed command names

When installed or linked locally (`npm link`), the same CLI is available as `aui-downloader`, `assistant-ui-downloader`, or the short alias `aui`.

---

## Safety notes

This tool downloads remote source code and writes it into your project. Treat it like any other code you pull in: review the changes (for example with `git diff`) before committing.

### Built-in safeguards:
- **Input validation**: component slugs must match `^[a-zA-Z0-9_\-\/]+$`
- **Path traversal protection**: file writes are checked to stay inside the project root
- **Registry URL allowlist**: only `https://*.assistant-ui.com` endpoints are accepted
- **Graceful interrupts**: `Ctrl+C` exits cleanly without leaving partial state
- **CLI length safety**: when using `--official`, components are passed to the official CLI in batches of 15 so Windows command-line length limits are not exceeded

---

## Local development

```bash
git clone https://github.com/EzioAman/assistant-ui-downloader.git
cd assistant-ui-downloader
npm install
npm test        # security and installer tests
npm run build   # compile TypeScript to dist/
npm start       # run the interactive CLI
```

---

## Documentation

- [Registry architecture](doc/assistant-ui-registry.md) — How the `r.assistant-ui.com` registry works
- [Security analysis](doc/security-vulnerability-analysis.md) — Threat model and mitigations
- [CLI architecture](doc/cli-architecture.md) — Design comparison with the official assistant-ui CLI
- [User guide](doc/user-guide.md) — Full command reference

### Upstream resources:
- [assistant-ui website](https://www.assistant-ui.com/)
- [assistant-ui documentation](https://www.assistant-ui.com/docs)
- [Registry index (JSON)](https://r.assistant-ui.com/registry.json)

---

## License

[MIT](LICENSE). Components downloaded from the assistant-ui registry are subject to their own upstream license.
