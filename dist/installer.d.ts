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
    errors: Array<{
        component: string;
        error: string;
    }>;
}
export declare function detectPackageManager(cwd?: string): "npm" | "pnpm" | "yarn" | "bun";
/**
 * Splits an array into chunks of specified size to prevent Windows command line length overflow.
 */
export declare function chunkArray<T>(items: T[], chunkSize: number): T[][];
/**
 * Installs components using the official assistant-ui CLI in safe chunks.
 */
export declare function installWithOfficialCli(components: string[], options: InstallOptions): Promise<InstallResult>;
/**
 * Downloads and writes component files directly from the registry REST API.
 * High-speed, atomic, and works without requiring shadcn or initialized project.
 */
export declare function installWithDirectDownload(components: string[], options: InstallOptions): Promise<InstallResult>;
/**
 * Unified installer dispatching to the chosen engine.
 */
export declare function installComponents(components: string[], options: InstallOptions): Promise<InstallResult>;
