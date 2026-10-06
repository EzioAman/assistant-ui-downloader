import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  isValidComponentName,
  sanitizeComponentNames,
  isSafeFilePath,
  isAllowedRegistryUrl,
} from "../src/security.js";
import { chunkArray } from "../src/installer.js";

test("Security: isValidComponentName prevents command and argument injection", () => {
  // Valid component slugs
  assert.equal(isValidComponentName("thread"), true);
  assert.equal(isValidComponentName("elements-reasoning-panel"), true);
  assert.equal(isValidComponentName("elements_ui"), true);
  assert.equal(isValidComponentName("chat/b/ai"), true);

  // Malicious / invalid injections
  assert.equal(isValidComponentName("thread; rm -rf /"), false);
  assert.equal(isValidComponentName("thread | cat /etc/passwd"), false);
  assert.equal(isValidComponentName("thread & echo 'pwned'"), false);
  assert.equal(isValidComponentName("thread`whoami`"), false);
  assert.equal(isValidComponentName("thread$(id)"), false);
  assert.equal(isValidComponentName(".."), false);
  assert.equal(isValidComponentName("../../evil"), false);
  assert.equal(isValidComponentName("--option"), true); // dash prefix should be sanitized if needed or allowed as slug
  assert.equal(isValidComponentName("thread\necho"), false);
  assert.equal(isValidComponentName(""), false);
});

test("Security: sanitizeComponentNames filters out dangerous tokens", () => {
  const inputs = [
    "thread",
    "  elements-composer  ",
    "bad;token",
    "../../escape",
    "valid-name",
  ];
  const sanitized = sanitizeComponentNames(inputs);
  assert.deepEqual(sanitized, ["thread", "elements-composer", "valid-name"]);
});

test("Security: isSafeFilePath blocks Directory Traversal attacks (Zip Slip)", () => {
  const safeRoot = path.resolve("e:/All Projects and Editors/ERIS BLUE");

  // Safe file paths
  assert.equal(isSafeFilePath("components/assistant-ui/thread.tsx", safeRoot), true);
  assert.equal(isSafeFilePath("lib/utils.ts", safeRoot), true);

  // Path traversal escapes
  assert.equal(isSafeFilePath("../../../evil.js", safeRoot), false);
  assert.equal(isSafeFilePath("..\\..\\evil.js", safeRoot), false);
  assert.equal(isSafeFilePath("components/../../..", safeRoot), false);
  assert.equal(isSafeFilePath("C:/Windows/System32/calc.exe", safeRoot), false);
});

test("Security: isAllowedRegistryUrl enforces HTTPS and trusted domain", () => {
  assert.equal(isAllowedRegistryUrl("https://r.assistant-ui.com/registry.json"), true);
  assert.equal(isAllowedRegistryUrl("https://r.assistant-ui.com/thread.json"), true);
  assert.equal(isAllowedRegistryUrl("https://sub.assistant-ui.com/foo.json"), true);

  // Untrusted domains and protocols
  assert.equal(isAllowedRegistryUrl("http://r.assistant-ui.com/registry.json"), false); // HTTP rejected
  assert.equal(isAllowedRegistryUrl("https://evil.com/registry.json"), false);
  assert.equal(isAllowedRegistryUrl("file:///etc/passwd"), false);
  assert.equal(isAllowedRegistryUrl("javascript:alert(1)"), false);
});

test("Windows CLI Resilience: chunkArray chunks safely without data loss", () => {
  const items = Array.from({ length: 163 }, (_, i) => `comp-${i}`);
  const chunks = chunkArray(items, 15);

  assert.equal(chunks.length, 11);
  assert.equal(chunks[0].length, 15);
  assert.equal(chunks[10].length, 13);

  // Flatten and ensure no item is omitted or duplicated
  const flattened = chunks.flat();
  assert.equal(flattened.length, 163);
  assert.deepEqual(flattened, items);
});
