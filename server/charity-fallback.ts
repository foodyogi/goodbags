import { CHARITY_STATUS, VETTED_CHARITIES } from "@shared/schema";
import { isCharityOnboarded } from "@shared/charities";
import { isValidSolanaPublicKey } from "@shared/solana";
import type { PublicCharity } from "@shared/public";

/**
 * Public charity list built from the seed in code (the same list the database is seeded
 * from). Used only when the database is unavailable, so the directory and the launch form
 * keep working. X handles are not marked confirmed here, so only charities with a wallet
 * in the seed count as onboarded.
 */
export function seedPublicCharities(): PublicCharity[] {
  return VETTED_CHARITIES.map((seed, index) => {
    const walletAddress = isValidSolanaPublicKey(seed.wallet) ? seed.wallet : null;
    return {
      id: seed.id,
      name: seed.name,
      description: seed.description,
      category: seed.category,
      website: seed.website,
      logoUrl: null,
      walletAddress,
      twitterHandle: seed.twitterHandle,
      xHandleVerified: false,
      payoutMethod: seed.payoutMethod,
      status: CHARITY_STATUS.APPROVED,
      isDefault: index === 0,
      isFeatured: index < 10,
      everyOrgVerified: false,
      countryCode: seed.countryCode,
      countryName: seed.countryName,
      onboarded: isCharityOnboarded({ walletAddress, twitterHandle: seed.twitterHandle, xHandleVerified: false }),
    };
  });
}
