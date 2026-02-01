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
