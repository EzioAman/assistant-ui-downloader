export declare const REGISTRY_BASE_URL = "https://r.assistant-ui.com";
export declare const REGISTRY_INDEX_URL = "https://r.assistant-ui.com/registry.json";
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
export type CategoryKey = "core" | "messages" | "reasoning" | "streaming" | "tools_mcp" | "code_markdown" | "elements_ui";
export interface CategoryDefinition {
    key: CategoryKey;
    label: string;
    description: string;
}
export declare const CATEGORIES: CategoryDefinition[];
export declare function categorizeItem(name: string, description?: string): CategoryKey;
/**
 * Fetches the assistant-ui registry index with cache fallback.
 */
export declare function fetchRegistry(options?: {
    forceRefresh?: boolean;
}): Promise<RegistryIndex>;
/**
 * Fetches the full JSON payload for an individual registry component (including files and contents).
 */
export declare function fetchComponentDetails(name: string): Promise<RegistryItem>;
