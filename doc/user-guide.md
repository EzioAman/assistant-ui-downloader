# User Guide: assistant-ui Component Controller

## 1. Quick Start

### Run Interactively
To start the interactive controller with Clack prompts:
```bash
npm start
# or using bin script directly:
node bin/aui-controller.js
```

### Install All 163 Components in One Step
```bash
node bin/aui-controller.js add --all
```

### Install Specific Categories
```bash
# Available categories: core, messages, reasoning, streaming, tools_mcp, code_markdown, elements_ui
node bin/aui-controller.js add --category reasoning
node bin/aui-controller.js add --category core
```

### Search Registry
```bash
node bin/aui-controller.js search reasoning
node bin/aui-controller.js search mcp
```

### Inspect Component Details & Dependencies
```bash
node bin/aui-controller.js info thread
node bin/aui-controller.js info elements-composer
```

### List All Components
```bash
node bin/aui-controller.js list
```

## 2. CLI Options Reference

| Option | Description |
|---|---|
| `-c, --cwd <path>` | Working directory to download components into (defaults to current dir) |
| `-p, --path <path>` | Custom target directory for component files |
| `-o, --overwrite` | Overwrite existing files if they already exist |
| `-y, --yes` | Skip confirmation prompts (ideal for CI/automation) |
| `--direct` | Use direct high-speed REST downloader engine (default) |
| `--official` | Delegate to official `npx assistant-ui add` in safe batches |
| `--dry-run` | Preview files and dependencies without writing to disk |
| `--all` | Select all 163 components from the registry |
| `--category <cat>` | Select all components matching a specific category |

## 3. Global Symlink / NPX Usage

To run `aui-controller` anywhere on your machine:
```bash
# Link locally:
npm link

# Now you can run it from any project directory:
aui-controller
# or shorthand:
aui
```
