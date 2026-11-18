/**
 * Fee Split Module - Single Source of Truth
 * 
 * This module defines the base fee split constants and calculation functions
 * for the 1% royalty stream. All fee split logic should use these functions
 * to prevent drift and ensure consistency across UI and server.
 * 
 * Fee Model:
 * - Total royalty: 1% of trade volume (10000 BPS)
 * - Base split: 0.75% charity (7500 BPS), 0.05% buyback (500 BPS), 0.20% creator (2000 BPS)
 * - Creators can donate 0/25/50/75/100% of their share to charity
 */

// Base BPS constants (out of 10000 = 1% total royalty)
export const BASE_CHARITY_BPS = 7500;
export const BASE_BUYBACK_BPS = 500;
export const BASE_CREATOR_BPS = 2000;
export const TOTAL_FEE_BPS = 10000;

// Valid donation tier percentages
export const DONATION_TIERS = [0, 25, 50, 75, 100] as const;
export type DonationTier = typeof DONATION_TIERS[number];

// Tolerance for snapping to tiers (in percentage points)
const TIER_SNAP_TOLERANCE = 5;

export interface FeeSplit {
  charityBps: number;
  buybackBps: number;
  creatorBps: number;
  donatedCreatorBps: number;
}

/**
 * Compute the fee split for a given donation tier.
 * 
 * @param donatePercent - The percentage of creator's share to donate (0, 25, 50, 75, or 100)
 * @returns The computed BPS values for each recipient
 */
export function computeFeeSplit(donatePercent: DonationTier): FeeSplit {
  // Calculate how much of creator's base share is donated
  const donatedCreatorBps = Math.round((donatePercent / 100) * BASE_CREATOR_BPS);
  
  return {
    charityBps: BASE_CHARITY_BPS + donatedCreatorBps,
    buybackBps: BASE_BUYBACK_BPS, // Fixed, never changes
    creatorBps: BASE_CREATOR_BPS - donatedCreatorBps,
    donatedCreatorBps,
  };
}

/**
 * Resolve the creator's donation tier from a launch request.
 * Missing percent falls back to the legacy donateCreatorShare flag (true = 100%).
 * Returns null for any value that isn't one of DONATION_TIERS, so callers reject it
 * instead of launching with a split the creator didn't pick.
 */
export function resolveDonationTier(
  donatePercent: unknown,
  legacyDonateShare?: unknown
): DonationTier | null {
  if (donatePercent === undefined || donatePercent === null) {
    return legacyDonateShare === true ? 100 : 0;
  }
  if (!DONATION_TIERS.includes(donatePercent as DonationTier)) {
    return null;
  }
  if (donatePercent === 0 && legacyDonateShare === true) {
    return 100; // Legacy toggle was ON = 100% donation
  }
  return donatePercent as DonationTier;
}

export interface FeeClaimer {
  wallet: string;
  bps: number;
}

export interface ClaimerSplit {
  charityWallet: string;
  charityBps: number;
  buybackBps: number;
  creatorBps: number;
}

/**
 * Map the claimers in a token's on-chain Bags fee config back to roles.
 * Launches add the creator, charity and buyback wallets (claimers with 0 BPS are left out),
 * so the charity is the one claimer that is neither the creator nor the buyback wallet.
 * Returns null if the config doesn't have that shape or doesn't total 10000 BPS.
 */
export function splitFromClaimers(
  claimers: FeeClaimer[],
  creatorWallet: string,
  buybackWallet: string
): ClaimerSplit | null {
  const charity = claimers.filter((c) => c.wallet !== creatorWallet && c.wallet !== buybackWallet);
  if (charity.length !== 1) return null;

  const bpsOf = (wallet: string) =>
    claimers.filter((c) => c.wallet === wallet).reduce((sum, c) => sum + c.bps, 0);
  const split = {
    charityWallet: charity[0].wallet,
    charityBps: charity[0].bps,
    buybackBps: bpsOf(buybackWallet),
    creatorBps: bpsOf(creatorWallet),
  };
  const total = split.charityBps + split.buybackBps + split.creatorBps;
  return total === TOTAL_FEE_BPS ? split : null;
}

/**
 * Charity's share of a token's Bags.fm lifetime fees (lamports in, lamports out).
 */
export function charityShareLamports(lifetimeFeesLamports: bigint, charityBps: number): bigint {
  return (lifetimeFeesLamports * BigInt(charityBps)) / BigInt(TOTAL_FEE_BPS);
}

/**
 * Derive the donation tier from stored BPS values.
 * Used for backward compatibility and display purposes.
 * 
 * @param charityBps - Stored charity BPS
 * @param buybackBps - Stored buyback BPS
 * @param creatorBps - Stored creator BPS
 * @returns The donation tier (0-100) or null if values don't match a standard tier
 */
