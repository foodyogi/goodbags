import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { registerRetiredCharityEmailRoutes, CHARITY_EMAIL_APPROVAL_RETIRED } from "../server/retired-routes";
import {
  EMAIL_VERIFICATION_TTL_MS,
  createEmailVerificationToken,
  isEmailVerificationTokenExpired,
  issueEmailVerification,
  registerResendVerificationRoute,
  type ResendRouteDeps,
} from "../server/charity-verification";
import { sendCharityVerificationEmail, type EmailClient } from "../server/email-service";

const ROUTES = readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");

function listen(app: express.Express): Promise<Server> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}
const url = (server: Server, path: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`;

// ---- Part 1: email-based coin approval is gone ----

let retiredServer: Server;
before(async () => {
  const app = express();
  app.use(express.json());
  registerRetiredCharityEmailRoutes(app);
  retiredServer = await listen(app);
});
after(() => retiredServer.close());

for (const [method, path] of [
  ["GET", "/api/charity/tokens?email=charity@example.org"],
  ["GET", "/api/charity/tokens/pending?email=charity@example.org"],
  ["POST", "/api/charity/tokens/abc/approve"],
  ["POST", "/api/charity/tokens/abc/deny"],
] as const) {
  test(`${method} ${path.split("?")[0]} no longer accepts an email as proof`, async () => {
    const res = await fetch(url(retiredServer, path), {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify({ charityEmail: "charity@example.org", note: "ok" }) : undefined,
    });
    assert.equal(res.status, 410);
    const body = await res.json();
    assert.equal(body.error, CHARITY_EMAIL_APPROVAL_RETIRED);
    assert.ok(!("tokens" in body) && !("token" in body));
  });
}

test("no route still authorizes coin approval by charity email, and the admin route is unchanged", () => {
  assert.ok(!ROUTES.includes("getTokensByCharityEmail"));
  assert.ok(!/app\.(get|post)\("\/api\/charity\/tokens/.test(ROUTES), "old email routes still defined in routes.ts");
  const admin = ROUTES.slice(ROUTES.indexOf('app.post("/api/admin/tokens/:mintAddress/approve"'));
  assert.ok(admin.length > 0, "admin approval route missing");
  assert.match(admin.slice(0, 400), /isAdminAuthorized\(adminSecret\)/);
  const portal = ROUTES.slice(ROUTES.indexOf('app.post("/api/charity-portal/approve"'));
  assert.match(portal.slice(0, 2500), /charityHandle !== userHandle/);
});

test("no client page calls the retired email routes", () => {
  const page = readFileSync(new URL("../client/src/pages/charity-token-approval.tsx", import.meta.url), "utf8");
  assert.ok(!page.includes("/api/charity/tokens"));
});

// ---- Part 2: email verification ----

test("verification tokens expire after 24 hours, and old-format tokens count as expired", () => {
  const now = Date.UTC(2026, 10, 18);
  const token = createEmailVerificationToken(now);
  assert.match(token, /^\d{13}\.[0-9a-f]{64}$/);
  assert.equal(isEmailVerificationTokenExpired(token, now), false);
  assert.equal(isEmailVerificationTokenExpired(token, now + EMAIL_VERIFICATION_TTL_MS - 1), false);
  assert.equal(isEmailVerificationTokenExpired(token, now + EMAIL_VERIFICATION_TTL_MS), true);
  assert.equal(isEmailVerificationTokenExpired("a".repeat(64), now), true); // pre-1.0.9 token
  assert.equal(isEmailVerificationTokenExpired("garbage", now), true);
});

test("the apply route never returns the verification link or token", () => {
  assert.ok(!ROUTES.includes("verificationUrl"));
  const apply = ROUTES.slice(ROUTES.indexOf('app.post("/api/charities/apply"'), ROUTES.indexOf('app.get("/api/charities/verify/email/:token"'));
  assert.ok(!/emailToken[,\s]*$/m.test(apply.slice(apply.indexOf("res.json({"))));
});

test("issueEmailVerification saves the token, emails the link and returns only emailSent", async () => {
  let saved = "";
  let sentLink = "";
  const result = await issueEmailVerification({
    saveToken: async (token) => { saved = token; },
    sendEmail: async (link) => { sentLink = link; return { success: true }; },
  });
  assert.deepEqual(result, { emailSent: true });
  assert.ok(sentLink.endsWith(`/verify/email/${encodeURIComponent(saved)}`));
});

test("if sending fails the application is still saved and emailSent is false", async () => {
  let saved = false;
  const failed = await issueEmailVerification({
    saveToken: async () => { saved = true; },
    sendEmail: async () => ({ success: false, error: "Email service not configured" }),
  });
  assert.equal(saved, true);
  assert.deepEqual(failed, { emailSent: false });
  const threw = await issueEmailVerification({
    saveToken: async () => { throw new Error("db down"); },
    sendEmail: async () => ({ success: true }),
  });
  assert.deepEqual(threw, { emailSent: false });
});

test("sendCharityVerificationEmail uses the Resend client and never throws", async () => {
  const sent: { to: unknown; text?: string }[] = [];
  const ok: EmailClient = { emails: { send: (async (payload: any) => { sent.push(payload); return { data: { id: "1" }, error: null }; }) as any } };
  const data = { charityName: "Test Org", charityEmail: "org@example.org", verificationLink: "https://goodbags.tech/verify/email/x" };
  assert.deepEqual(await sendCharityVerificationEmail(data, ok), { success: true });
  assert.equal(sent[0].to, "org@example.org");
  assert.ok(sent[0].text?.includes(data.verificationLink));

  const rejected: EmailClient = { emails: { send: (async () => ({ data: null, error: { message: "bad domain" } })) as any } };
  assert.deepEqual(await sendCharityVerificationEmail(data, rejected), { success: false, error: "bad domain" });

  const throwing: EmailClient = { emails: { send: (async () => { throw new Error("network"); }) as any } };
  assert.equal((await sendCharityVerificationEmail(data, throwing)).success, false);

  const savedKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal((await sendCharityVerificationEmail(data)).success, false);
  if (savedKey) process.env.RESEND_API_KEY = savedKey;
});

// ---- Resend route, with storage, email and rate limiting mocked ----

async function resendServer(overrides: Partial<ResendRouteDeps> = {}) {
  const calls = { rateLimited: 0, saved: [] as string[], sent: [] as string[] };
  const app = express();
  registerResendVerificationRoute(app, {
    getCharity: async (id) =>
      id === "pending" ? { id, name: "Pending Org", email: "org@example.org", emailVerifiedAt: null }
      : id === "done" ? { id, name: "Done Org", email: "done@example.org", emailVerifiedAt: new Date() }
      : undefined,
    saveToken: async (_id, token) => { calls.saved.push(token); },
    sendEmail: async (_to, link) => { calls.sent.push(link); return { success: true }; },
    rateLimit: (_req, _res, next) => { calls.rateLimited++; next(); },
    ...overrides,
  });
  return { server: await listen(app), calls };
}

test("resend route is rate limited, emails a fresh link and never returns it", async () => {
  const { server, calls } = await resendServer();
  try {
    const res = await fetch(url(server, "/api/charities/pending/resend-verification"), { method: "POST" });
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.equal(calls.rateLimited, 1);
    assert.equal(calls.saved.length, 1);
    assert.ok(!text.includes(calls.saved[0]) && !text.includes("/verify/email/") && !text.includes("org@example.org"));

    const again = await fetch(url(server, "/api/charities/pending/resend-verification"), { method: "POST" });
    assert.equal(again.status, 429); // per-charity cooldown

    assert.equal((await fetch(url(server, "/api/charities/done/resend-verification"), { method: "POST" })).status, 400);
    assert.equal((await fetch(url(server, "/api/charities/missing/resend-verification"), { method: "POST" })).status, 404);
  } finally {
    server.close();
  }
});

test("resend route reports a failed send with 503", async () => {
  const { server } = await resendServer({ sendEmail: async () => ({ success: false, error: "down" }) });
  try {
    const res = await fetch(url(server, "/api/charities/pending/resend-verification"), { method: "POST" });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).emailSent, false);
  } finally {
    server.close();
  }
});
