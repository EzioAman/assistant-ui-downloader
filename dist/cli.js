import { Command } from "commander";
import pc from "picocolors";
import path from "node:path";
import { fetchRegistry, CATEGORIES, fetchComponentDetails } from "./registry.js";
import { installComponents } from "./installer.js";
import { runInteractiveCli } from "./prompts.js";
// Clean signal handling
process.on("SIGINT", () => {
    console.log("\n" + pc.yellow("Interrupted by user. Exiting cleanly."));
    process.exit(130);
});
export const program = new Command();
program
    .name("aui-controller")
    .description("High-performance interactive CLI controller and batch installer for assistant-ui registry components")
    .version("1.0.0");
// Default action: Launch interactive UI when run without subcommands
program
    .option("-c, --cwd <cwd>", "working directory", process.cwd())
    .option("-p, --path <path>", "custom path for components")
    .option("-o, --overwrite", "overwrite existing files", false)
    .option("-y, --yes", "skip interactive confirmation", false)
    .option("--direct", "use direct REST registry downloader engine", false)
    .option("--official", "use official assistant-ui CLI delegation engine", false)
    .option("--dry-run", "simulate download without writing files", false)
    .action(async (opts) => {
    // If no command is given, run interactive Clack controller
    const engine = opts.official ? "official" : "direct";
    await runInteractiveCli({
        cwd: opts.cwd,
        targetPath: opts.path,
        overwrite: opts.overwrite,
        yes: opts.yes,
        engine: opts.official ? "official" : opts.direct ? "direct" : undefined,
        dryRun: opts.dryRun,
    });
});
// 'add' command for scriptable, non-interactive or batch additions
program
    .command("add")
    .description("Add components from the assistant-ui registry")
    .argument("[components...]", "names of the components to install")
    .option("--all", "install all 163 registry components", false)
    .option("--category <category>", "install all components matching a category (core, messages, reasoning, streaming, tools_mcp, code_markdown, elements_ui)")
    .option("-c, --cwd <cwd>", "working directory", process.cwd())
    .option("-p, --path <path>", "custom path for components")
    .option("-o, --overwrite", "overwrite existing files", false)
    .option("-y, --yes", "skip confirmation prompts", true)
    .option("--direct", "use direct REST registry downloader engine (default)", true)
    .option("--official", "delegate to official assistant-ui CLI", false)
    .option("--dry-run", "preview changes without writing files", false)
    .action(async (components, opts) => {
    const cwd = path.resolve(opts.cwd || process.cwd());
    const registry = await fetchRegistry();
    let targets = [];
    if (opts.all) {
        targets = registry.items.map((i) => i.name);
        console.log(pc.cyan(`★ Selected all ${targets.length} components from assistant-ui registry.`));
    }
    else if (opts.category) {
        const catKey = opts.category;
        targets = registry.items.filter((i) => i.category === catKey).map((i) => i.name);
        if (targets.length === 0) {
            console.error(pc.red(`✗ No components found for category "${opts.category}".`));
            console.log(pc.yellow(`Available categories: ${CATEGORIES.map((c) => c.key).join(", ")}`));
            process.exit(1);
        }
        console.log(pc.cyan(`📁 Selected ${targets.length} components from category "${opts.category}".`));
    }
    else if (components && components.length > 0) {
        targets = components;
    }
    else {
        // No components specified and no --all/--category: launch interactive mode
        await runInteractiveCli({
            cwd: opts.cwd,
            targetPath: opts.path,
            overwrite: opts.overwrite,
            yes: opts.yes,
            engine: opts.official ? "official" : "direct",
            dryRun: opts.dryRun,
        });
        return;
    }
    const engine = opts.official ? "official" : "direct";
    console.log(pc.blue(`→ Starting installation via [${engine.toUpperCase()}] engine for ${targets.length} components...`));
    const result = await installComponents(targets, {
        engine,
        cwd,
        targetPath: opts.path,
        yes: opts.yes,
        overwrite: opts.overwrite,
        dryRun: opts.dryRun,
        onProgress: (msg, cur, tot) => {
            if (tot > 0) {
                process.stdout.write(`\r${pc.dim(`[${cur}/${tot}]`)} ${msg.padEnd(60)}`);
            }
        },
    });
    console.log("\n");
    if (result.success || result.componentsAdded.length > 0) {
        console.log(pc.green(`✓ Successfully added ${result.componentsAdded.length} component(s)!`));
        if (result.filesCreated.length > 0) {
            console.log(pc.green(`Files created: ${result.filesCreated.length}`));
        }
        if (result.filesPreserved.length > 0) {
            console.log(pc.dim(`Files verified & preserved on disk: ${result.filesPreserved.length} (overwrite set to false)`));
        }
        console.log(pc.cyan(`Total component files on disk: ${result.filesCreated.length + result.filesPreserved.length}`));
        if (result.dependencies.length > 0) {
            console.log("\n" + pc.bold("Dependencies to install:"));
            console.log(pc.cyan(`npm install ${result.dependencies.join(" ")}`));
        }
    }
    else {
        console.error(pc.red("✗ Failed to add components."));
        result.errors.forEach((e) => console.error(pc.red(`  - ${e.component}: ${e.error}`)));
        process.exit(1);
    }
});
// 'list' command
program
    .command("list")
    .description("List all available components in the assistant-ui registry")
    .option("--category <category>", "filter by category")
    .option("--json", "output in JSON format", false)
    .action(async (opts) => {
    const registry = await fetchRegistry();
    let items = registry.items;
    if (opts.category) {
        items = items.filter((i) => i.category === opts.category);
    }
    if (opts.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
    }
    console.log(pc.bold(pc.cyan(`\nassistant-ui Registry Components (${items.length} total)\n`)));
    // Group by category
    for (const cat of CATEGORIES) {
        const catItems = items.filter((i) => i.category === cat.key);
        if (catItems.length === 0)
            continue;
        console.log(pc.bold(pc.yellow(`📁 ${cat.label} (${catItems.length})`)));
        console.log(pc.dim(`   ${cat.description}`));
        for (const item of catItems) {
            const title = item.title || item.name;
            const desc = item.description ? pc.dim(` - ${item.description}`) : "";
            console.log(`   ${pc.green("•")} ${pc.bold(item.name.padEnd(30))} ${desc}`);
        }
        console.log("");
    }
});
// 'search' command
program
    .command("search <query>")
    .description("Search registry components by keyword")
    .action(async (query) => {
    const registry = await fetchRegistry();
    const q = query.toLowerCase();
    const matches = registry.items.filter((item) => item.name.toLowerCase().includes(q) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)));
    console.log(pc.bold(pc.cyan(`\nSearch results for "${query}" (${matches.length} matches):\n`)));
    if (matches.length === 0) {
        console.log(pc.yellow("No components matched your search."));
        return;
    }
    for (const item of matches) {
        console.log(`  ${pc.green("•")} ${pc.bold(item.name.padEnd(28))} ${pc.dim(`[${item.category}]`)} ${item.description || ""}`);
    }
    console.log("");
});
// 'info' command
program
    .command("info <component>")
    .description("Display full specification and dependencies of a component")
    .action(async (componentName) => {
    try {
        const details = await fetchComponentDetails(componentName);
        console.log(pc.bold(pc.cyan(`\nComponent: ${details.name}`)));
        console.log(`Title: ${details.title}`);
        console.log(`Category: ${details.category}`);
        if (details.description)
            console.log(`Description: ${details.description}`);
        if (details.dependencies && details.dependencies.length > 0) {
            console.log(`Dependencies: ${pc.yellow(details.dependencies.join(", "))}`);
        }
        if (details.registryDependencies && details.registryDependencies.length > 0) {
            console.log(`Registry Dependencies: ${pc.magenta(details.registryDependencies.join(", "))}`);
        }
        if (details.files && details.files.length > 0) {
            console.log("Files:");
            details.files.forEach((f) => console.log(`  - ${pc.green(f.path)} (${f.type})`));
        }
        console.log("");
    }
    catch (err) {
        console.error(pc.red(`✗ Could not load component "${componentName}": ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
});
// Export runner
export async function runCli() {
    await program.parseAsync(process.argv);
}
import { fileURLToPath } from "node:url";
// Auto-run when executed as main module
function isMainModule() {
    if (!process.argv[1])
        return false;
    try {
        const currentPath = fileURLToPath(import.meta.url).toLowerCase();
        const executedPath = path.resolve(process.argv[1]).toLowerCase();
        return currentPath === executedPath;
    }
    catch {
        return false;
    }
}
if (isMainModule()) {
    runCli().catch((err) => {
        console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map