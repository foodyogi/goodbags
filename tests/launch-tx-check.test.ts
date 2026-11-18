import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import * as bagsConstants from "@bagsfm/bags-sdk";
import { analyzeTransaction, KNOWN_PROGRAMS, BAGS_GLOBAL_LUT_ADDRESS } from "../shared/tx-check";
import { registerTxCheckRoute, simulateForCheck } from "../server/launch-tx-check";

const payer = Keypair.generate();
const coSigner = Keypair.generate();
const recipient = Keypair.generate().publicKey;
const blockhash = "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi";
const FEE_SHARE_V2 = new PublicKey("FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK");

function buildTx(opts: { coSign?: boolean; lut?: AddressLookupTableAccount; nonce?: boolean } = {}) {
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: recipient, lamports: 1_500_000_000 }),
    SystemProgram.createAccount({ fromPubkey: payer.publicKey, newAccountPubkey: coSigner.publicKey, lamports: 2_039_280, space: 165, programId: FEE_SHARE_V2 }),
    { programId: FEE_SHARE_V2, keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }], data: Buffer.from([1, 2, 3]) },
  ];
  if (opts.nonce) {
    instructions.unshift(SystemProgram.nonceAdvance({ noncePubkey: Keypair.generate().publicKey, authorizedPubkey: payer.publicKey }));
  }
  const message = new TransactionMessage({ payerKey: payer.publicKey, recentBlockhash: blockhash, instructions });
  const tx = new VersionedTransaction(opts.lut ? message.compileToV0Message([opts.lut]) : message.compileToV0Message());
  if (opts.coSign) tx.sign([coSigner]);
  return tx;
}

const b64 = (tx: VersionedTransaction) => Buffer.from(tx.serialize()).toString("base64");

test("hardcoded Bags and Meteora IDs match the Bags SDK constants", () => {
  for (const id of [
    bagsConstants.BAGS_FEE_SHARE_V1_PROGRAM_ID,
    bagsConstants.BAGS_FEE_SHARE_V2_PROGRAM_ID,
    bagsConstants.METEORA_DBC_PROGRAM_ID,
    bagsConstants.METEORA_DAMM_V2_PROGRAM_ID,
  ]) {
    assert.ok(KNOWN_PROGRAMS[id], `${id} missing from KNOWN_PROGRAMS`);
  }
  assert.equal(bagsConstants.BAGS_GLOBAL_LUT.toBase58(), BAGS_GLOBAL_LUT_ADDRESS);
});

test("analysis names programs, fee payer, signers and SOL transfers", () => {
  const report = analyzeTransaction("Fee config transaction 1 of 1", buildTx({ coSign: true }));
  assert.equal(report.instructionCount, 4);
  assert.deepEqual(report.programs.map((p) => p.name), ["Compute Budget", "System", "Bags fee-share v2"]);
  assert.equal(report.feePayer, payer.publicKey.toBase58());
  assert.deepEqual(report.requiredSigners, [
    { address: payer.publicKey.toBase58(), alreadySigned: false },
    { address: coSigner.publicKey.toBase58(), alreadySigned: true },
  ]);
  assert.deepEqual(report.solTransfers, [
    { kind: "Transfer", from: payer.publicKey.toBase58(), to: recipient.toBase58(), sol: 1.5 },
    { kind: "CreateAccount", from: payer.publicKey.toBase58(), to: coSigner.publicKey.toBase58(), sol: 0.00203928 },
  ]);
  assert.equal(report.usesLookupTables, false);
  assert.equal(report.usesDurableNonce, false);
  assert.equal(report.recentBlockhash, blockhash);
});

test("analysis flags unknown programs and durable nonces", () => {
  const unknown = Keypair.generate().publicKey;
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: [{ programId: unknown, keys: [], data: Buffer.alloc(0) }],
  }).compileToV0Message();
  assert.deepEqual(analyzeTransaction("x", new VersionedTransaction(message)).programs, [{ id: unknown.toBase58(), name: "UNKNOWN" }]);
  assert.equal(analyzeTransaction("x", buildTx({ nonce: true })).usesDurableNonce, true);
});

