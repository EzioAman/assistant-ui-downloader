import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const REGISTRY_BASE_URL = "https://r.assistant-ui.com";
export const REGISTRY_INDEX_URL = `${REGISTRY_BASE_URL}/registry.json`;

export interface RegistryFile {
  path: string;
  type: string;
  content?: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  css?: Record<string, unknown>;
  category: CategoryKey;
}

export interface RegistryIndex {
  $schema?: string;
  name: string;
  homepage?: string;
  items: RegistryItem[];
}

export type CategoryKey =
  | "core"
  | "messages"
  | "reasoning"
  | "streaming"
  | "tools_mcp"
  | "code_markdown"
  | "elements_ui";

export interface CategoryDefinition {
  key: CategoryKey;
  label: string;
  description: string;
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    key: "core",
    label: "Core & Chat Threads",
    description: "Main chat thread, thread list, composer, and core utilities",
  },
  {
    key: "messages",
    label: "Message Architecture",
    description: "Message pairs, branches, actions, follow-ups, suggestions",
  },
  {
    key: "reasoning",
    label: "Reasoning & Thinking",
    description: "Reasoning panel, thinking indicator, thought chains, task state",
  },
  {
    key: "streaming",
    label: "Streaming & State Indicators",
    description: "Streaming text, loading state, typing indicator, error states",
  },
  {
    key: "code_markdown",
    label: "Code & Markdown Rendering",
    description: "Markdown renderer, syntax highlighter, shiki, mermaid, diff view",
  },
  {
    key: "tools_mcp",
    label: "Tools, MCP & Voice",
    description: "Tool calling, MCP inspect, voice input/output, attachments",
  },
  {
    key: "elements_ui",
    label: "UI Elements & Primitives",
    description: "Shimmer, surfaces, avatars, tooltips, buttons, layout elements",
  },
];

export function categorizeItem(name: string, description: string = ""): CategoryKey {
  const lower = name.toLowerCase();
  const desc = description.toLowerCase();

  if (
    lower === "utils" ||
    lower === "thread" ||
    lower === "thread-list" ||
    lower === "composer" ||
    lower.startsWith("chat/")
  ) {
    return "core";
  }

  if (
    lower.includes("markdown") ||
    lower.includes("syntax") ||
    lower.includes("shiki") ||
    lower.includes("mermaid") ||
    lower.includes("diff")
  ) {
    return "code_markdown";
  }

  if (
    lower.includes("mcp") ||
    lower.includes("voice") ||
    lower.includes("attachment") ||
    lower.includes("tool") ||
    lower.includes("task")
  ) {
    return "tools_mcp";
  }

  if (
    lower.includes("reasoning") ||
    lower.includes("thinking") ||
    lower.includes("thought")
  ) {
    return "reasoning";
  }

  if (
    lower.includes("streaming") ||
    lower.includes("loading") ||
    lower.includes("typing") ||
    lower.includes("error") ||
    lower.includes("heat")
  ) {
    return "streaming";
  }

  if (
    lower.includes("message") ||
    lower.includes("branch") ||
    lower.includes("suggestion") ||
    lower.includes("follow") ||
    lower.includes("quote")
  ) {
    return "messages";
  }

  return "elements_ui";
}

function getCacheFilePath(): string {
  const cacheDir = path.join(os.tmpdir(), "assistant-ui-controller-cache");
  if (!fs.existsSync(cacheDir)) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
    } catch {
      // fallback to current dir
      return path.resolve(".registry-cache.json");
    }
  }
  return path.join(cacheDir, "registry.json");
}

/**
 * Fetches the assistant-ui registry index with cache fallback.
 */
export async function fetchRegistry(options?: {
  forceRefresh?: boolean;
}): Promise<RegistryIndex> {
  const cacheFile = getCacheFilePath();

  // Try cache first if not forcing refresh and cache is fresh (< 2 hours)
  if (!options?.forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const stats = fs.statSync(cacheFile);
      const isRecent = Date.now() - stats.mtimeMs < 2 * 60 * 60 * 1000;
      if (isRecent) {
        const cachedRaw = fs.readFileSync(cacheFile, "utf8");
        const parsed = JSON.parse(cachedRaw) as RegistryIndex;
        if (parsed.items && parsed.items.length > 0) {
          return decorateRegistryWithCategories(parsed);
        }
      }
    } catch {
      // ignore cache reading failure
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(REGISTRY_INDEX_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "assistant-ui-controller/1.0.0",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as RegistryIndex;
    const decorated = decorateRegistryWithCategories(data);

    // Save to cache in background
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(decorated, null, 2), "utf8");
    } catch {
      // ignore cache write errors
    }

    return decorated;
  } catch (error) {
    // If fetch failed, fallback to any existing cache
    if (fs.existsSync(cacheFile)) {
      try {
        const cachedRaw = fs.readFileSync(cacheFile, "utf8");
        const parsed = JSON.parse(cachedRaw) as RegistryIndex;
        if (parsed.items && parsed.items.length > 0) {
          return decorateRegistryWithCategories(parsed);
        }
      } catch {
        // continue
      }
    }
    throw new Error(
      `Failed to fetch assistant-ui registry from ${REGISTRY_INDEX_URL}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function decorateRegistryWithCategories(registry: RegistryIndex): RegistryIndex {
  return {
    ...registry,
    items: registry.items.map((item) => ({
      ...item,
      category: categorizeItem(item.name, item.description || ""),
    })),
  };
}

/**
 * Fetches the full JSON payload for an individual registry component (including files and contents).
 */
export async function fetchComponentDetails(name: string): Promise<RegistryItem> {
  const url = `${REGISTRY_BASE_URL}/${encodeURIComponent(name)}.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": "assistant-ui-controller/1.0.0",
      Accept: "application/json",
    },
  });
  clearTimeout(timeout);

  if (!res.ok) {
    // Some components might reside under /base/
    const fallbackUrl = `${REGISTRY_BASE_URL}/base/${encodeURIComponent(name)}.json`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { "User-Agent": "assistant-ui-controller/1.0.0" },
    });
    if (!fallbackRes.ok) {
      throw new Error(`Failed to fetch component "${name}": HTTP ${res.status}`);
    }
    const data = (await fallbackRes.json()) as RegistryItem;
    return { ...data, category: categorizeItem(data.name, data.description) };
  }

  const data = (await res.json()) as RegistryItem;
  return { ...data, category: categorizeItem(data.name, data.description) };
}
