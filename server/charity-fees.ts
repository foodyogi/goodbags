import { PublicKey, type VersionedTransactionResponse } from "@solana/web3.js";
import bs58Pkg from "bs58";
import { getBagsSDK, getConnection, getPlatformWallet, isConfigured } from "./bags-sdk";
import {
  charityShareLamports,
  splitFromClaimers,
  type ClaimerSplit,
  type FeeClaimer,
} from "@shared/feeSplit";
import { isValidTxSignature } from "@shared/solana";
// Handle ESM/CommonJS interop for bs58
const bs58 = (bs58Pkg as any).default ?? bs58Pkg;

// Bags.fm Fee Share V2 program. Each token's fee config is a PDA of
// ["fee_share_config", base mint, quote mint (wSOL)]
const BAGS_FEE_SHARE_V2_PROGRAM_ID = new PublicKey("FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// 8-byte account discriminator + FeeShareConfigHeader (176 bytes, per the SDK's fee-share-v2 IDL)
const CONFIG_HEADER_BYTES = 184;

// fee-share-v2 IDL: claim_user instruction discriminator, and BagsFeeShareUserClaimEvent,
// which the program emits via Anchor emit_cpi (inner instruction prefixed with the event tag)
const CLAIM_USER_IX_DISCRIMINATOR = Buffer.from([164, 64, 55, 199, 90, 78, 147, 188]);
const ANCHOR_EVENT_IX_TAG = Buffer.from("e445a52e51cb9a1d", "hex");
const USER_CLAIM_EVENT_DISCRIMINATOR = Buffer.from([115, 178, 50, 219, 175, 234, 48, 101]);

// Bags claim-events pages hold at most 100 events
const CLAIM_EVENTS_PAGE_SIZE = 100;
const MAX_CLAIM_EVENT_PAGES = 20;
const MAX_FEE_CONFIG_SIGNATURES = 1000;
// Pause between uncached transaction fetches to stay under public RPC rate limits
const RPC_FETCH_PAUSE_MS = 250;

const RPC_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 60 * 1000;

export function feeShareConfigAddress(mint: string): string {
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_share_config"), new PublicKey(mint).toBuffer(), WSOL_MINT.toBuffer()],
    BAGS_FEE_SHARE_V2_PROGRAM_ID
  );
  return address.toBase58();
}

// After the header: u32 claimer count, claimer pubkeys, u32 bps count, u16 bps per claimer
export function decodeFeeShareClaimers(data: Uint8Array): FeeClaimer[] | null {
  const buf = Buffer.from(data);
  if (buf.length < CONFIG_HEADER_BYTES + 4) return null;
  const count = buf.readUInt32LE(CONFIG_HEADER_BYTES);
  const keysStart = CONFIG_HEADER_BYTES + 4;
  const bpsStart = keysStart + 32 * count;
  if (buf.length < bpsStart + 4 + 2 * count || buf.readUInt32LE(bpsStart) !== count) return null;

  return Array.from({ length: count }, (_, i) => ({
    wallet: new PublicKey(buf.subarray(keysStart + 32 * i, keysStart + 32 * (i + 1))).toBase58(),
    bps: buf.readUInt16LE(bpsStart + 4 + 2 * i),
  }));
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), RPC_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Read the fee split actually written on-chain for a token.
 * Returns null if the config account doesn't exist or isn't in the expected shape.
 * Throws on RPC errors.
 */
export async function readOnChainSplit(
  mint: string,
  creatorWallet: string
): Promise<(ClaimerSplit & { feeConfigAddress: string }) | null> {
  const feeConfigAddress = feeShareConfigAddress(mint);
  const account = await withTimeout(
    getConnection().getAccountInfo(new PublicKey(feeConfigAddress)),
    "Fee config lookup"
  );
  if (!account || !account.owner.equals(BAGS_FEE_SHARE_V2_PROGRAM_ID)) return null;

  const claimers = decodeFeeShareClaimers(account.data);
  const split = claimers && splitFromClaimers(claimers, creatorWallet, getPlatformWallet());
  return split ? { ...split, feeConfigAddress } : null;
}

export interface FeeClaim {
  signature: string;
  amountLamports: string;
  timestamp: string; // ISO 8601
}

export interface UserClaimEvent {
  timestamp: number; // unix seconds
  baseMint: string;
  user: string;
  feeShareConfig: string;
  claimedLamports: bigint;
}

// Layout after tag + discriminator: timestamp i64, base_mint, quote_mint, user, fee_share_config,
// fee_share_authority (pubkeys), claimer_index u32, claimed u64, is_forced bool
export function decodeUserClaimEvent(data: Uint8Array): UserClaimEvent | null {
  const buf = Buffer.from(data);
  if (
    buf.length < 16 + 8 + 32 * 5 + 4 + 8 + 1 ||
    !buf.subarray(0, 8).equals(ANCHOR_EVENT_IX_TAG) ||
    !buf.subarray(8, 16).equals(USER_CLAIM_EVENT_DISCRIMINATOR)
  ) {
    return null;
  }
  const key = (offset: number) => new PublicKey(buf.subarray(offset, offset + 32)).toBase58();
  return {
    timestamp: Number(buf.readBigInt64LE(16)),
    baseMint: key(24),
    user: key(88),
    feeShareConfig: key(120),
    claimedLamports: buf.readBigUInt64LE(188),
  };
}

