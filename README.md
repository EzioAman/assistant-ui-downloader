# assistant-ui-downloader

> Interactive CLI controller and batch downloader for all [assistant-ui](https://assistant-ui.com) registry components. Download 160+ production-ready AI chat UI elements in one command.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ⚡ One Command — Zero Setup

```bash
npx github:EzioAman/assistant-ui-downloader
```

That's it. Run this in any project directory and the interactive picker launches — all 163 components pre-selected by default.

### Scriptable (non-interactive)

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

## ✨ What You Get

163 items from the official [assistant-ui registry](https://r.assistant-ui.com/registry.json) (161 modular component packages generating 187+ `.tsx`/`.ts` files, plus 2 style specifications), organized into 7 categories:

| Category | Count | Examples (Official Registry Slugs) |
|---|---|---|
| **Core & Chat Threads** | 4 | `thread`, `thread-list`, `utils`, `chat/b/ai-sdk-quick-start/json` |
| **Message Architecture** | 11 | `elements-message-pair`, `elements-message-branches`, `elements-suggestions`, `quote` |
| **Reasoning & Thinking** | 5 | `elements-thinking-indicator`, `elements-reasoning-panel`, `reasoning`, `elements-reasoning-effort` |
| **Streaming & State** | 5 | `elements-streaming-text`, `elements-loading-state`, `elements-typing-indicator`, `heat-graph` |
| **Code & Markdown** | 9 | `elements-code-diff`, `markdown-text`, `syntax-highlighter`, `shiki-highlighter`, `mermaid-diagram` |
| **Tools, MCP & Voice** | 19 | `tool-fallback`, `mcp-config`, `voice`, `attachment`, `task-card`, `elements-tool-call` |
| **UI Elements & Primitives** | 110 | `elements-surfaces`, `elements-computer-use`, `elements-data-table`, `model-selector`, `logos` |

Every component is a `.tsx` / `.ts` file written directly into your project under `components/assistant-ui/` — fully yours to customize.

---

## 🎯 How It Works

### Interactive Mode (default)

Run without arguments to get the full Clack-powered terminal UI:

```bash
npx github:EzioAman/assistant-ui-downloader
```

You'll see:
1. **Selection mode** — All components, by category, or fine-grained multi-select
2. **Engine choice** — Direct REST download (fast, recommended) or official `assistant-ui add` delegation
3. **Overwrite prompt** — Safely preserves existing files by default
4. **Progress spinner** — Real-time download progress with component counts
5. **Summary** — Files created, files preserved, and dependency install command

### CLI Commands

```bash
# List all available components grouped by category
npx github:EzioAman/assistant-ui-downloader list

# Search by keyword
npx github:EzioAman/assistant-ui-downloader search mcp

# Inspect a component's dependencies and files
npx github:EzioAman/assistant-ui-downloader info thread

# Dry run — preview without writing files
npx github:EzioAman/assistant-ui-downloader add --all --dry-run
```

### Full Options

| Flag | Description |
|---|---|
| `--all` | Select all 163 components |
| `--category <name>` | Filter: `core`, `messages`, `reasoning`, `streaming`, `tools_mcp`, `code_markdown`, `elements_ui` |
| `-c, --cwd <path>` | Target working directory |
| `-p, --path <path>` | Custom component output path |
| `-o, --overwrite` | Overwrite existing files |
| `-y, --yes` | Skip confirmation prompts |
| `--direct` | Use direct REST downloader (default) |
| `--official` | Delegate to `npx assistant-ui add` in safe batches |
| `--dry-run` | Preview changes without writing |

---

## 🔒 Security

- **Input sanitization** — Component slugs validated against `^[a-zA-Z0-9_\-\/]+$`
- **Path traversal protection** — All file writes verified to stay within project root
- **Registry URL allowlisting** — Only `https://*.assistant-ui.com` endpoints accepted
- **Windows CLI safety** — Components batched in chunks of 15 to prevent argument length overflow
- **Clean signal handling** — `Ctrl+C` exits gracefully without corrupted state

---

## 🛠️ Local Development

```bash
git clone https://github.com/EzioAman/assistant-ui-downloader.git
cd assistant-ui-downloader
npm install
npm test        # 8 security + installer tests
npm run build   # Compile TypeScript
npm start       # Run interactive CLI
```

---

## 📚 Documentation

- [Registry Architecture](doc/assistant-ui-registry.md) — How the `r.assistant-ui.com` registry works
- [Security Analysis](doc/security-vulnerability-analysis.md) — Threat model and mitigations
- [CLI Architecture](doc/cli-architecture.md) — Design comparison with official assistant-ui CLI
- [User Guide](doc/user-guide.md) — Full command reference

---

## License

MIT
