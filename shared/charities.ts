/**
 * A charity has completed onboarding when it can be paid: an X handle confirmed to work
 * with Bags.fm, or a Solana wallet. Only onboarded charities can be chosen for a coin.
 * This is the rule the launch form has always used to decide a charity is selectable.
 *
 * Local charities carry walletAddress; Change API search results carry solanaAddress.
 */
export interface CharityOnboardingFields {
  walletAddress?: string | null;
  solanaAddress?: string | null;
  twitterHandle?: string | null;
  xHandleVerified?: boolean | null;
}

export function isCharityOnboarded(charity: CharityOnboardingFields): boolean {
  const hasConfirmedX = !!charity.twitterHandle && charity.xHandleVerified === true;
  return hasConfirmedX || !!charity.walletAddress || !!charity.solanaAddress;
}

export const ONBOARDED_SECTION_TITLE = "Onboarded charities";
export const LISTED_SECTION_TITLE = "Listed, not yet onboarded";
export const LISTED_LABEL = "Listed, not yet onboarded";
export const LISTED_NOTICE =
  "These nonprofits are listed from public records. They have not joined GoodBags or endorsed it. A coin can be launched for a charity only after it completes onboarding.";
