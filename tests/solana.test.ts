import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FYI_CHARITY_WALLET,
  FYI_COIN_FEE_WALLET,
  FYI_TOKEN_MINT,
  SOLANA_CLUSTER,
  isValidTxSignature,
  solscanUrl,
  verifiedDonationTotals,
} from "../shared/solana";
import { VETTED_CHARITIES } from "../shared/schema";

test("explorer URLs target mainnet with no cluster param", () => {
  assert.equal(SOLANA_CLUSTER, "mainnet-beta");
  assert.equal(solscanUrl("tx", "abc"), "https://solscan.io/tx/abc");
  assert.equal(solscanUrl("account", "abc"), "https://solscan.io/account/abc");
  assert.equal(solscanUrl("token", "abc"), "https://solscan.io/token/abc");
});

test("FYI mint is the full mainnet mint", () => {
  assert.equal(FYI_TOKEN_MINT, "N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbGKgvBAGS");
});

test("FYI wallets: charity wallet and founder-managed $FYI coin fee wallet are distinct", () => {
  assert.equal(FYI_CHARITY_WALLET, "3psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr");
  assert.equal(FYI_COIN_FEE_WALLET, "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP");
  const fyi = VETTED_CHARITIES.find((c) => c.id === "food-yoga-international");
  assert.equal(fyi?.wallet, FYI_CHARITY_WALLET);
  assert.equal(fyi?.twitterHandle, "fflglobal");
  assert.equal(fyi?.payoutMethod, "twitter");
});

// Real mainnet launch signatures (87 and 88 chars)
const SIG_87 = "CMYi398T6N5dDswYBZWqZPyo11q3BnVtPtrE9w3bJiwcC2CS95UunzCiuNVGM6iPnvRwU88CPKUj27D2YE9NZBZ";
const SIG_88 = "2gRsFWgebeERYUe2LjvbFFykzAa8jFrokfLV5rDSKVfGwgDzRds6HcCntMGk7FvWSyNwr3KgmZuv8k9w5jgdAYYd";

test("isValidTxSignature accepts base58 signatures of 87 or 88 chars", () => {
  assert.equal(isValidTxSignature(SIG_87), true);
  assert.equal(isValidTxSignature(SIG_88), true);
});

test("isValidTxSignature rejects placeholder and malformed signatures", () => {
  const bad = [
    "donatione2ea3d7236c946939094418280bec83e",
    "donation6692e9fc9ad94eaf91e95fade879faba",
    "tx0123456789abcdef0123456789abcdef",
    "mock_tx_1769965932949",
    "test_1769965932949_abc123",
    "",
    SIG_88.slice(0, 86), // too short
    SIG_88 + "1", // too long
    SIG_88.slice(0, 87) + "0", // 0 is not base58
    SIG_88.slice(0, 87) + "l", // l is not base58
    ` ${SIG_87}`,
    null,
    undefined,
    12345,
  ];
  for (const value of bad) {
    assert.equal(isValidTxSignature(value), false, String(value));
  }
});

test("verifiedDonationTotals only counts donations with a real signature", () => {
  const totals = verifiedDonationTotals([
    { amount: "0.000850000", transactionSignature: "donatione2ea3d7236c946939094418280bec83e" },
    { amount: "0.500000000", transactionSignature: SIG_87 },
    { amount: "0.250000000", transactionSignature: SIG_88 },
  ]);
  assert.deepEqual(totals, { totalDonated: "0.750000000", donationCount: 2 });
  assert.deepEqual(verifiedDonationTotals([]), { totalDonated: "0.000000000", donationCount: 0 });
});
