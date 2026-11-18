import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DONATION_TIERS,
  TOTAL_FEE_BPS,
  charityShareLamports,
  computeFeeSplit,
  resolveDonationTier,
  splitFromClaimers,
  type FeeClaimer,
} from "../shared/feeSplit";
import { PublicKey } from "@solana/web3.js";
import { decodeFeeShareClaimers } from "../server/charity-fees";

const CREATOR = "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP";
const CHARITY = "3psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr";
const BUYBACK = "8pgMzffWjeuYvjYQkyfvWpzKWQDvjXAm4iQB1auvQZH8";

const EXPECTED: Record<number, { charityBps: number; buybackBps: number; creatorBps: number }> = {
  0: { charityBps: 7500, buybackBps: 500, creatorBps: 2000 },
  25: { charityBps: 8000, buybackBps: 500, creatorBps: 1500 },
  50: { charityBps: 8500, buybackBps: 500, creatorBps: 1000 },
  75: { charityBps: 9000, buybackBps: 500, creatorBps: 500 },
  100: { charityBps: 9500, buybackBps: 500, creatorBps: 0 },
};

// Same order and zero-BPS skipping as createFeeShareConfig in server/bags-sdk.ts
function claimersFor(tier: (typeof DONATION_TIERS)[number]): FeeClaimer[] {
  const split = computeFeeSplit(tier);
  return [
    { wallet: CREATOR, bps: split.creatorBps },
    { wallet: CHARITY, bps: split.charityBps },
    { wallet: BUYBACK, bps: split.buybackBps },
  ].filter((c) => c.bps > 0);
}

for (const tier of DONATION_TIERS) {
  test(`tier ${tier}%: selected tier is used, totals 10000, buyback stays 500`, () => {
    assert.equal(resolveDonationTier(tier), tier);
    const split = computeFeeSplit(tier);
    assert.deepEqual(
      { charityBps: split.charityBps, buybackBps: split.buybackBps, creatorBps: split.creatorBps },
      EXPECTED[tier]
    );
    assert.equal(split.charityBps + split.buybackBps + split.creatorBps, TOTAL_FEE_BPS);
    assert.equal(split.buybackBps, 500);
  });

  test(`tier ${tier}%: split read back from on-chain claimers equals the split launched`, () => {
    assert.deepEqual(splitFromClaimers(claimersFor(tier), CREATOR, BUYBACK), {
      charityWallet: CHARITY,
      ...EXPECTED[tier],
    });
  });
}

test("resolveDonationTier rejects anything that isn't a tier", () => {
  for (const bad of [10, 30, 99, 101, -25, 50.5, "50", NaN, true]) {
    assert.equal(resolveDonationTier(bad), null, String(bad));
  }
});

test("resolveDonationTier keeps the legacy donateCreatorShare flag working", () => {
  assert.equal(resolveDonationTier(undefined), 0);
  assert.equal(resolveDonationTier(undefined, true), 100);
  assert.equal(resolveDonationTier(0, true), 100);
  assert.equal(resolveDonationTier(50, true), 50);
});

test("splitFromClaimers returns null when roles can't be identified or BPS don't total 10000", () => {
  assert.equal(splitFromClaimers([{ wallet: CREATOR, bps: 2000 }, { wallet: BUYBACK, bps: 500 }], CREATOR, BUYBACK), null);
  assert.equal(
    splitFromClaimers(
      [{ wallet: CHARITY, bps: 7500 }, { wallet: "11111111111111111111111111111111", bps: 2000 }, { wallet: BUYBACK, bps: 500 }],
      CREATOR,
      BUYBACK
    ),
    null
  );
  assert.equal(
    splitFromClaimers([{ wallet: CREATOR, bps: 2000 }, { wallet: CHARITY, bps: 7000 }, { wallet: BUYBACK, bps: 500 }], CREATOR, BUYBACK),
    null
  );
});

test("decodeFeeShareClaimers reads the on-chain fee config layout (LEMONAID's claimers)", () => {
  const claimers = [
    { wallet: CREATOR, bps: 2000 },
    { wallet: CHARITY, bps: 7500 },
    { wallet: BUYBACK, bps: 500 },
  ];
  const header = Buffer.alloc(184);
  const count = Buffer.alloc(4);
  count.writeUInt32LE(claimers.length);
  const keys = Buffer.concat(claimers.map((c) => new PublicKey(c.wallet).toBuffer()));
  const bps = Buffer.alloc(2 * claimers.length);
  claimers.forEach((c, i) => bps.writeUInt16LE(c.bps, 2 * i));
  const data = Buffer.concat([header, count, keys, count, bps]);

  assert.equal(data.length, 294); // Matches LEMONAID's config account size on mainnet
  assert.deepEqual(decodeFeeShareClaimers(data), claimers);
  assert.equal(decodeFeeShareClaimers(data.subarray(0, 200)), null);
});

test("charityShareLamports applies the charity BPS to lifetime fees", () => {
  assert.equal(charityShareLamports(BigInt(1_000_000_000), 7500), BigInt(750_000_000));
  assert.equal(charityShareLamports(BigInt(3), 7500), BigInt(2)); // Rounds down
  assert.equal(charityShareLamports(BigInt(0), 9500), BigInt(0));
});