/**
 * A claim by `charityWallet` of its fee share for `mint`, read from a transaction.
 * Counts only transactions signed by the charity wallet that run the Bags fee-share
 * ClaimUser instruction; the amount comes from the program's claim event, never
 * from balance changes. Anything else (swaps, creator claims) returns null.
 */
export function claimFromTransaction(
  tx: VersionedTransactionResponse,
  mint: string,
  charityWallet: string
): FeeClaim | null {
  const signature = tx.transaction.signatures[0];
  if (!tx.meta || tx.meta.err || !isValidTxSignature(signature)) return null;

  const message = tx.transaction.message;
  const keys = message.version === 0
    ? message.getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses })
    : message.getAccountKeys();
  const keyAt = (index: number) => keys.get(index)?.toBase58();
  const isFeeShareProgram = (index: number) => keyAt(index) === BAGS_FEE_SHARE_V2_PROGRAM_ID.toBase58();

  const signers = Array.from({ length: message.header.numRequiredSignatures }, (_, i) => keyAt(i));
  if (!signers.includes(charityWallet)) return null;

  const runsClaimUser = message.compiledInstructions.some(
    (ix) => isFeeShareProgram(ix.programIdIndex) && Buffer.from(ix.data).subarray(0, 8).equals(CLAIM_USER_IX_DISCRIMINATOR)
  );
  if (!runsClaimUser) return null;

  let claimed = BigInt(0);
  let timestamp: number | null = null;
  for (const group of tx.meta.innerInstructions ?? []) {
    for (const ix of group.instructions) {
      if (!isFeeShareProgram(ix.programIdIndex)) continue;
      const event = decodeUserClaimEvent(bs58.decode(ix.data));
      if (event && event.user === charityWallet && event.baseMint === mint) {
        claimed += event.claimedLamports;
        timestamp = event.timestamp;
      }
    }
  }
  if (timestamp === null || claimed === BigInt(0)) return null;

  return { signature, amountLamports: claimed.toString(), timestamp: new Date(timestamp * 1000).toISOString() };
}

// Bags docs give timestamp as ISO 8601; the SDK types it as a number, so accept both
function claimEventTime(value: unknown): string | null {
  const date = typeof value === "number"
    ? new Date(value < 1e12 ? value * 1000 : value)
    : typeof value === "string" ? new Date(value) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString() : null;
}

// Primary source: Bags GET /fee-share/token/claim-events, filtered to the charity wallet
async function claimsFromBags(mint: string, charityWallet: string): Promise<FeeClaim[]> {
  const claims: FeeClaim[] = [];
  for (let page = 0; page < MAX_CLAIM_EVENT_PAGES; page++) {
    const events = await withTimeout(
      getBagsSDK().state.getTokenClaimEvents(new PublicKey(mint), {
        limit: CLAIM_EVENTS_PAGE_SIZE,
        offset: page * CLAIM_EVENTS_PAGE_SIZE,
      }),
      "Bags claim events lookup"
    );
    if (!Array.isArray(events)) throw new Error("Unexpected claim events response from Bags API");

    for (const event of events) {
      if (event.wallet !== charityWallet) continue;
      const timestamp = claimEventTime(event.timestamp);
      if (!isValidTxSignature(event.signature) || !/^\d+$/.test(String(event.amount)) || !timestamp) {
        console.warn(`Skipping malformed Bags claim event for ${mint}: ${event.signature}`);
        continue;
      }
      claims.push({ signature: event.signature, amountLamports: String(event.amount), timestamp });
    }
    if (events.length < CLAIM_EVENTS_PAGE_SIZE) return claims;
  }
  console.warn(`Bags claim events for ${mint} exceed ${MAX_CLAIM_EVENT_PAGES} pages; list is truncated`);
  return claims;
}

// Confirmed transactions never change, so each one is only fetched and decoded once
const txClaimCache = new Map<string, FeeClaim | null>();

// Fallback: scan the token's fee config history on Solana RPC
async function claimsFromRpc(mint: string, charityWallet: string, feeConfigAddress: string): Promise<FeeClaim[]> {
  const connection = getConnection();
  const signatures = await withTimeout(
    connection.getSignaturesForAddress(new PublicKey(feeConfigAddress), { limit: MAX_FEE_CONFIG_SIGNATURES }),
    "Fee config history lookup"
  );
  const claims: FeeClaim[] = [];
  for (const { signature, err } of signatures) {
    if (err) continue;
    const cacheKey = `${signature}:${mint}:${charityWallet}`;
    if (!txClaimCache.has(cacheKey)) {
      const tx = await withTimeout(
        connection.getTransaction(signature, { maxSupportedTransactionVersion: 0, commitment: "confirmed" }),
        "Claim transaction lookup"
      );
      if (!tx) continue; // Not available yet; try again on the next scan
      txClaimCache.set(cacheKey, claimFromTransaction(tx, mint, charityWallet));
      await new Promise((resolve) => setTimeout(resolve, RPC_FETCH_PAUSE_MS));
    }
    const claim = txClaimCache.get(cacheKey);
    if (claim) claims.push(claim);
  }
  return claims;
}

