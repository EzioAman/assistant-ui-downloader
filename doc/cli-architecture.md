# Architecture: assistant-ui Component Controller

## 1. Overview & Comparison

The official `assistant-ui` CLI package (`assistant-ui@0.0.121`) provides commands like `init`, `create`, `add`, and `mcp`. However, its `add` command has specific limitations when working with the public registry:
1. **No Interactive Component Selection**: Running `npx assistant-ui add` requires explicit component argument slugs. It does not provide an interactive multiselect picker or category browser.
2. **Buffer Overflow on Large Batches**: Piping all 163 registry items via `xargs npx assistant-ui add` easily crashes on Windows due to command line string length limits (E2BIG / 8,191 chars in CMD, 32k in Win32).
3. **Hard Dependency on shadcn & config**: If `components.json` is not present, `npx assistant-ui add` prompts for Base UI / Radix selection and may halt non-interactive workflows.

### Why `aui-controller` Delivers "That Level of Package":
- **Same Core Stack**: Built using `@clack/prompts` 1.8.1 and `commander` 15.0.0, matching the exact look-and-feel, visual aesthetics, and prompt flow of official assistant-ui and Astro/Vite CLI tooling.
- **Smart Categorization**: Groups all 163 registry components into logical modules (Core Threads, Messages, Reasoning & Thinking, Streaming, Code & Markdown, Tools & MCP, and UI Primitives).
- **Default "Select All"**: By default, all 163 components are selected, matching the user's intent to add all components while giving immediate visual control.
- **Hybrid Engine**:
  - **Direct Fast REST Downloader**: Fetches component `.tsx`/`.ts` definitions directly from `https://r.assistant-ui.com/{name}.json` and writes them into `./components/assistant-ui/` with concurrency pool and atomic writes.
  - **Official assistant-ui CLI Delegation**: Batches component additions into safe 15-item chunks, preventing Windows CLI length overflow.
- **Security Hardened**: Path traversal guards (`Zip Slip`), regex input sanitation against shell injection, and clean SIGINT restoration.

## 2. Component Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │         https://r.assistant-ui.com/registry.json       │
  └───────────────────────────┬────────────────────────────┘
                              │
                    [ Registry Parser ]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
     [ Interactive Mode ]            [ Scriptable Mode ]
    - Clack Prompts UI             - aui-controller add --all
    - All 163 Pre-selected         - aui-controller add <names>
    - Category / Granular Filter   - aui-controller list / search
               └──────────────┬──────────────┘
                              ▼
                     [ Engine Selector ]
               ┌──────────────┴──────────────┐
               ▼                             ▼
      [ DIRECT ENGINE ]             [ OFFICIAL ENGINE ]
    - 6x Concurrency Pool         - Chunked Batches (15 items)
    - Path Traversal Guard        - cross-spawn npx assistant-ui
    - Atomic File Writes          - shadcn style resolution
               └──────────────┬──────────────┘
                              ▼
        Destination Codebase (./components/assistant-ui/)
```
