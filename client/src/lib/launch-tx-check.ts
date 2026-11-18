import type { VersionedTransaction } from "@solana/web3.js";
import { analyzeTransaction } from "@shared/tx-check";

/**
 * Logs a "[Launch TX check]" block to the browser console right before a launch transaction
 * goes to the wallet: the local decode, the base64 transaction and the server simulation
 * (POST /api/tokens/tx-check). Diagnostics only: it never throws and never changes the
 * transaction, and the wallet step always continues afterwards.
 */
export async function logLaunchTxCheck(step: string, tx: VersionedTransaction, base64: string): Promise<void> {
  try {
    console.group(`[Launch TX check] ${step}`);
    try {
      const report = analyzeTransaction(step, tx);
      console.log("Instructions:", report.instructionCount, `(${report.version === 0 ? "v0" : "legacy"} transaction)`);
      console.table(report.programs);
      console.log("Fee payer:", report.feePayer);
      console.table(report.requiredSigners);
      console.log("SOL transfers:", report.solTransfers.length ? report.solTransfers : "none");
      if (report.solTransfers.length) console.table(report.solTransfers);
      console.log("Address lookup tables:", report.usesLookupTables ? report.lookupTables : "none");
      console.log("Recent blockhash:", report.recentBlockhash, "Durable nonce:", report.usesDurableNonce);
    } catch (error) {
      console.warn("Could not decode the transaction locally:", error);
    }
    console.log("Transaction (base64):", base64);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/tokens/tx-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, transaction: base64 }),
        credentials: "include",
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      const body = await res.json().catch(() => null);
      const simulation = body?.simulation;
      if (!res.ok || !simulation) {
        console.warn("Simulation check failed:", res.status, body?.error ?? body);
      } else if (!simulation.ran) {
        console.warn("Simulation could not run:", simulation.error);
      } else {
        console.log("Simulation:", simulation.ok ? "OK" : "ERROR", simulation.ok ? "" : simulation.error);
        console.log("Compute units:", simulation.unitsConsumed);
        console.table(simulation.signerBalanceChanges);
        console.log("Simulation logs:\n" + (simulation.logs ?? []).join("\n"));
        if (body.analysis?.usesLookupTables) console.log("Lookup tables (server, resolved):", body.analysis.lookupTables, body.analysis.programs);
      }
    } catch (error) {
      console.warn("Simulation check failed, continuing to the wallet:", error);
    }
    console.groupEnd();
  } catch {
    // Diagnostics must never block the launch
  }
}
