/**
 * BPS Fee Split Verification Tests
 * 
 * Tests that the fee split logic matches the claimed model:
 * - 1% total royalty stream = 10000 BPS
 * - Default: Charity 7500 (75%), Buyback 500 (5%), Creator 2000 (20%)
 * - Creator can donate 0%, 25%, 50%, 75%, or 100% of their 20% share to charity
 * - Creator is excluded from recipients when creatorBps = 0
 * 
 * Run with: npx tsx server/tests/bps-verification.ts
 */

import { 
  CHARITY_FEE_BPS, 
  BUYBACK_FEE_BPS, 
  CREATOR_FEE_BPS,
  TOTAL_FEE_BPS,
  CHARITY_FEE_PERCENTAGE,
  BUYBACK_FEE_PERCENTAGE,
  CREATOR_FEE_PERCENTAGE,
  TOTAL_FEE_PERCENTAGE
} from "../../shared/schema";

interface TierTestCase {
  donatePercent: number;
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

function calculateBpsSplit(donateCreatorPercent: number): { charityBps: number; buybackBps: number; creatorBps: number } {
  const donatedCreatorBps = Math.round(CREATOR_FEE_BPS * donateCreatorPercent / 100);
  const charityBps = CHARITY_FEE_BPS + donatedCreatorBps;
  const buybackBps = BUYBACK_FEE_BPS;
  const creatorBps = CREATOR_FEE_BPS - donatedCreatorBps;
  
  return { charityBps, buybackBps, creatorBps };
}

function runTests(): void {
  console.log("=".repeat(60));
  console.log("BPS FEE SPLIT VERIFICATION TESTS");
  console.log("=".repeat(60));
  console.log("");
  
  console.log("Verifying base constants:");
  console.log(`  CHARITY_FEE_BPS:  ${CHARITY_FEE_BPS} (expected: 7500)`);
  console.log(`  BUYBACK_FEE_BPS:  ${BUYBACK_FEE_BPS} (expected: 500)`);
  console.log(`  CREATOR_FEE_BPS:  ${CREATOR_FEE_BPS} (expected: 2000)`);
  console.log(`  TOTAL_FEE_BPS:    ${TOTAL_FEE_BPS} (expected: 10000)`);
  console.log("");
  
  let allPassed = true;
  
  if (CHARITY_FEE_BPS !== 7500) {
    console.log("❌ FAIL: CHARITY_FEE_BPS should be 7500");
    allPassed = false;
  }
  if (BUYBACK_FEE_BPS !== 500) {
    console.log("❌ FAIL: BUYBACK_FEE_BPS should be 500");
    allPassed = false;
  }
  if (CREATOR_FEE_BPS !== 2000) {
    console.log("❌ FAIL: CREATOR_FEE_BPS should be 2000");
    allPassed = false;
  }
  if (TOTAL_FEE_BPS !== 10000) {
    console.log("❌ FAIL: TOTAL_FEE_BPS should be 10000");
    allPassed = false;
  }
  
  const baseSum = CHARITY_FEE_BPS + BUYBACK_FEE_BPS + CREATOR_FEE_BPS;
  if (baseSum !== TOTAL_FEE_BPS) {
    console.log(`❌ FAIL: Base sum ${baseSum} !== TOTAL_FEE_BPS ${TOTAL_FEE_BPS}`);
    allPassed = false;
  } else {
    console.log(`✅ PASS: Base constants sum to ${TOTAL_FEE_BPS}`);
  }
  
  console.log("");
  console.log("-".repeat(60));
  console.log("Testing all 5 donation tiers:");
  console.log("-".repeat(60));
  console.log("");
  
  for (const testCase of testCases) {
    const { donatePercent, expectedCharity, expectedBuyback, expectedCreator } = testCase;
    const result = calculateBpsSplit(donatePercent);
    
    const charityMatch = result.charityBps === expectedCharity;
    const buybackMatch = result.buybackBps === expectedBuyback;
    const creatorMatch = result.creatorBps === expectedCreator;
    const sumCorrect = result.charityBps + result.buybackBps + result.creatorBps === TOTAL_FEE_BPS;
    
    const allMatch = charityMatch && buybackMatch && creatorMatch && sumCorrect;
    
    console.log(`Tier: ${donatePercent}% donation`);
    console.log(`  Expected: charity=${expectedCharity}, buyback=${expectedBuyback}, creator=${expectedCreator}`);
    console.log(`  Actual:   charity=${result.charityBps}, buyback=${result.buybackBps}, creator=${result.creatorBps}`);
    console.log(`  Sum:      ${result.charityBps + result.buybackBps + result.creatorBps} (expected: 10000)`);
    
    if (allMatch) {
      console.log(`  ✅ PASS`);
    } else {
      console.log(`  ❌ FAIL`);
      if (!charityMatch) console.log(`     - Charity mismatch: ${result.charityBps} !== ${expectedCharity}`);
      if (!buybackMatch) console.log(`     - Buyback mismatch: ${result.buybackBps} !== ${expectedBuyback}`);
      if (!creatorMatch) console.log(`     - Creator mismatch: ${result.creatorBps} !== ${expectedCreator}`);
      if (!sumCorrect) console.log(`     - Sum incorrect: ${result.charityBps + result.buybackBps + result.creatorBps} !== 10000`);
      allPassed = false;
    }
    console.log("");
  }
  
  console.log("-".repeat(60));
  console.log("Testing creator exclusion when BPS = 0:");
  console.log("-".repeat(60));
  console.log("");
  
  const tier100 = calculateBpsSplit(100);
  if (tier100.creatorBps === 0) {
    console.log("✅ PASS: At 100% donation, creatorBps = 0 (creator should be excluded from recipients)");
  } else {
    console.log(`❌ FAIL: At 100% donation, creatorBps = ${tier100.creatorBps} (should be 0)`);
    allPassed = false;
  }
  
  console.log("");
  console.log("-".repeat(60));
  console.log("Testing fee percentages match BPS:");
  console.log("-".repeat(60));
  console.log("");
  
  const charityPctBps = Math.round(CHARITY_FEE_PERCENTAGE / TOTAL_FEE_PERCENTAGE * 10000);
  const buybackPctBps = Math.round(BUYBACK_FEE_PERCENTAGE / TOTAL_FEE_PERCENTAGE * 10000);
  const creatorPctBps = Math.round(CREATOR_FEE_PERCENTAGE / TOTAL_FEE_PERCENTAGE * 10000);
  
  console.log(`  CHARITY_FEE_PERCENTAGE (${CHARITY_FEE_PERCENTAGE}%) → ${charityPctBps} BPS (expected: ${CHARITY_FEE_BPS})`);
  console.log(`  BUYBACK_FEE_PERCENTAGE (${BUYBACK_FEE_PERCENTAGE}%) → ${buybackPctBps} BPS (expected: ${BUYBACK_FEE_BPS})`);
  console.log(`  CREATOR_FEE_PERCENTAGE (${CREATOR_FEE_PERCENTAGE}%) → ${creatorPctBps} BPS (expected: ${CREATOR_FEE_BPS})`);
  
  if (charityPctBps === CHARITY_FEE_BPS && buybackPctBps === BUYBACK_FEE_BPS && creatorPctBps === CREATOR_FEE_BPS) {
    console.log("  ✅ PASS: Percentages match BPS values");
  } else {
    console.log("  ❌ FAIL: Percentages do not match BPS values");
    allPassed = false;
  }
  
  console.log("");
  console.log("-".repeat(60));
  console.log("Testing fee claimers logic (creator exclusion):");
  console.log("-".repeat(60));
  console.log("");
  
  function buildFeeClaimers(charityBps: number, buybackBps: number, creatorBps: number): { recipient: string; bps: number }[] {
    const claimers: { recipient: string; bps: number }[] = [];
    if (creatorBps > 0) claimers.push({ recipient: 'creator', bps: creatorBps });
    if (charityBps > 0) claimers.push({ recipient: 'charity', bps: charityBps });
    if (buybackBps > 0) claimers.push({ recipient: 'buyback', bps: buybackBps });
    return claimers;
  }
  
  for (const testCase of testCases) {
    const { donatePercent, expectedCharity, expectedBuyback, expectedCreator } = testCase;
    const claimers = buildFeeClaimers(expectedCharity, expectedBuyback, expectedCreator);
    const hasCreator = claimers.some(c => c.recipient === 'creator');
    const expectedHasCreator = expectedCreator > 0;
    
    console.log(`  Tier ${donatePercent}%: ${claimers.length} recipients (${claimers.map(c => c.recipient).join(', ')})`);
    
    if (hasCreator !== expectedHasCreator) {
      console.log(`    ❌ FAIL: Creator inclusion mismatch`);
      allPassed = false;
    } else if (donatePercent === 100 && hasCreator) {
      console.log(`    ❌ FAIL: Creator should be excluded at 100% donation`);
      allPassed = false;
    } else {
      console.log(`    ✅ PASS`);
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
