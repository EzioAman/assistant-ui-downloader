import * as p from "@clack/prompts";
import pc from "picocolors";
import path from "node:path";
import {
  CATEGORIES,
  CategoryKey,
  fetchRegistry,
  RegistryIndex,
  RegistryItem,
} from "./registry.js";
import {
  detectPackageManager,
  installComponents,
  InstallEngine,
  InstallOptions,
  InstallResult,
} from "./installer.js";

export async function runInteractiveCli(initialOptions?: {
  cwd?: string;
  targetPath?: string;
  engine?: InstallEngine;
  yes?: boolean;
  overwrite?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const cwd = path.resolve(initialOptions?.cwd || process.cwd());

  const isTTY = Boolean(process.stdin.isTTY);
  if (!isTTY) {
    p.intro(
      `${pc.bgCyan(pc.black(" ASSISTANT-UI "))} ${pc.bold("Component Controller (Non-Interactive Shell)")}`,
    );
    console.log(pc.yellow("Non-interactive terminal detected. Using default selection (all components)."));
    console.log(pc.dim("Tip: Run in an interactive terminal to use arrow keys and spacebar selection.\n"));

    const reg = await fetchRegistry();
    const allNames = reg.items.map((i) => i.name);
    const result = await installComponents(allNames, {
      engine: initialOptions?.engine || "direct",
      cwd,
      targetPath: initialOptions?.targetPath,
      overwrite: initialOptions?.overwrite ?? false,
      dryRun: initialOptions?.dryRun,
      yes: true,
      onProgress: (msg, cur, tot) => {
        if (tot > 0) process.stdout.write(`\r${pc.dim(`[${cur}/${tot}]`)} ${msg.padEnd(50)}`);
      },
    });

    console.log("\n");
    if (result.success || result.componentsAdded.length > 0) {
      console.log(pc.green(`✓ Successfully installed ${result.componentsAdded.length} components!`));
    }
    return;
  }

  console.clear();
  p.intro(
    `${pc.bgCyan(pc.black(" ASSISTANT-UI "))} ${pc.bold("Component Controller & Downloader")}`,
  );

  const spin = p.spinner();
  spin.start("Connecting to assistant-ui registry...");

  let registry: RegistryIndex;
  try {
    registry = await fetchRegistry();
    spin.stop(
      `${pc.green("✓")} Loaded registry with ${pc.bold(registry.items.length.toString())} components!`,
    );
  } catch (err) {
    spin.stop(pc.red("✗ Failed to load registry"));
    p.cancel(
      `Registry error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // 1. Choose selection mode
  const selectionMode = await p.select({
    message: "Select how you would like to pick components:",
    options: [
      {
        value: "all",
        label: `★ All Components (${registry.items.length} items)`,
        hint: "Default: select and download the entire assistant-ui ecosystem",
      },
      {
        value: "categories",
        label: "📁 Filter by Category",
        hint: "Toggle groups: Core, Reasoning, Streaming, Messages, MCP, etc.",
      },
      {
        value: "custom",
        label: "🔍 Multi-select",
        hint: "Pick and choose individual components from full list",
      },
    ],
    initialValue: "all",
  });

  if (p.isCancel(selectionMode)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let selectedComponentNames: string[] = [];

  if (selectionMode === "all") {
    selectedComponentNames = registry.items.map((i) => i.name);
  } else if (selectionMode === "categories") {
    // Group counts
    const categoryCounts: Record<CategoryKey, number> = {
      core: 0,
      messages: 0,
      reasoning: 0,
      streaming: 0,
      tools_mcp: 0,
      code_markdown: 0,
      elements_ui: 0,
    };
    registry.items.forEach((item) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    const categoryOptions = CATEGORIES.map((cat) => ({
      value: cat.key,
      label: `${cat.label} (${categoryCounts[cat.key]} items)`,
      hint: cat.description,
    }));

    // Pre-select all categories by default!
    const selectedCats = await p.multiselect({
      message: "Choose categories to include (all pre-selected):",
      options: categoryOptions,
      initialValues: CATEGORIES.map((c) => c.key),
      required: true,
    });

    if (p.isCancel(selectedCats)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    const catSet = new Set(selectedCats as CategoryKey[]);
    selectedComponentNames = registry.items
      .filter((i) => catSet.has(i.category))
      .map((i) => i.name);
  } else if (selectionMode === "custom") {
    const itemOptions = registry.items.map((item) => ({
      value: item.name,
      label: item.title || item.name,
      hint: `${item.name} • [${item.category}]`,
    }));

    // Pre-select all items by default!
    const picked = await p.multiselect({
      message: "Select components to download (Space to toggle, Enter to confirm):",
      options: itemOptions,
      initialValues: registry.items.map((i) => i.name),
      required: true,
    });

    if (p.isCancel(picked)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    selectedComponentNames = picked as string[];
  }

  if (selectedComponentNames.length === 0) {
    p.cancel("No components selected. Exiting.");
    process.exit(0);
  }

  // 2. Select Installation Engine
  let chosenEngine: InstallEngine = initialOptions?.engine || "direct";
  if (!initialOptions?.engine) {
    const engineChoice = await p.select({
      message: "Choose installation mechanism:",
      options: [
        {
          value: "direct",
          label: "⚡ Direct Registry Download (Recommended)",
          hint: "Instant REST fetch and atomic file generation in ./components/assistant-ui/",
        },
        {
          value: "official",
          label: "📦 Official assistant-ui CLI",
          hint: "Delegates to 'npx assistant-ui add' in safe chunks (requires shadcn/Base UI)",
        },
      ],
      initialValue: "direct",
    });

    if (p.isCancel(engineChoice)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    chosenEngine = engineChoice as InstallEngine;
  }

  // 3. Confirm overwrite if not passed
  let overwrite = initialOptions?.overwrite ?? false;
  if (initialOptions?.overwrite === undefined) {
    const confirmOverwrite = await p.confirm({
      message: "Overwrite existing component files if they already exist?",
      initialValue: false,
    });

    if (p.isCancel(confirmOverwrite)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    overwrite = confirmOverwrite as boolean;
  }

  p.note(
    [
      `Selected items: ${pc.bold(selectedComponentNames.length.toString())} components`,
      `Target directory: ${pc.cyan(cwd)}`,
      `Engine: ${pc.green(chosenEngine === "direct" ? "Direct REST Downloader" : "Official assistant-ui CLI")}`,
      `Overwrite existing: ${overwrite ? pc.yellow("Yes") : "No"}`,
    ].join("\n"),
    "Installation Plan Summary",
  );

  const confirmRun = await p.confirm({
    message: "Ready to proceed with download and setup?",
    initialValue: true,
  });

  if (p.isCancel(confirmRun) || !confirmRun) {
    p.cancel("Installation aborted.");
    process.exit(0);
  }

  const s = p.spinner();
  s.start(`Starting installation of ${selectedComponentNames.length} components...`);

  let currentMsg = "Downloading...";
  const installOptions: InstallOptions = {
    engine: chosenEngine,
    cwd,
    targetPath: initialOptions?.targetPath,
    overwrite,
    dryRun: initialOptions?.dryRun,
    yes: true,
    onProgress: (msg, cur, tot) => {
      currentMsg = `[${cur}/${tot}] ${msg}`;
      s.message(currentMsg);
    },
  };

  let result: InstallResult;
  try {
    result = await installComponents(selectedComponentNames, installOptions);
  } catch (err) {
    s.stop(pc.red("✗ Error during installation"));
    p.cancel(
      `Execution failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  if (result.success || result.componentsAdded.length > 0) {
    s.stop(
      `${pc.green("✓")} Successfully processed ${result.componentsAdded.length} component(s)!`,
    );

    const pm = detectPackageManager(cwd);
    const depList = result.dependencies.length > 0
      ? `\n\n${pc.bold("Dependencies used by these components:")}\n${pc.cyan(
        pm === "npm"
          ? `npm install ${result.dependencies.join(" ")}`
          : pm === "pnpm"
            ? `pnpm add ${result.dependencies.join(" ")}`
            : pm === "yarn"
              ? `yarn add ${result.dependencies.join(" ")}`
              : `bun add ${result.dependencies.join(" ")}`,
      )}`
      : "";

    const fileStats = [
      result.filesCreated.length > 0 ? `✓ New files written: ${result.filesCreated.length}` : null,
      result.filesPreserved.length > 0
        ? `ℹ Existing files verified on disk: ${result.filesPreserved.length} (overwrite set to No)`
        : null,
      `✓ Total component files on disk: ${result.filesCreated.length + result.filesPreserved.length}`,
    ]
      .filter(Boolean)
      .join("\n");

    p.note(
      [
        `✓ Components processed: ${result.componentsAdded.length}`,
        fileStats,
        result.errors.length > 0
          ? `⚠ Warnings/Skipped: ${result.errors.length} (check log)`
          : `✓ All components ready!`,
        depList,
      ]
        .filter(Boolean)
        .join("\n"),
      "Summary & Next Steps",
    );

    p.outro(pc.green(pc.bold("✨ All assistant-ui components ready to use!")));
  } else {
    s.stop(pc.red("✗ Installation completed with errors"));
    console.error(pc.red(JSON.stringify(result.errors, null, 2)));
    p.outro(pc.yellow("Please review the errors above."));
  }
}
