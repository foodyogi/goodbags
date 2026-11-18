import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { isCharityOnboarded, LISTED_NOTICE } from "../shared/charities";
import { FYI_CHARITY_WALLET } from "../shared/solana";

test("onboarded means a confirmed X handle or a Solana wallet (the launch form's rule)", () => {
  // Food Yoga International as stored today
  assert.equal(isCharityOnboarded({ walletAddress: FYI_CHARITY_WALLET, twitterHandle: "fflglobal", xHandleVerified: true }), true);
  assert.equal(isCharityOnboarded({ walletAddress: null, twitterHandle: "fflglobal", xHandleVerified: true }), true);
  assert.equal(isCharityOnboarded({ walletAddress: FYI_CHARITY_WALLET, twitterHandle: null, xHandleVerified: false }), true);
  // Change API search result with a Solana wallet
  assert.equal(isCharityOnboarded({ solanaAddress: FYI_CHARITY_WALLET }), true);
});

test("charities listed from public records are not onboarded", () => {
  // Seeded entries such as UNICEF: an X handle that hasn't been confirmed with Bags.fm, no wallet
  assert.equal(isCharityOnboarded({ walletAddress: null, twitterHandle: "UNICEF", xHandleVerified: false }), false);
  assert.equal(isCharityOnboarded({ walletAddress: null, twitterHandle: "UNICEF", xHandleVerified: null }), false);
  assert.equal(isCharityOnboarded({}), false);
});

test("the listed-charities notice says they have not joined or endorsed GoodBags", () => {
  assert.equal(
    LISTED_NOTICE,
    "These nonprofits are listed from public records. They have not joined GoodBags or endorsed it. A coin can be launched for a charity only after it completes onboarding."
  );
});

test("no page calls the whole directory verified partner charities", () => {
  const hits = execSync(
    `grep -rniE "Verified Partner|Verified Charities|Not Yet Available for Donations|safe to trade|Legit Token" client/src client/index.html || true`,
    { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" }
  ).trim();
  assert.equal(hits, "", hits);
});
