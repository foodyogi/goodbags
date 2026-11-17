import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("publishing lockfile excludes previously firewall-blocked packages", () => {
  const lock = JSON.parse(
    readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
  );
  const blocked = new Set([
    "fast-xml-parser@4.5.3",
    "shell-quote@1.8.3",
  ]);
  for (const [path, entry] of Object.entries(lock.packages) as [string, { version?: string }][]) {
    const name = path.split("node_modules/").pop();
    assert.ok(!blocked.has(`${name}@${entry.version}`), `${path} restores a known publishing blocker`);
  }
});
