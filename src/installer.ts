import fs from "node:fs";
import path from "node:path";
import spawn from "cross-spawn";
import pc from "picocolors";
import { isSafeFilePath, sanitizeComponentNames } from "./security.js";
import { fetchComponentDetails, RegistryItem } from "./registry.js";

export type InstallEngine = "official" | "direct";

export interface InstallOptions {
  engine: InstallEngine;
  cwd?: string;
  targetPath?: string;
  yes?: boolean;
  overwrite?: boolean;
  dryRun?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  onProgress?: (message: string, current: number, total: number) => void;
}

export interface InstallResult {
  success: boolean;
  componentsAdded: string[];
  filesCreated: string[];
  filesPreserved: string[];
  dependencies: string[];
  errors: Array<{ component: string; error: string }>;
}

export function detectPackageManager(cwd: string = process.cwd()): "npm" | "pnpm" | "yarn" | "bun" {
  try {
    if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(cwd, "bun.lockb")) || fs.existsSync(path.join(cwd, "bun.lock"))) return "bun";
    if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
    if (fs.existsSync(path.join(cwd, "package-lock.json"))) return "npm";
  } catch {
    // fallback
  }
  return "npm";
}

/**
 * Splits an array into chunks of specified size to prevent Windows command line length overflow.
 */
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Executes a command safely using cross-spawn with promise wrapping.
 */
function runCommand(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(code ?? 0);
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Installs components using the official assistant-ui CLI in safe chunks.
 */
export async function installWithOfficialCli(
  components: string[],
  options: InstallOptions,
): Promise<InstallResult> {
  const cwd = path.resolve(options.cwd || process.cwd());
  const sanitized = sanitizeComponentNames(components);

  if (sanitized.length === 0) {
    return {
      success: true,
      componentsAdded: [],
      filesCreated: [],
      filesPreserved: [],
      dependencies: [],
      errors: [],
    };
  }

  const result: InstallResult = {
    success: true,
    componentsAdded: [],
    filesCreated: [],
    filesPreserved: [],
    dependencies: [],
    errors: [],
  };

  // Safe chunk size: 15 components per batch to stay far below Windows command limits
  const CHUNK_SIZE = 15;
  const batches = chunkArray(sanitized, CHUNK_SIZE);
  let processed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const progressMsg = `Installing batch ${batchIndex + 1}/${batches.length} (${batch.length} components)...`;
    options.onProgress?.(progressMsg, processed, sanitized.length);

    const args = ["assistant-ui@latest", "add", ...batch];
    if (options.yes ?? true) args.push("--yes");
    if (options.overwrite) args.push("--overwrite");
    if (options.targetPath) args.push("--path", options.targetPath);
    if (options.cwd) args.push("--cwd", cwd);

    if (options.dryRun) {
      console.log(pc.cyan(`[DRY-RUN] npx ${args.join(" ")}`));
      result.componentsAdded.push(...batch);
      processed += batch.length;
      continue;
    }

    try {
      const exitCode = await runCommand("npx", args, cwd);
      if (exitCode === 0) {
        result.componentsAdded.push(...batch);
      } else {
        result.success = false;
        result.errors.push({
          component: batch.join(", "),
          error: `Process exited with code ${exitCode}`,
        });
      }
    } catch (err) {
      result.success = false;
      result.errors.push({
        component: batch.join(", "),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    processed += batch.length;
  }

  return result;
}

/**
 * Concurrency helper for parallel tasks.
 */
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T) => Promise<R>,
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<any>[] = [];

  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

/**
 * Downloads and writes component files directly from the registry REST API.
 * High-speed, atomic, and works without requiring shadcn or initialized project.
 */
export async function installWithDirectDownload(
  components: string[],
  options: InstallOptions,
): Promise<InstallResult> {
  const cwd = path.resolve(options.cwd || process.cwd());
  const sanitized = sanitizeComponentNames(components);

  const result: InstallResult = {
    success: true,
    componentsAdded: [],
    filesCreated: [],
    filesPreserved: [],
    dependencies: [],
    errors: [],
  };

  const allDependencies = new Set<string>();
  let completed = 0;

  await asyncPool(6, sanitized, async (name) => {
    try {
      options.onProgress?.(`Fetching ${name}...`, completed, sanitized.length);
      const details = await fetchComponentDetails(name);

      if (details.dependencies) {
        for (const dep of details.dependencies) allDependencies.add(dep);
      }

      if (!details.files || details.files.length === 0) {
        result.errors.push({
          component: name,
          error: "No files found in component specification",
        });
        return;
      }

      for (const file of details.files) {
        if (!file.content) continue;

        // Determine destination file path
        let relativeFilePath = file.path;
        if (options.targetPath) {
          relativeFilePath = path.join(options.targetPath, path.basename(file.path));
        }

        // Security check: Path traversal prevention
        if (!isSafeFilePath(relativeFilePath, cwd)) {
          throw new Error(`Insecure file path detected: ${relativeFilePath}`);
        }

        const absoluteTarget = path.resolve(cwd, relativeFilePath);
        const targetDir = path.dirname(absoluteTarget);

        if (!options.dryRun) {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          if (fs.existsSync(absoluteTarget) && !options.overwrite) {
            // Record that this existing file was preserved
            result.filesPreserved.push(relativeFilePath);
            continue;
          }

          fs.writeFileSync(absoluteTarget, file.content, "utf8");
        }

        result.filesCreated.push(relativeFilePath);
      }

      result.componentsAdded.push(name);
    } catch (err) {
      result.errors.push({
        component: name,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      completed++;
      options.onProgress?.(`Processed ${name}`, completed, sanitized.length);
    }
  });

  result.dependencies = Array.from(allDependencies);
  result.success = result.errors.length === 0;

  return result;
}

/**
 * Unified installer dispatching to the chosen engine.
 */
export async function installComponents(
  components: string[],
  options: InstallOptions,
): Promise<InstallResult> {
  if (options.engine === "official") {
    return installWithOfficialCli(components, options);
  } else {
    return installWithDirectDownload(components, options);
  }
}
