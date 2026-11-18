import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Buyback, Charity, LaunchedToken } from "../shared/schema";
import { toPublicBuyback, toPublicCharity, toPublicToken } from "../shared/public";
import { isCharityOnboarded } from "../shared/charities";
import { FYI_CHARITY_WALLET } from "../shared/solana";

const SENSITIVE_KEY = /token|nonce|secret|password/i;

function sensitiveKeys(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => sensitiveKeys(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) => [
      ...(SENSITIVE_KEY.test(key) ? [`${path}.${key}`] : []),
      ...sensitiveKeys(v, `${path}.${key}`),
    ]);
  }
  return [];
}

// A full database row, including every field that must never be public
const charityRow: Charity = {
  id: "food-yoga-international",
  name: "Food Yoga International",
  description: "Plant-based meals",
  category: "hunger",
  website: "https://ffl.org",
  email: "applicant@example.org",
  walletAddress: FYI_CHARITY_WALLET,
  twitterHandle: "fflglobal",
  xHandleVerified: true,
  payoutMethod: "twitter",
  status: "verified",
  source: "manual",
  isDefault: true,
  isFeatured: true,
  logoUrl: null,
  createdBy: "admin-user-id",
  emailVerificationToken: "secret-email-token",
  emailVerifiedAt: new Date(),
  walletVerificationNonce: "secret-wallet-nonce",
  walletVerifiedAt: new Date(),
  verifiedAt: new Date(),
  lastContactedAt: new Date(),
  registrationNumber: "123456789",
  submitterWallet: FYI_CHARITY_WALLET,
  everyOrgId: "every-org-id",
  everyOrgSlug: "slug",
  everyOrgVerified: true,
  everyOrgVerifiedAt: new Date(),
  everyOrgName: "Name",
  everyOrgDescription: "Description",
  everyOrgWebsite: "https://ffl.org",
  everyOrgLogoUrl: null,
  everyOrgIsDisbursable: true,
  changeId: "change-id",
  countryCode: "US",
  countryName: "United States",
  createdAt: new Date(),
  updatedAt: new Date(),
} as Charity;

const tokenRow = {
  id: "t1",
  name: "LEMONAID",
  symbol: "LEMONAID",
  mintAddress: "5DQkgq56V81uRfzB4eDLNEQVDFrTRncS57YWa2fjBAGS",
  creatorWallet: FYI_CHARITY_WALLET,
  charityEmail: "charity@example.org",
  anomalyNotes: "internal admin note",
  anomalyAcknowledgedAt: new Date(),
  charityApprovalNote: "Approved",
} as unknown as LaunchedToken;

test("public charity responses contain no token, nonce, secret or password keys", () => {
  const output = toPublicCharity(charityRow);
  assert.deepEqual(sensitiveKeys(output), []);
  assert.deepEqual(sensitiveKeys([output, { charityInfo: output }]), []);
});

test("public charity responses drop applicant and verification details", () => {
  const output = toPublicCharity(charityRow) as Record<string, unknown>;
  for (const key of [
    "email", "emailVerificationToken", "walletVerificationNonce", "registrationNumber", "submitterWallet",
    "createdBy", "lastContactedAt", "emailVerifiedAt", "walletVerifiedAt", "everyOrgId", "changeId",
  ]) {
    assert.ok(!(key in output), key);
  }
});

test("the onboarded rule still works from public charity data", () => {
  const output = toPublicCharity(charityRow);
  assert.equal(output.onboarded, true);
  assert.equal(isCharityOnboarded(output), true);
  const listed = toPublicCharity({ ...charityRow, walletAddress: null, xHandleVerified: false });
  assert.equal(listed.onboarded, false);
  assert.equal(isCharityOnboarded(listed), false);
});

test("public token responses drop the charity email and admin notes", () => {
  const output = toPublicToken(tokenRow) as Record<string, unknown>;
  assert.ok(!("charityEmail" in output));
  assert.ok(!("anomalyNotes" in output));
  assert.ok(!("anomalyAcknowledgedAt" in output));
  assert.equal(output.hasCharityEmail, true);
  assert.equal(output.mintAddress, tokenRow.mintAddress);
});

test("public buyback history drops error details", () => {
  const output = toPublicBuyback({ id: "b1", errorMessage: "https://rpc.example/?api-key=SECRET failed" } as Buyback) as Record<string, unknown>;
  assert.ok(!("errorMessage" in output));
});

test("public routes never send raw charity, token or buyback rows", () => {
  const routes = readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
  for (const raw of [
    /res\.json\(charit(y|ies)\)/,
    /res\.json\(tokens\)/,
    /res\.json\(buybacks\)/,
    /^\s+tokens,\s*$/m,
    /^\s+tokens: pendingTokens,\s*$\n\s+totalPending/m,
  ]) {
    assert.ok(!raw.test(routes), `raw rows sent by a public route: ${raw}`);
  }
  // Only the admin approve route may still return the raw updated token
  const rawUpdates = [...routes.matchAll(/^\s+token: updated,\s*$/gm)].length;
  assert.equal(rawUpdates, 1);
});
