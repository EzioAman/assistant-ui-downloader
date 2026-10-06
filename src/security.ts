import path from "node:path";

/**
 * Validates a component slug to prevent command injection or malformed input.
 * Allows alphanumeric characters, hyphens, and slashes (for scoped items).
 */
export function isValidComponentName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  // Strict regex: alphanumeric, dash, underscore, forward slash
  return /^[a-zA-Z0-9_\-\/]+$/.test(name) && !name.includes("..");
}

/**
 * Sanitizes an array of component names, filtering out invalid or dangerous tokens.
 */
export function sanitizeComponentNames(names: string[]): string[] {
  return names
    .map((n) => n.trim())
    .filter((n) => isValidComponentName(n));
}

/**
 * Validates that a file target path stays strictly inside the destination root.
 * Protects against Directory Traversal (Zip Slip / Path Traversal attacks).
 */
export function isSafeFilePath(targetPath: string, rootDir: string): boolean {
  const normalizedRoot = path.resolve(rootDir);
  const normalizedTarget = path.resolve(rootDir, targetPath);

  // Must start with the root directory path
  return (
    normalizedTarget === normalizedRoot ||
    normalizedTarget.startsWith(normalizedRoot + path.sep)
  );
}

/**
 * Sanitizes URLs to ensure they only connect to trusted registry hostnames.
 */
export function isAllowedRegistryUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "r.assistant-ui.com" ||
        parsed.hostname.endsWith(".assistant-ui.com"))
    );
  } catch {
    return false;
  }
}
