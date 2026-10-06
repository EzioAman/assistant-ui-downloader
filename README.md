# assistant-ui-downloader (`aui`)

> Modern, high-performance interactive CLI controller and batch downloader for [assistant-ui](https://assistant-ui.com) registry components.

Run it directly from GitHub in **one command** with zero setup:

```bash
npx github:<your-username>/assistant-ui-downloader
```

Or once published to npm:
```bash
npx assistant-ui-downloader
```

---

## ✨ Features

- **One-Command Download**: Instant execution via `npx` with no installation required.
- **Interactive Component Selector**: Elegant terminal UI powered by `@clack/prompts` with spinners, category filters, and checkboxes.
- **Pre-select All 163 Items by Default**: Ready to download the entire assistant-ui component suite in one click or customize selections.
- **Categorized Groups**: Filter by *Core Threads*, *Reasoning & Thinking*, *Streaming Indicators*, *Message Architecture*, *Code & Markdown*, *Tools & MCP*, and *UI Elements*.
- **Hybrid Engine**:
  - **Direct Fast REST Downloader**: Directly pulls `.tsx`/`.ts` files from `https://r.assistant-ui.com/` with a concurrent worker pool (6x parallel downloads) and atomic writes.
  - **Official assistant-ui Delegation**: Delegates to `npx assistant-ui add` with automatic batching (15 items/chunk) to prevent Windows command line length overflow (`E2BIG`).
- **Security Hardened**: Protected against Directory Traversal attacks, command/argument injection, and handles `Ctrl+C` cleanly.
- **Scriptable CLI**: Rich commands (`add --all`, `list`, `search`, `info`, `--dry-run`).

---

## 🚀 One-Command Usage

### 1. Interactive Mode (Default)
```bash
# Direct from GitHub:
npx github:<your-username>/assistant-ui-downloader

# Or from npm:
npx assistant-ui-downloader
```

### 2. Download All 163 Components (Scriptable)
```bash
npx github:<your-username>/assistant-ui-downloader add --all
```

### 3. Download by Category
```bash
# Available categories: core, messages, reasoning, streaming, tools_mcp, code_markdown, elements_ui
npx github:<your-username>/assistant-ui-downloader add --category reasoning
npx github:<your-username>/assistant-ui-downloader add --category core
```

### 4. Search and Inspect Components
```bash
npx github:<your-username>/assistant-ui-downloader search reasoning
npx github:<your-username>/assistant-ui-downloader info computer-use
```

---

## 🛠️ Local Development & Contributing

```bash
# Clone the repo
git clone https://github.com/<your-username>/assistant-ui-downloader.git
cd assistant-ui-downloader

# Install dependencies
npm install

# Run test suite
npm test

# Build production bundle
npm run build

# Start interactive CLI
npm start
```

---

## 🧪 Tests

```bash
npm test
```
Includes security tests covering:
- Command injection & argument injection sanitization
- Directory traversal (Zip Slip) protection
- Trusted registry URL validation
- Windows CLI argument chunking resilience
- Non-destructive dry-run verification
- Non-overwriting file preservation verification

---

## 📚 Documentation

- [Registry Architecture](doc/assistant-ui-registry.md)
- [Security & Exploit Analysis](doc/security-vulnerability-analysis.md)
- [CLI Architecture Comparison](doc/cli-architecture.md)
- [User Guide & Command Reference](doc/user-guide.md)

---

## License

MIT