export function deriveTierFromBps(
  charityBps: number | null | undefined,
  buybackBps: number | null | undefined,
  creatorBps: number | null | undefined
): DonationTier | null {
  // Use defaults if null/undefined
  const charity = charityBps ?? BASE_CHARITY_BPS;
  const buyback = buybackBps ?? BASE_BUYBACK_BPS;
  const creator = creatorBps ?? BASE_CREATOR_BPS;
  
  // Derive donated creator BPS from charity BPS
  const donatedCreatorBps = Math.max(0, Math.min(BASE_CREATOR_BPS, charity - BASE_CHARITY_BPS));
  
  // Calculate approximate donation percentage
  const rawDonatePct = (donatedCreatorBps / BASE_CREATOR_BPS) * 100;
  
  // Find the closest tier within tolerance
  for (const tier of DONATION_TIERS) {
    if (Math.abs(rawDonatePct - tier) <= TIER_SNAP_TOLERANCE) {
      // Verify the computed split matches stored values
      const computed = computeFeeSplit(tier);
      if (computed.charityBps === charity && 
          computed.buybackBps === buyback && 
          computed.creatorBps === creator) {
        return tier;
      }
    }
  }
  
  // Values don't match any standard tier
  return null;
}

/**
 * Check if the BPS values represent an anomaly (don't sum to 10000).
 * 
 * @returns true if the sum is not exactly 10000 BPS
 */
export function isBpsAnomaly(
  charityBps: number | null | undefined,
  buybackBps: number | null | undefined,
  creatorBps: number | null | undefined
): boolean {
  const charity = charityBps ?? 0;
  const buyback = buybackBps ?? 0;
  const creator = creatorBps ?? 0;
  const sum = charity + buyback + creator;
  return sum !== TOTAL_FEE_BPS;
}

/**
 * Get display label for a donation tier.
 */
export function getTierLabel(tier: DonationTier | null): string {
  if (tier === null) return "Custom";
  if (tier === 0) return "Keep All";
  if (tier === 100) return "Give All";
  return `${tier}% to Charity`;
}

/**
 * Convert BPS to percentage for display (e.g., 7500 -> 0.75%).
 */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

/**
 * Bags.fm, September 2026: newly created SOL fee-share v2 configs pay the config payer
 * (the deployer) 2,500 BPS of the gross claimers pool, and the configured split divides
 * the remaining 75%. In GoodBags' launch flow the creator pays for the config, so the
 * creator is also the deployer. Configs created before the change keep their old terms.
 */
export const DEPLOYER_SHARE_BPS = 2500;

// The Bags docs only say "September 2026". No GoodBags token launched between
// 2026-02-02 and the change, so the exact day doesn't change how any token is classified.
export const DEPLOYER_SHARE_EFFECTIVE_FROM = "2026-09-01T00:00:00Z";

export function hasDeployerShare(launchedAt: string | Date): boolean {
  return new Date(launchedAt).getTime() >= new Date(DEPLOYER_SHARE_EFFECTIVE_FROM).getTime();
}

/**
 * Effective share of a coin's shared trading fees, in percent.
 * creatorPercent includes the deployer share when the coin has one.
 */
export interface EffectiveSplit {
  charityPercent: number;
  buybackPercent: number;
  creatorPercent: number;
  deployerPercent: number;
}

export function effectiveSplitFromBps(
  charityBps: number,
  buybackBps: number,
  creatorBps: number,
  withDeployerShare: boolean
): EffectiveSplit {
  const deployerBps = withDeployerShare ? DEPLOYER_SHARE_BPS : 0;
  const pool = (bps: number) => ((bps * (TOTAL_FEE_BPS - deployerBps)) / TOTAL_FEE_BPS) / 100;
  return {
    charityPercent: pool(charityBps),
    buybackPercent: pool(buybackBps),
    creatorPercent: pool(creatorBps) + deployerBps / 100,
    deployerPercent: deployerBps / 100,
  };
}

/** Effective split a NEW launch gets on-chain for each creator donation tier. */
export function effectiveSplitForNewLaunch(tier: DonationTier): EffectiveSplit {
  const { charityBps, buybackBps, creatorBps } = computeFeeSplit(tier);
  return effectiveSplitFromBps(charityBps, buybackBps, creatorBps, true);
}

export const NEW_LAUNCH_SPLITS = DONATION_TIERS.map((tier) => ({
  tier,
  ...effectiveSplitForNewLaunch(tier),
}));

/** Lowest and highest charity share for new launches, rounded down for copy ("at least 56%"). */
export const NEW_LAUNCH_MIN_CHARITY_PERCENT = Math.floor(NEW_LAUNCH_SPLITS[0].charityPercent);
export const NEW_LAUNCH_MAX_CHARITY_PERCENT = Math.floor(
  NEW_LAUNCH_SPLITS[NEW_LAUNCH_SPLITS.length - 1].charityPercent
);

/** Format a percentage without trailing zeros: 56.25 -> "56.25%", 40 -> "40%". */
export function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
