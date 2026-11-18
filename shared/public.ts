/**
 * Public (unauthenticated) API shapes. Each serializer copies an explicit allowlist of
 * fields, so new or sensitive columns (verification tokens, nonces, applicant emails,
 * EINs, admin notes, error details) are never exposed by default.
 */
import type { Buyback, Charity, LaunchedToken } from "./schema";
import { isCharityOnboarded } from "./charities";

function pick<T extends object, K extends keyof T>(row: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = row[key];
  return out;
}

// walletAddress is a public payout address (shown with a Solscan link); xHandleVerified is a boolean
export const PUBLIC_CHARITY_FIELDS = [
  "id",
  "name",
  "description",
  "category",
  "website",
  "logoUrl",
  "walletAddress",
  "twitterHandle",
  "xHandleVerified",
  "payoutMethod",
  "status",
  "isDefault",
  "isFeatured",
  "everyOrgVerified",
  "countryCode",
  "countryName",
] as const satisfies readonly (keyof Charity)[];

export type PublicCharity = Pick<Charity, (typeof PUBLIC_CHARITY_FIELDS)[number]> & { onboarded: boolean };

export function toPublicCharity(charity: Charity): PublicCharity {
  return { ...pick(charity, PUBLIC_CHARITY_FIELDS), onboarded: isCharityOnboarded(charity) };
}

// Excludes charityEmail (charity contact details) and the admin-only anomaly fields
export const PUBLIC_TOKEN_FIELDS = [
  "id",
  "name",
  "symbol",
  "description",
  "imageUrl",
  "mintAddress",
  "creatorWallet",
  "charityId",
  "charityApprovalStatus",
  "charityApprovalNote",
  "charityNotifiedAt",
  "charityRespondedAt",
  "charityName",
  "charityWebsite",
  "charityTwitter",
  "charityFacebook",
  "initialBuyAmount",
  "charityDonated",
  "platformFeeCollected",
  "tradingVolume",
  "transactionSignature",
  "launchedAt",
  "donationCount",
  "lastDonationAt",
  "isTest",
  "charityBps",
  "buybackBps",
  "creatorBps",
  "donateCreatorShare",
  "donateCreatorPercent",
] as const satisfies readonly (keyof LaunchedToken)[];

export type PublicToken = Pick<LaunchedToken, (typeof PUBLIC_TOKEN_FIELDS)[number]> & { hasCharityEmail: boolean };

export function toPublicToken(token: LaunchedToken): PublicToken {
  return { ...pick(token, PUBLIC_TOKEN_FIELDS), hasCharityEmail: !!token.charityEmail };
}

// Excludes errorMessage, which can contain RPC URLs or upstream error details
export const PUBLIC_BUYBACK_FIELDS = [
  "id",
  "solAmount",
  "fyiAmount",
  "transactionSignature",
  "status",
  "executedAt",
] as const satisfies readonly (keyof Buyback)[];

export type PublicBuyback = Pick<Buyback, (typeof PUBLIC_BUYBACK_FIELDS)[number]>;

export function toPublicBuyback(buyback: Buyback): PublicBuyback {
  return pick(buyback, PUBLIC_BUYBACK_FIELDS);
}
