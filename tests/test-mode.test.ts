import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { effectiveSplitForNewLaunch, DONATION_TIERS } from "../shared/feeSplit";
import { FYI_CHARITY_WALLET } from "../shared/solana";

// Real route handlers with the storage layer stubbed: no database, no API keys
process.env.DATABASE_URL ??= "postgresql://nobody:x@127.0.0.1:1/none";
process.env.SESSION_SECRET ??= "test-session-secret";
delete process.env.BAGS_API_KEY;
delete process.env.RESEND_API_KEY;

const { registerRoutes } = await import("../server/routes");
const { storage } = await import("../server/storage");

const CREATOR = "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP";
const TEST_MINT = "TestLeakMint1111111111111111111111111111111";

function tokenRow(mintAddress: string, isTest: boolean) {
  return {
    id: `id-${mintAddress.slice(0, 6)}`,
    name: isTest ? "Leaky Test" : "Live Coin",
    symbol: isTest ? "LEAK" : "LIVE",
    description: null,
    imageUrl: null,
    mintAddress,
    creatorWallet: CREATOR,
    charityId: "food-yoga-international",
    charityApprovalStatus: isTest ? "not_applicable" : "pending",
    charityApprovalNote: null,
    charityNotifiedAt: null,
    charityRespondedAt: null,
    charityName: "Food Yoga International",
    charityEmail: null,
    charityWebsite: null,
    charityTwitter: null,
    charityFacebook: null,
    initialBuyAmount: "0",
    charityDonated: "0",
    platformFeeCollected: "0",
    tradingVolume: "0",
    transactionSignature: "x",
    launchedAt: new Date("2026-11-18T00:00:00Z"),
    donationCount: 0,
    lastDonationAt: null,
    isTest,
    charityBps: 7500,
    buybackBps: 500,
    creatorBps: 2000,
    donateCreatorShare: false,
    donateCreatorPercent: 0,
    anomalyAcknowledgedAt: null,
    anomalyNotes: null,
  } as any;
}

const fyiCharity = {
  id: "food-yoga-international",
  name: "Food Yoga International",
  status: "verified",
  walletAddress: FYI_CHARITY_WALLET,
  twitterHandle: "fflglobal",
  xHandleVerified: true,
  payoutMethod: "twitter",
  category: "hunger",
} as any;

const writes: string[] = [];
const s = storage as any;

function stubStorage(tokens: any[]) {
  s.getLaunchedTokens = async () => tokens;
  s.getTokensByCreator = async () => tokens;
  s.getLaunchedTokenByMint = async (mint: string) => tokens.find((t) => t.mintAddress === mint);
  s.getDonations = async () => [];
  s.getDashboardStats = async () => ({ totalTokens: 0, totalDonated: "0", totalVolume: "0", totalPlatformFees: "0" });
  s.getTokenImpact = async () => ({ totalDonated: "0", donationCount: 0, recentDonations: [] });
  s.getCharityById = async (id: string) => (id === fyiCharity.id ? fyiCharity : undefined);
  s.getDefaultCharity = async () => fyiCharity;
  s.getLatestTokenApprovalAction = async () => undefined;
  s.seedDefaultCharities = async () => {};
  for (const write of ["createLaunchedToken", "createDonation", "createAuditLog", "updateTokenApprovalStatus"]) {
    s[write] = async () => {
      writes.push(write);
      throw new Error(`${write} must not be called`);
    };
  }
}

let server: Server;
const url = (path: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`;

before(async () => {
  stubStorage([]);
  const app = express();
  app.use(express.json());
  server = createServer(app);
  await registerRoutes(server, app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
});

after(() => server.close());
beforeEach(() => {
  writes.length = 0;
});

// ---- Public endpoints never show test tokens ----

const LIST_ENDPOINTS = [
  "/api/tokens",
  "/api/dashboard",
  "/api/charity-share",
  "/sitemap.xml",
  `/api/tokens/creator/${CREATOR}`,
  `/api/creator/${CREATOR}/impact`,
];

for (const path of LIST_ENDPOINTS) {
  test(`test tokens never appear in ${path}`, async () => {
    // Only the test token is returned by storage, so a leak can't hide behind a live token
    stubStorage([tokenRow(TEST_MINT, true)]);
    const res = await fetch(url(path));
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(!body.includes(TEST_MINT), `${path} leaked the test token`);
    assert.ok(!body.includes("Leaky Test"), `${path} leaked the test token name`);
  });
}

test("live tokens are still listed (the filter only removes test tokens)", async () => {
  stubStorage([tokenRow("LiveMint11111111111111111111111111111111111", false), tokenRow(TEST_MINT, true)]);
  const tokens = await (await fetch(url("/api/tokens"))).json();
  assert.deepEqual(tokens.map((t: any) => t.symbol), ["LIVE"]);
});

for (const path of [`/api/tokens/${TEST_MINT}/impact`, `/api/charity-portal/token?mint=${TEST_MINT}&charity=food-yoga-international`]) {
  test(`a test token's own page is not public: ${path.split("?")[0]}`, async () => {
    stubStorage([tokenRow(TEST_MINT, true)]);
    const res = await fetch(url(path));
    assert.equal(res.status, 404);
  });
}