test("lookup table accounts show as unresolved until the table is passed in", () => {
  const lut = new AddressLookupTableAccount({
    key: new PublicKey(BAGS_GLOBAL_LUT_ADDRESS),
    state: { deactivationSlot: BigInt("18446744073709551615"), lastExtendedSlot: 0, lastExtendedSlotStartIndex: 0, addresses: [recipient] },
  });
  const tx = buildTx({ lut });
  const unresolved = analyzeTransaction("x", tx);
  assert.equal(unresolved.usesLookupTables, true);
  assert.deepEqual(unresolved.lookupTables, [{ address: BAGS_GLOBAL_LUT_ADDRESS, isBagsGlobalLut: true, resolved: false }]);
  assert.match(unresolved.solTransfers[0].to, /^lookup-table-account#/);
  const resolved = analyzeTransaction("x", tx, [lut]);
  assert.equal(resolved.solTransfers[0].to, recipient.toBase58());
  assert.equal(resolved.lookupTables[0].resolved, true);
});

function mockConnection(overrides: Partial<Record<string, unknown>> = {}): Connection {
  return {
    getMultipleAccountsInfo: async (keys: PublicKey[]) => keys.map(() => ({ lamports: 3_000_000_000 })),
    simulateTransaction: async (_tx: VersionedTransaction, config: any) => {
      assert.equal(config.sigVerify, false);
      assert.equal(config.replaceRecentBlockhash, true);
      return { value: { err: null, logs: ["Program log: ok"], unitsConsumed: 1234, accounts: config.accounts.addresses.map(() => ({ lamports: 1_000_000_000 })) } };
    },
    getAddressLookupTable: async () => ({ value: null }),
    ...overrides,
  } as unknown as Connection;
}

test("simulation reports logs and signer SOL changes", async () => {
  const sim = await simulateForCheck(mockConnection(), buildTx(), [payer.publicKey.toBase58()]);
  assert.ok(sim.ran);
  assert.equal(sim.ok, true);
  assert.deepEqual(sim.logs, ["Program log: ok"]);
  assert.deepEqual(sim.signerBalanceChanges, [{ address: payer.publicKey.toBase58(), preSol: 3, postSol: 1, changeSol: -2 }]);
});

test("a failing RPC never throws, it reports that the simulation could not run", async () => {
  const sim = await simulateForCheck(mockConnection({ simulateTransaction: async () => { throw new Error("rpc down"); } }), buildTx(), []);
  assert.deepEqual(sim, { ran: false, error: "rpc down" });
});

let server: Server;
let connection = mockConnection();
const url = () => `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/tokens/tx-check`;
const post = (body: unknown) => fetch(url(), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

before(async () => {
  const app = express();
  app.use(express.json());
  registerTxCheckRoute(app, { rateLimit: (_req, _res, next) => next(), getConnection: () => connection });
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
});
after(() => server.close());

test("route returns the analysis and simulation", async () => {
  connection = mockConnection();
  const res = await post({ step: "Launch transaction", transaction: b64(buildTx({ coSign: true })) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.analysis.step, "Launch transaction");
  assert.equal(body.analysis.requiredSigners[1].alreadySigned, true);
  assert.equal(body.simulation.ok, true);
});

test("route rejects bad input with 400 and never returns 500", async () => {
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ step: "x", transaction: "not-a-transaction" })).status, 400);
  connection = mockConnection({
    getMultipleAccountsInfo: async () => { throw new Error("rpc down"); },
    getAddressLookupTable: async () => { throw new Error("rpc down"); },
  });
  const res = await post({ step: "x", transaction: b64(buildTx()) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).simulation.ran, false);
});

test("tx-check code never signs or sends, and the client helper can't block the launch", () => {
  for (const file of ["../server/launch-tx-check.ts", "../shared/tx-check.ts", "../client/src/lib/launch-tx-check.ts"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const forbidden of ["sendRawTransaction", "sendTransaction", ".sign(", "signTransaction", "Keypair", "BAGS_API_KEY"]) {
      assert.ok(!source.includes(forbidden), `${file} contains ${forbidden}`);
    }
  }
  const client = readFileSync(new URL("../client/src/lib/launch-tx-check.ts", import.meta.url), "utf8");
  assert.ok(!client.includes("throw "), "client helper must not throw");
  assert.ok(!client.includes("@bagsfm"), "Bags SDK must stay out of the browser bundle");
});
