/**
 * BPS Fee Split Verification Tests
 * 
 * Tests that the shared fee split logic matches the claimed model:
 * - 1% total royalty stream = 10000 BPS
 * - Default: Charity 7500 (75%), Buyback 500 (5%), Creator 2000 (20%)
 * - Creator can donate 0%, 25%, 50%, 75%, or 100% of their 20% share to charity
 * - Creator is excluded from recipients when creatorBps = 0
 * 
 * Run with: npx tsx server/tests/bps-verification.ts
 */

import { 
  computeFeeSplit,
  deriveTierFromBps,
  isBpsAnomaly,
  getTierLabel,
  bpsToPercent,
  BASE_CHARITY_BPS,
  BASE_BUYBACK_BPS,
  BASE_CREATOR_BPS,
  TOTAL_FEE_BPS,
  DONATION_TIERS,
  type DonationTier,
} from "../../shared/feeSplit";

interface TierTestCase {
  donatePercent: DonationTier;
  expectedCharity: number;
  expectedBuyback: number;
  expectedCreator: number;
}

const testCases: TierTestCase[] = [
  { donatePercent: 0,   expectedCharity: 7500, expectedBuyback: 500, expectedCreator: 2000 },
  { donatePercent: 25,  expectedCharity: 8000, expectedBuyback: 500, expectedCreator: 1500 },
  { donatePercent: 50,  expectedCharity: 8500, expectedBuyback: 500, expectedCreator: 1000 },
  { donatePercent: 75,  expectedCharity: 9000, expectedBuyback: 500, expectedCreator: 500 },
  { donatePercent: 100, expectedCharity: 9500, expectedBuyback: 500, expectedCreator: 0 },
];

