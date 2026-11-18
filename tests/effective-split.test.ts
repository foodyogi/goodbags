import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  NEW_LAUNCH_MAX_CHARITY_PERCENT,
  NEW_LAUNCH_MIN_CHARITY_PERCENT,
  NEW_LAUNCH_SPLITS,
  effectiveSplitFromBps,
  formatPercent,
  hasDeployerShare,
} from "../shared/feeSplit";

test("new-launch effective split per tier matches Bags.fm's 25% deployer share", () => {
  assert.deepEqual(
    NEW_LAUNCH_SPLITS.map((s) => [s.tier, s.charityPercent, s.buybackPercent, s.creatorPercent]),
    [
      [0, 56.25, 3.75, 40],
      [25, 60, 3.75, 36.25],
      [50, 63.75, 3.75, 32.5],
      [75, 67.5, 3.75, 28.75],
      [100, 71.25, 3.75, 25],
    ]
  );
  for (const s of NEW_LAUNCH_SPLITS) {
    assert.equal(s.charityPercent + s.buybackPercent + s.creatorPercent, 100);
    assert.equal(s.deployerPercent, 25);
  }
  assert.equal(NEW_LAUNCH_MIN_CHARITY_PERCENT, 56);
  assert.equal(NEW_LAUNCH_MAX_CHARITY_PERCENT, 71);
});

test("coins launched before September 2026 keep their on-chain split without a deployer share", () => {
  assert.equal(hasDeployerShare("2026-02-01T17:12:12.949Z"), false); // LEMONAID
  assert.equal(hasDeployerShare("2026-02-01T16:31:59.103Z"), false); // CHDOGE
  assert.equal(hasDeployerShare("2026-11-18T00:00:00Z"), true);
  assert.deepEqual(effectiveSplitFromBps(7500, 500, 2000, false), {
    charityPercent: 75,
    buybackPercent: 5,
    creatorPercent: 20,
    deployerPercent: 0,
  });
});

test("formatPercent drops trailing zeros", () => {
  assert.equal(formatPercent(56.25), "56.25%");
  assert.equal(formatPercent(40), "40%");
  assert.equal(formatPercent(3.75), "3.75%");
});

// Static copy can't import the helper, so check it states the same figures
test("index.html and README use the new-launch figures and no per-trade percentages", () => {
  for (const file of ["client/index.html", "README.md"]) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.ok(text.includes(`${NEW_LAUNCH_MIN_CHARITY_PERCENT}%`), `${file} states at least ${NEW_LAUNCH_MIN_CHARITY_PERCENT}%`);
    assert.ok(!/0\.75%|of every trade/.test(text), `${file} has an outdated per-trade figure`);
  }
});
