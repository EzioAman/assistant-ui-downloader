# assistant-ui Registry & Architecture Documentation

## 1. Official Registry Architecture

The public component registry for **assistant-ui** is hosted at:
`https://r.assistant-ui.com/registry.json`

It follows the **shadcn/ui registry specification** (`https://ui.shadcn.com/schema/registry.json`).

### Key Schema Properties:
- `name`: Identifier of the registry (e.g., `assistant-ui`).
- `items`: Array of 163 components and libraries.
  - `name`: Component slug (e.g., `thread`, `composer`, `elements-surfaces`, `markdown-text`).
  - `type`: `registry:component`, `registry:lib`, `registry:hook`, `registry:ui`, `registry:page`, `registry:style`.
  - `title`: Human-readable name.
  - `description`: Brief documentation of the component.
  - `files`: File paths and target locations.
  - `dependencies`: npm dependencies (e.g. `@assistant-ui/react`, `lucide-react`, `streamdown`, etc.).
  - `devDependencies`: Development dependencies.
  - `registryDependencies`: Dependent registry components (e.g. `https://r.assistant-ui.com/elements-surfaces.json`).
  - `css`: Associated stylesheet imports or tailwind extensions.

## 2. Style Flavors and Endpoints

assistant-ui supports multiple style flavors:
- **Base UI (Default & Recommended)**: `https://r.assistant-ui.com/base/{component}.json`
- **Radix UI**: `https://r.assistant-ui.com/{component}.json`
- **Tailwind / Styles**: `https://r.assistant-ui.com/styles/{style}/{component}.json`
- **React Native**: `https://r.assistant-ui.com/native/{component}.json`

In `components.json`, projects can configure:
```json
{
  "registries": {
    "@assistant-ui": "https://r.assistant-ui.com/styles/{style}/{name}.json"
  }
}
```

## 3. How `npx assistant-ui add` Works

The official CLI (`assistant-ui@0.0.121`) implements `add` using:
1. **Commander**: Argument parsing for component names, `--cwd`, `--yes`, `--overwrite`, `--path`, and package manager flags (`--use-npm`, `--use-pnpm`, `--use-yarn`, `--use-bun`).
2. **Platform & Style Detection**: Inspects `package.json` for React Native vs Web, and reads `components.json` for style settings.
3. **Plan Construction (`createAddComponentsPlan`)**: Validates component names against `^[a-zA-Z0-9-/]+$`, maps names to full registry URLs, and formats the execution command:
   ```bash
   npx shadcn@latest add <registry-urls...> [--yes] [--overwrite] [--path <path>]
   ```
4. **Execution**: Uses `cross-spawn` (`runSpawn`) to execute the package manager's `dlx` command.

## 4. Total Registry Breakdown (163 Items)

- `registry:lib`: 1 (e.g. `utils`)
- `registry:component`: 146
  - Chat Threads & Composers: `thread`, `thread-list`, `composer`
  - Elements: 113 granular building blocks (`elements-surfaces`, `elements-loading-state`, `elements-thinking-indicator`, `elements-reasoning-panel`, `elements-streaming-text`, `elements-message-pair`, etc.)
  - Media & Tool Fallbacks: `attachment`, `voice`, `mcp`, `syntax-highlighter`, `mermaid`, `diff`
- `registry:ui`: 8
- `registry:page`: 3
- `registry:hook`: 2
- `registry:style`: 2
- `registry:item`: 1