function runTests(): void {
  console.log("=".repeat(60));
  console.log("BPS FEE SPLIT VERIFICATION TESTS (using shared/feeSplit.ts)");
  console.log("=".repeat(60));
  console.log("");
  
  console.log("Verifying base constants from shared module:");
  console.log(`  BASE_CHARITY_BPS:  ${BASE_CHARITY_BPS} (expected: 7500)`);
  console.log(`  BASE_BUYBACK_BPS:  ${BASE_BUYBACK_BPS} (expected: 500)`);
  console.log(`  BASE_CREATOR_BPS:  ${BASE_CREATOR_BPS} (expected: 2000)`);
  console.log(`  TOTAL_FEE_BPS:     ${TOTAL_FEE_BPS} (expected: 10000)`);
  console.log("");
  
  let allPassed = true;
  
  if (BASE_CHARITY_BPS !== 7500) {
    console.log("❌ FAIL: BASE_CHARITY_BPS should be 7500");
    allPassed = false;
  }
  if (BASE_BUYBACK_BPS !== 500) {
    console.log("❌ FAIL: BASE_BUYBACK_BPS should be 500");
    allPassed = false;
  }
  if (BASE_CREATOR_BPS !== 2000) {
    console.log("❌ FAIL: BASE_CREATOR_BPS should be 2000");
    allPassed = false;
  }
  if (TOTAL_FEE_BPS !== 10000) {
    console.log("❌ FAIL: TOTAL_FEE_BPS should be 10000");
    allPassed = false;
  }
  
  const baseSum = BASE_CHARITY_BPS + BASE_BUYBACK_BPS + BASE_CREATOR_BPS;
  if (baseSum !== TOTAL_FEE_BPS) {
    console.log(`❌ FAIL: Base sum ${baseSum} !== TOTAL_FEE_BPS ${TOTAL_FEE_BPS}`);
    allPassed = false;
  } else {
    console.log(`✅ PASS: Base constants sum to ${TOTAL_FEE_BPS}`);
  }
  
  console.log("");
  console.log("-".repeat(60));
  console.log("Testing computeFeeSplit() for all 5 donation tiers:");
  console.log("-".repeat(60));
  console.log("");
  
  for (const testCase of testCases) {
    const { donatePercent, expectedCharity, expectedBuyback, expectedCreator } = testCase;
    const result = computeFeeSplit(donatePercent);
    
    const charityMatch = result.charityBps === expectedCharity;
    const buybackMatch = result.buybackBps === expectedBuyback;
    const creatorMatch = result.creatorBps === expectedCreator;
    const sum = result.charityBps + result.buybackBps + result.creatorBps;
    const sumMatch = sum === TOTAL_FEE_BPS;
    
    console.log(`Tier: ${donatePercent}% donation`);
    console.log(`  Expected: charity=${expectedCharity}, buyback=${expectedBuyback}, creator=${expectedCreator}`);
    console.log(`  Actual:   charity=${result.charityBps}, buyback=${result.buybackBps}, creator=${result.creatorBps}`);
    console.log(`  Sum:      ${sum} (expected: ${TOTAL_FEE_BPS})`);
    
    if (charityMatch && buybackMatch && creatorMatch && sumMatch) {
      console.log(`  ✅ PASS`);
    } else {
      console.log(`  ❌ FAIL`);
      allPassed = false;
    }
    console.log("");
  }
  
  console.log("-".repeat(60));
  console.log("Testing deriveTierFromBps() round-trip:");
  console.log("-".repeat(60));
  console.log("");
  
  for (const testCase of testCases) {
    const result = computeFeeSplit(testCase.donatePercent);
    const derivedTier = deriveTierFromBps(result.charityBps, result.buybackBps, result.creatorBps);
    
    if (derivedTier === testCase.donatePercent) {
      console.log(`  Tier ${testCase.donatePercent}%: deriveTierFromBps(${result.charityBps}, ${result.buybackBps}, ${result.creatorBps}) = ${derivedTier}% ✅`);
    } else {
      console.log(`  Tier ${testCase.donatePercent}%: deriveTierFromBps returned ${derivedTier}, expected ${testCase.donatePercent} ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("-".repeat(60));
  console.log("Testing deriveTierFromBps() with invalid BPS (should return null):");
  console.log("-".repeat(60));
  console.log("");
  
  const invalidCases = [
    { charity: 7600, buyback: 500, creator: 1900 }, // Non-standard split
    { charity: 8000, buyback: 600, creator: 1400 }, // Wrong buyback
    { charity: 8000, buyback: 500, creator: 1000 }, // Sum != 10000
  ];
  
  for (const inv of invalidCases) {
    const tier = deriveTierFromBps(inv.charity, inv.buyback, inv.creator);
    const sum = inv.charity + inv.buyback + inv.creator;
    if (tier === null) {
      console.log(`  (${inv.charity}, ${inv.buyback}, ${inv.creator}) sum=${sum} -> null ✅`);
    } else {
      console.log(`  (${inv.charity}, ${inv.buyback}, ${inv.creator}) sum=${sum} -> ${tier}, expected null ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("-".repeat(60));
  console.log("Testing isBpsAnomaly():");
  console.log("-".repeat(60));
  console.log("");
  
  const anomalyCases = [
    { charity: 7500, buyback: 500, creator: 2000, expectAnomaly: false },
    { charity: 8500, buyback: 500, creator: 1000, expectAnomaly: false },
    { charity: 7500, buyback: 500, creator: 1900, expectAnomaly: true },
    { charity: null, buyback: null, creator: null, expectAnomaly: true },
  ];
  
  for (const tc of anomalyCases) {
    const isAnomaly = isBpsAnomaly(tc.charity, tc.buyback, tc.creator);
    const label = isAnomaly ? "ANOMALY" : "OK";
    const expected = tc.expectAnomaly ? "ANOMALY" : "OK";
    if (isAnomaly === tc.expectAnomaly) {
      console.log(`  (${tc.charity}, ${tc.buyback}, ${tc.creator}) -> ${label} ✅`);
    } else {
      console.log(`  (${tc.charity}, ${tc.buyback}, ${tc.creator}) -> ${label}, expected ${expected} ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("-".repeat(60));
  console.log("Testing getTierLabel():");
  console.log("-".repeat(60));
  console.log("");
  
  const labelCases: { tier: DonationTier | null; expected: string }[] = [
    { tier: 0, expected: "Keep All" },
    { tier: 25, expected: "25% to Charity" },
    { tier: 50, expected: "50% to Charity" },
    { tier: 75, expected: "75% to Charity" },
    { tier: 100, expected: "Give All" },
    { tier: null, expected: "Custom" },
  ];
  
  for (const lc of labelCases) {
    const label = getTierLabel(lc.tier);
    if (label === lc.expected) {
      console.log(`  getTierLabel(${lc.tier}) = "${label}" ✅`);
    } else {
      console.log(`  getTierLabel(${lc.tier}) = "${label}", expected "${lc.expected}" ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("-".repeat(60));
  console.log("Testing bpsToPercent():");
  console.log("-".repeat(60));
  console.log("");
  
  const percentCases = [
    { bps: 7500, expected: "75.00" },
    { bps: 500, expected: "5.00" },
    { bps: 2000, expected: "20.00" },
    { bps: 9500, expected: "95.00" },
  ];
  
  for (const pc of percentCases) {
    const pct = bpsToPercent(pc.bps);
    if (pct === pc.expected) {
      console.log(`  bpsToPercent(${pc.bps}) = "${pct}" ✅`);
    } else {
      console.log(`  bpsToPercent(${pc.bps}) = "${pct}", expected "${pc.expected}" ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("-".repeat(60));
  console.log("Testing fee claimers logic (creator excluded at 100%):");
  console.log("-".repeat(60));
  console.log("");
  
  for (const tier of DONATION_TIERS) {
    const split = computeFeeSplit(tier);
    const recipients = [];
    if (split.creatorBps > 0) recipients.push("creator");
    recipients.push("charity", "buyback");
    
    const expectedCount = tier === 100 ? 2 : 3;
    if (recipients.length === expectedCount) {
      console.log(`  Tier ${tier}%: ${recipients.length} recipients (${recipients.join(", ")}) ✅`);
    } else {
      console.log(`  Tier ${tier}%: ${recipients.length} recipients, expected ${expectedCount} ❌`);
      allPassed = false;
    }
  }
  console.log("");
  
  console.log("=".repeat(60));
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED");
  } else {
    console.log("❌ SOME TESTS FAILED");
    process.exit(1);
  }
  console.log("=".repeat(60));
}

runTests();
