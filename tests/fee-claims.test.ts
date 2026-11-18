import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PublicKey, VersionedTransaction, type VersionedTransactionResponse } from "@solana/web3.js";
import bs58Pkg from "bs58";
import { claimFromTransaction, decodeUserClaimEvent } from "../server/charity-fees";
import { FYI_CHARITY_WALLET, isValidTxSignature } from "../shared/solana";

const bs58 = (bs58Pkg as any).default ?? bs58Pkg;

const LEMONAID = "5DQkgq56V81uRfzB4eDLNEQVDFrTRncS57YWa2fjBAGS";
const CHDOGE = "BG5VojHVsyx7f4Kkh8Jy7ympbgbVmgjJfLVF3PHMBAGS";
const LEMONAID_CREATOR = "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP";

// Real mainnet transactions saved from getTransaction (encoding: base64)
function loadTx(name: string): VersionedTransactionResponse {
  const raw = JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
  const tx = VersionedTransaction.deserialize(Buffer.from(raw.transaction, "base64"));
  const lookups = raw.meta.loadedAddresses;
  return {
    slot: raw.slot,
    blockTime: raw.blockTime,
    version: raw.version,
    transaction: { message: tx.message, signatures: tx.signatures.map((s) => bs58.encode(s)) },
    meta: {
      ...raw.meta,
      loadedAddresses: lookups && {
        writable: lookups.writable.map((k: string) => new PublicKey(k)),
        readonly: lookups.readonly.map((k: string) => new PublicKey(k)),
      },
    },
  } as VersionedTransactionResponse;
}

test("FYI's LEMONAID claim is read with the exact ClaimUser event amount", () => {
  const claim = claimFromTransaction(loadTx("charity-claim"), LEMONAID, FYI_CHARITY_WALLET);
  assert.deepEqual(claim, {
    signature: "ycd9bGjThRboPyN77uinKFzfyqb25GtBrcn6TS9VaUnGNVJJ7pAdM8FhWrAEifuTTHWGuTP1uvnPo6zAMhTL2N9",
    amountLamports: "330567205", // Not the 330554330 balance change
    timestamp: "2026-02-02T01:25:39.000Z",
  });
  assert.ok(isValidTxSignature(claim!.signature));
});

test("a claim only counts for its own token and the charity wallet", () => {
  const tx = loadTx("charity-claim");
  assert.equal(claimFromTransaction(tx, CHDOGE, FYI_CHARITY_WALLET), null);
  assert.equal(claimFromTransaction(tx, LEMONAID, LEMONAID_CREATOR), null);
});

test("the creator's claim on the same fee config is not a charity claim", () => {
  const tx = loadTx("creator-claim");
  assert.equal(claimFromTransaction(tx, LEMONAID, FYI_CHARITY_WALLET), null);
  assert.notEqual(claimFromTransaction(tx, LEMONAID, LEMONAID_CREATOR), null);
});

test("the charity's Jupiter swap 3HPoRQ... is never counted as a claim", () => {
  const tx = loadTx("jupiter-swap");
  assert.equal(tx.transaction.signatures[0].slice(0, 6), "3HPoRQ");
  assert.equal(claimFromTransaction(tx, LEMONAID, FYI_CHARITY_WALLET), null);
  assert.equal(claimFromTransaction(tx, CHDOGE, FYI_CHARITY_WALLET), null);
});

test("decodeUserClaimEvent rejects data without the claim event prefix", () => {
  assert.equal(decodeUserClaimEvent(new Uint8Array(197)), null);
  assert.equal(decodeUserClaimEvent(new Uint8Array(8)), null);
});
