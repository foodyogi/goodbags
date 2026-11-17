import { test } from "node:test";
import assert from "node:assert/strict";
import { FYI_TOKEN_MINT, SOLANA_CLUSTER, solscanUrl } from "../shared/solana";

test("explorer URLs target mainnet with no cluster param", () => {
  assert.equal(SOLANA_CLUSTER, "mainnet-beta");
  assert.equal(solscanUrl("tx", "abc"), "https://solscan.io/tx/abc");
  assert.equal(solscanUrl("account", "abc"), "https://solscan.io/account/abc");
  assert.equal(solscanUrl("token", "abc"), "https://solscan.io/token/abc");
});

test("FYI mint is the full mainnet mint", () => {
  assert.equal(FYI_TOKEN_MINT, "N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbGKgvBAGS");
});