// ---- Test launch: full dry run, nothing stored ----

const testLaunchBody = {
  name: "My Test Coin",
  symbol: "mytest",
  description: "Trying it out",
  imageUrl: "",
  initialBuyAmount: "0.1",
  charityId: "food-yoga-international",
  charitySource: "local",
};

for (const tier of DONATION_TIERS) {
  test(`test launch (donate ${tier}%) returns a TEST result with the on-chain split and stores nothing`, async () => {
    stubStorage([]);
    const res = await fetch(url("/api/tokens/test-launch"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...testLaunchBody, donateCreatorPercent: tier }),
    });
    assert.equal(res.status, 200);
    const result = await res.json();
    assert.equal(result.isTest, true);
    assert.equal(result.stored, false);
    assert.match(result.token.mintAddress, /^TEST-[0-9A-F]{12}$/);
    assert.equal(result.token.transactionSignature, null);
    assert.equal(result.token.symbol, "MYTEST");
    assert.equal(result.charity.name, "Food Yoga International");
    const expected = effectiveSplitForNewLaunch(tier);
    assert.equal(result.feeSplit.charityPercent, expected.charityPercent);
    assert.equal(result.feeSplit.creatorPercent, expected.creatorPercent);
    assert.equal(result.feeSplit.buybackPercent, expected.buybackPercent);
    assert.deepEqual(writes, []);
  });
}

test("test launch works with the database down, using the seeded charity list", async () => {
  stubStorage([]);
  s.getCharityById = async () => {
    throw new Error("connect ECONNREFUSED");
  };
  const res = await fetch(url("/api/tokens/test-launch"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...testLaunchBody, donateCreatorPercent: 50 }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).charity.id, "food-yoga-international");
});

test("test launch applies the same charity and tier rules as a real launch", async () => {
  stubStorage([]);
  const post = (body: object) =>
    fetch(url("/api/tokens/test-launch"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post({ ...testLaunchBody, donateCreatorPercent: 30 })).status, 400);
  assert.equal((await post({ ...testLaunchBody, charityId: "unicef" })).status, 400);
  s.getCharityById = async () => ({ ...fyiCharity, id: "unicef", walletAddress: null, xHandleVerified: false });
  const notOnboarded = await post({ ...testLaunchBody, charityId: "unicef" });
  assert.equal(notOnboarded.status, 400);
  assert.match((await notOnboarded.json()).error, /onboarding/);
  assert.equal((await post({ ...testLaunchBody, name: "" })).status, 400);
});

test("the real launch route no longer records test tokens", async () => {
  stubStorage([]);
  const res = await fetch(url("/api/tokens/launch"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...testLaunchBody, creatorWallet: CREATOR, mintAddress: TEST_MINT, isTest: true }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(writes, []);
});

test("/api/charities falls back to the seeded list when the database is down", async () => {
  s.getVerifiedCharities = async () => {
    throw new Error("connect ECONNREFUSED");
  };
  const res = await fetch(url("/api/charities"));
  assert.equal(res.status, 200);
  const charities = await res.json();
  const fyi = charities.find((c: any) => c.id === "food-yoga-international");
  assert.equal(fyi.onboarded, true);
  assert.equal(charities.filter((c: any) => c.onboarded).length, 1);
  assert.ok(!JSON.stringify(charities).match(/token|nonce/i));
});

test("the test-launch route can't reach Bags, Solana, the database or email", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../server/test-launch.ts", import.meta.url), "utf8");
  for (const forbidden of ["bags-sdk", "@bagsfm", "@solana/web3.js", "./storage", "./db", "email-service", "charity-fees"]) {
    assert.ok(!source.includes(forbidden), `test-launch.ts imports ${forbidden}`);
  }
});
