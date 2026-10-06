/**
 * Validates a component slug to prevent command injection or malformed input.
 * Allows alphanumeric characters, hyphens, and slashes (for scoped items).
 */
export declare function isValidComponentName(name: string): boolean;
/**
 * Sanitizes an array of component names, filtering out invalid or dangerous tokens.
 */
export declare function sanitizeComponentNames(names: string[]): string[];
/**
 * Validates that a file target path stays strictly inside the destination root.
 * Protects against Directory Traversal (Zip Slip / Path Traversal attacks).
 */
export declare function isSafeFilePath(targetPath: string, rootDir: string): boolean;
/**
 * Sanitizes URLs to ensure they only connect to trusted registry hostnames.
 */
export declare function isAllowedRegistryUrl(urlStr: string): boolean;
