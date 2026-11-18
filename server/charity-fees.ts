import { PublicKey } from "@solana/web3.js";
import { getBagsSDK, getConnection, getPlatformWallet, isConfigured } from "./bags-sdk";
import {
  charityShareLamports,
  splitFromClaimers,
  type ClaimerSplit,
  type FeeClaimer,
} from "@shared/feeSplit";

// Bags.fm Fee Share V2 program. Each token's fee config is a PDA of
// ["fee_share_config", base mint, quote mint (wSOL)]
const BAGS_FEE_SHARE_V2_PROGRAM_ID = new PublicKey("FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// 8-byte account discriminator + FeeShareConfigHeader (176 bytes, per the SDK's fee-share-v2 IDL)
const CONFIG_HEADER_BYTES = 184;

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

export interface TokenCharityShare {
  mint: string;
  available: boolean;
  feeConfigAddress: string | null;
  charityWallet: string | null;
  charityBps: number | null;
  lifetimeFeesLamports: string | null;
  charityEarnedLamports: string | null;
}

const shareCache = new Map<string, { expires: number; value: TokenCharityShare }>();

/**
 * Charity share of a token's Bags.fm fees = lifetime fees (Bags API, lamports)
 * x the charity BPS in the token's on-chain fee config. Never throws: on any failure
 * it logs and returns available: false. Results are cached for 10 minutes.
 */
export async function getTokenCharityShare(mint: string, creatorWallet: string): Promise<TokenCharityShare> {
  const cached = shareCache.get(mint);
  if (cached && cached.expires > Date.now()) return cached.value;

  const value: TokenCharityShare = {
    mint,
    available: false,
    feeConfigAddress: null,
    charityWallet: null,
    charityBps: null,
    lifetimeFeesLamports: null,
    charityEarnedLamports: null,
  };

  try {
    const split = await readOnChainSplit(mint, creatorWallet);
    if (!split) throw new Error("On-chain fee config not found or not in the expected shape");
    value.feeConfigAddress = split.feeConfigAddress;
    value.charityWallet = split.charityWallet;
    value.charityBps = split.charityBps;

    if (!isConfigured()) throw new Error("BAGS_API_KEY is not configured");
    const lifetimeFees = await withTimeout(
      getBagsSDK().state.getTokenLifetimeFees(new PublicKey(mint)),
      "Bags lifetime fees lookup"
    );
    if (!Number.isSafeInteger(lifetimeFees) || lifetimeFees < 0) {
      throw new Error(`Unexpected lifetime fees value from Bags API: ${lifetimeFees}`);
    }
    value.lifetimeFeesLamports = String(lifetimeFees);
    value.charityEarnedLamports = charityShareLamports(BigInt(lifetimeFees), split.charityBps).toString();
    value.available = true;
  } catch (error) {
    console.error(`Charity share lookup failed for ${mint}:`, error instanceof Error ? error.message : error);
  }

  shareCache.set(mint, {
    expires: Date.now() + (value.available ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS),
    value,
  });
  return value;
}
