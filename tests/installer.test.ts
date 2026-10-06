import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fetchRegistry, CATEGORIES } from "../src/registry.js";
import { installComponents } from "../src/installer.js";

test("Registry: Loads all items and assigns valid categories", async () => {
  const registry = await fetchRegistry();
  assert.ok(registry.items.length >= 150, "Expected at least 150 items in registry");

  const validCategoryKeys = new Set(CATEGORIES.map((c) => c.key));
  for (const item of registry.items) {
    assert.ok(
      validCategoryKeys.has(item.category),
      `Item ${item.name} has invalid category: ${item.category}`,
    );
  }
});

test("Installer: Dry-run execution performs simulated downloads without mutating disk", async () => {
  const testDir = path.resolve("./scratch-test-dir");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  const result = await installComponents(["thread", "utils"], {
    engine: "direct",
    cwd: testDir,
    dryRun: true,
  });

  assert.equal(result.success, true);
  assert.equal(result.componentsAdded.length, 2);
  // Ensure testDir was never created on disk during dry run
  assert.equal(fs.existsSync(testDir), false);
});

test("Installer: Preserves existing files without re-writing when overwrite is false", async () => {
  const testDir = path.resolve("./scratch-preserve-test");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(testDir, "lib"), { recursive: true });

  const dummyFilePath = path.join(testDir, "lib", "utils.ts");
  fs.writeFileSync(dummyFilePath, "// existing custom utils", "utf8");

  const result = await installComponents(["utils"], {
    engine: "direct",
    cwd: testDir,
    overwrite: false,
  });

  assert.equal(result.filesPreserved.length, 1);
  assert.equal(result.filesCreated.length, 0);
  assert.equal(fs.readFileSync(dummyFilePath, "utf8"), "// existing custom utils");

  fs.rmSync(testDir, { recursive: true, force: true });
});
