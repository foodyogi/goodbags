import { LAMPORTS_PER_SOL, VersionedTransaction, type AddressLookupTableAccount } from "@solana/web3.js";

/**
 * Pre-sign diagnostics for launch transactions (read only). Decodes a transaction the wallet is
 * about to sign: programs called, fee payer, required signers, SOL transfers, lookup tables and
 * durable nonce use. Used by the browser before signing and by POST /api/tokens/tx-check.
 * Bags and Meteora IDs match the constants in @bagsfm/bags-sdk (checked by a test), written out
 * here so the SDK stays out of the browser bundle.
 */

export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
export const BAGS_GLOBAL_LUT_ADDRESS = "Eq1EVs15EAWww1YtPTtWPzJRLPJoS6VYP9oW9SbNr3yp";

export const KNOWN_PROGRAMS: Record<string, string> = {
  [SYSTEM_PROGRAM_ID]: "System",
  ComputeBudget111111111111111111111111111111: "Compute Budget",
  AddressLookupTab1e1111111111111111111111111: "Address Lookup Table",
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "SPL Token",
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: "SPL Token-2022",
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: "Associated Token Account",
  metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s: "Metaplex Token Metadata",
  MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr: "Memo",
  FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK: "Bags fee-share v2",
  FEEhPbKVKnco9EXnaY3i4R5rQVUx91wgVfu8qokixywi: "Bags fee-share v1 (Meteora fee claimer)",
  dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN: "Meteora Dynamic Bonding Curve",
  cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG: "Meteora DAMM v2",
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter v6",
};

export interface TxCheckReport {
  step: string;
  version: "legacy" | 0;
  instructionCount: number;
  programs: { id: string; name: string }[];
  feePayer: string;
  requiredSigners: { address: string; alreadySigned: boolean }[];
  solTransfers: { kind: string; from: string; to: string; sol: number }[];
  usesLookupTables: boolean;
  lookupTables: { address: string; isBagsGlobalLut: boolean; resolved: boolean }[];
  recentBlockhash: string;
  usesDurableNonce: boolean;
}

/** Pass the resolved lookup tables to name accounts loaded from them; without them those show as unresolved. */
export function analyzeTransaction(
  step: string,
  tx: VersionedTransaction,
  lookupTableAccounts: AddressLookupTableAccount[] = []
): TxCheckReport {
  const message = tx.message;
  const resolvedLuts = new Set(lookupTableAccounts.map((t) => t.key.toBase58()));
  const allLutsResolved = message.addressTableLookups.every((l) => resolvedLuts.has(l.accountKey.toBase58()));
  const keys =
    message.addressTableLookups.length > 0 && allLutsResolved
      ? message.getAccountKeys({ addressLookupTableAccounts: lookupTableAccounts })
      : null;
  const keyAt = (index: number): string => {
    if (keys) return keys.get(index)?.toBase58() ?? `unresolved#${index}`;
    return message.staticAccountKeys[index]?.toBase58() ?? `lookup-table-account#${index}`;
  };
  const view = (data: Uint8Array) => new DataView(data.buffer, data.byteOffset, data.byteLength);

  const programIds = new Set<string>();
  const solTransfers: TxCheckReport["solTransfers"] = [];
  for (const ix of message.compiledInstructions) {
    const programId = keyAt(ix.programIdIndex);
    programIds.add(programId);
    if (programId !== SYSTEM_PROGRAM_ID || ix.data.length < 12) continue;
    const data = view(ix.data);
    const kind = data.getUint32(0, true);
    // System instructions with lamports right after the u32 index: 0 CreateAccount, 2 Transfer,
    // 11 TransferWithSeed (accounts [from, base, to])
    if (kind !== 0 && kind !== 2 && kind !== 11) continue;
    solTransfers.push({
      kind: kind === 0 ? "CreateAccount" : kind === 2 ? "Transfer" : "TransferWithSeed",
      from: keyAt(ix.accountKeyIndexes[0]),
      to: keyAt(kind === 11 ? ix.accountKeyIndexes[2] : ix.accountKeyIndexes[1]),
      sol: Number(data.getBigUint64(4, true)) / LAMPORTS_PER_SOL,
    });
  }

  // A durable nonce transaction starts with System AdvanceNonceAccount (index 4)
  const first = message.compiledInstructions[0];
  const usesDurableNonce =
    !!first && keyAt(first.programIdIndex) === SYSTEM_PROGRAM_ID && first.data.length >= 4 && view(first.data).getUint32(0, true) === 4;

  return {
    step,
    version: message.version,
    instructionCount: message.compiledInstructions.length,
    programs: Array.from(programIds, (id) => ({ id, name: KNOWN_PROGRAMS[id] ?? "UNKNOWN" })),
    feePayer: keyAt(0),
    requiredSigners: Array.from({ length: message.header.numRequiredSignatures }, (_, i) => ({
      address: keyAt(i),
      alreadySigned: tx.signatures[i]?.some((byte) => byte !== 0) ?? false,
    })),
    solTransfers,
    usesLookupTables: message.addressTableLookups.length > 0,
    lookupTables: message.addressTableLookups.map((l) => ({
      address: l.accountKey.toBase58(),
      isBagsGlobalLut: l.accountKey.toBase58() === BAGS_GLOBAL_LUT_ADDRESS,
      resolved: resolvedLuts.has(l.accountKey.toBase58()),
    })),
    recentBlockhash: message.recentBlockhash,
    usesDurableNonce,
  };
}
