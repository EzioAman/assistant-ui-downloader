import { InstallEngine } from "./installer.js";
export declare function runInteractiveCli(initialOptions?: {
    cwd?: string;
    targetPath?: string;
    engine?: InstallEngine;
    yes?: boolean;
    overwrite?: boolean;
    dryRun?: boolean;
}): Promise<void>;