export interface TokenCharityShare {
  mint: string;
  available: boolean;
  feeConfigAddress: string | null;
  charityWallet: string | null;
  charityBps: number | null;
  lifetimeFeesLamports: string | null;
  charityEarnedLamports: string | null;
  claimsAvailable: boolean;
  claimsSource: "bags" | "rpc" | null;
  claims: FeeClaim[];
}

const shareCache = new Map<string, { expires: number; value: TokenCharityShare }>();
const inFlight = new Map<string, Promise<TokenCharityShare>>();

/**
 * Charity share of a token's Bags.fm fees = lifetime fees (Bags API, lamports)
 * x the charity BPS in the token's on-chain fee config, plus the charity wallet's verified
 * on-chain fee claims. Never throws: on any failure it logs and returns available: false
 * and/or claimsAvailable: false. Results are cached for 10 minutes.
 */
export async function getTokenCharityShare(mint: string, creatorWallet: string): Promise<TokenCharityShare> {
  const cached = shareCache.get(mint);
  if (cached && cached.expires > Date.now()) return cached.value;

  // Share one lookup between concurrent requests on a cold cache
  let pending = inFlight.get(mint);
  if (!pending) {
    pending = fetchTokenCharityShare(mint, creatorWallet).finally(() => inFlight.delete(mint));
    inFlight.set(mint, pending);
  }
  return pending;
}

async function fetchTokenCharityShare(mint: string, creatorWallet: string): Promise<TokenCharityShare> {
  const value: TokenCharityShare = {
    mint,
    available: false,
    feeConfigAddress: null,
    charityWallet: null,
    charityBps: null,
    lifetimeFeesLamports: null,
    charityEarnedLamports: null,
    claimsAvailable: false,
    claimsSource: null,
    claims: [],
  };

  let split: Awaited<ReturnType<typeof readOnChainSplit>> = null;
  try {
    split = await readOnChainSplit(mint, creatorWallet);
    if (!split) throw new Error("On-chain fee config not found or not in the expected shape");
    value.feeConfigAddress = split.feeConfigAddress;
    value.charityWallet = split.charityWallet;
    value.charityBps = split.charityBps;
  } catch (error) {
    console.error(`Charity fee config lookup failed for ${mint}:`, error instanceof Error ? error.message : error);
  }

  if (split) {
    await Promise.all([loadEarned(value, split.charityBps), loadClaims(value, split.charityWallet, split.feeConfigAddress)]);
  }

  shareCache.set(mint, {
    expires: Date.now() + (value.available || value.claimsAvailable ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS),
    value,
  });
  return value;
}

async function loadEarned(value: TokenCharityShare, charityBps: number): Promise<void> {
  const mint = value.mint;
  try {
    if (!isConfigured()) throw new Error("BAGS_API_KEY is not configured");
    const lifetimeFees = await withTimeout(
      getBagsSDK().state.getTokenLifetimeFees(new PublicKey(mint)),
      "Bags lifetime fees lookup"
    );
    if (!Number.isSafeInteger(lifetimeFees) || lifetimeFees < 0) {
      throw new Error(`Unexpected lifetime fees value from Bags API: ${lifetimeFees}`);
    }
    value.lifetimeFeesLamports = String(lifetimeFees);
    value.charityEarnedLamports = charityShareLamports(BigInt(lifetimeFees), charityBps).toString();
    value.available = true;
  } catch (error) {
    console.error(`Charity share lookup failed for ${mint}:`, error instanceof Error ? error.message : error);
  }
}

// Claims by the charity wallet: Bags API first, Solana RPC if the key or API is unavailable
async function loadClaims(value: TokenCharityShare, charityWallet: string, feeConfigAddress: string): Promise<void> {
  const mint = value.mint;
  try {
    if (!isConfigured()) throw new Error("BAGS_API_KEY is not configured");
    value.claims = await claimsFromBags(mint, charityWallet);
    value.claimsSource = "bags";
    value.claimsAvailable = true;
    return;
  } catch (error) {
    console.warn(`Bags claim events unavailable for ${mint}, using Solana RPC:`, error instanceof Error ? error.message : error);
  }
  try {
    value.claims = await claimsFromRpc(mint, charityWallet, feeConfigAddress);
    value.claimsSource = "rpc";
    value.claimsAvailable = true;
  } catch (error) {
    console.error(`Fee claim lookup failed for ${mint}:`, error instanceof Error ? error.message : error);
  }
}
