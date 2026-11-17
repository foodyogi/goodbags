import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("all version strings match package.json", () => {
  const version = JSON.parse(read("package.json")).version;
  const lock = JSON.parse(read("package-lock.json"));
  const changelogVersion = read("CHANGELOG.md").match(/^## (\d+\.\d+\.\d+)/m)?.[1];

  assert.equal(lock.version, version, "package-lock.json version");
  assert.equal(lock.packages[""].version, version, "package-lock.json packages[\"\"] version");
  assert.equal(changelogVersion, version, "latest CHANGELOG.md entry");
});
