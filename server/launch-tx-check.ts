import type { Express, RequestHandler } from "express";
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction, type AddressLookupTableAccount, type Connection } from "@solana/web3.js";
import { analyzeTransaction } from "@shared/tx-check";

/**
 * POST /api/tokens/tx-check: pre-sign diagnostics for a launch transaction. Decodes it (with
 * lookup tables resolved) and simulates it on our RPC with sigVerify off and a fresh blockhash.
 * Read only: it never signs, modifies or sends anything.
 */

export interface SimulationReport {
  ran: true;
  ok: boolean;
  error: unknown;
  unitsConsumed: number | null;
  logs: string[];
  signerBalanceChanges: { address: string; preSol: number; postSol: number | null; changeSol: number | null }[];
}

export type SimulationResult = SimulationReport | { ran: false; error: string };

/** Never throws: if the simulation can't run, says so. */
export async function simulateForCheck(connection: Connection, tx: VersionedTransaction, signers: string[]): Promise<SimulationResult> {
  try {
    const pre = await connection.getMultipleAccountsInfo(signers.map((s) => new PublicKey(s)));
    const result = await connection.simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
      accounts: { encoding: "base64", addresses: signers },
    });
    const post = result.value.accounts ?? [];
    return {
      ran: true,
      ok: !result.value.err,
      error: result.value.err,
      unitsConsumed: result.value.unitsConsumed ?? null,
      logs: result.value.logs ?? [],
      signerBalanceChanges: signers.map((address, i) => {
        const preLamports = pre[i]?.lamports ?? 0;
        const postLamports = post[i]?.lamports ?? null;
        return {
          address,
          preSol: preLamports / LAMPORTS_PER_SOL,
          postSol: postLamports === null ? null : postLamports / LAMPORTS_PER_SOL,
          changeSol: postLamports === null ? null : (postLamports - preLamports) / LAMPORTS_PER_SOL,
        };
      }),
    };
  } catch (error) {
    return { ran: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function resolveLookupTables(connection: Connection, tx: VersionedTransaction): Promise<AddressLookupTableAccount[]> {
  const tables = await Promise.all(
    tx.message.addressTableLookups.map((l) =>
      connection.getAddressLookupTable(l.accountKey).then((r) => r.value).catch(() => null)
    )
  );
  return tables.filter((t): t is AddressLookupTableAccount => !!t);
}

export function registerTxCheckRoute(app: Express, deps: { rateLimit: RequestHandler; getConnection: () => Connection }): void {
  app.post("/api/tokens/tx-check", deps.rateLimit, async (req, res) => {
    const { step, transaction } = req.body ?? {};
    if (typeof step !== "string" || typeof transaction !== "string" || transaction.length > 20000) {
      return res.status(400).json({ error: "step and a base64 transaction are required" });
    }
    let tx: VersionedTransaction;
    try {
      tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
    } catch (error) {
      return res.status(400).json({ error: `Could not decode transaction: ${error instanceof Error ? error.message : String(error)}` });
    }
    try {
      const connection = deps.getConnection();
      const analysis = analyzeTransaction(step.slice(0, 80), tx, await resolveLookupTables(connection, tx));
      const simulation = await simulateForCheck(connection, tx, analysis.requiredSigners.map((s) => s.address));
      console.log(
        `[Launch TX check] ${analysis.step}: ${analysis.instructionCount} instructions, ` +
          `programs ${analysis.programs.map((p) => p.name).join(", ")}, fee payer ${analysis.feePayer}, ` +
          `simulation ${!simulation.ran ? "could not run" : simulation.ok ? "ok" : `error ${JSON.stringify(simulation.error)}`}`
      );
      res.json({ analysis, simulation });
    } catch (error) {
      res.json({ analysis: null, simulation: { ran: false, error: error instanceof Error ? error.message : String(error) } });
    }
  });
}
