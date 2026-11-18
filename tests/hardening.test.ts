import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { MAX_UPLOAD_BYTES, isServableUpload, uploadRequestError } from "../server/upload-policy";
import { registerObjectStorageRoutes } from "../server/replit_integrations/object_storage/routes";
import { generateApprovalEmailHtml, generateApprovalEmailText } from "../server/email-service";

const ROUTES = readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
const TWITTER_AUTH = readFileSync(new URL("../server/replit_integrations/auth/twitterAuth.ts", import.meta.url), "utf8");

const url = (server: Server, path: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`;

// ---- Uploads ----

test("upload requests: images only (no SVG or HTML), under 10MB, with a name", () => {
  assert.equal(uploadRequestError({ name: "a.png", size: 1000, contentType: "image/png" }), null);
  assert.equal(uploadRequestError({ name: "a.webp", size: MAX_UPLOAD_BYTES, contentType: "image/webp" }), null);
  assert.ok(uploadRequestError({ name: "a.svg", size: 1000, contentType: "image/svg+xml" }));
  assert.ok(uploadRequestError({ name: "a.html", size: 1000, contentType: "text/html" }));
  assert.ok(uploadRequestError({ name: "a.png", size: MAX_UPLOAD_BYTES + 1, contentType: "image/png" }));
  assert.ok(uploadRequestError({ name: "a.png", size: 0, contentType: "image/png" }));
  assert.ok(uploadRequestError({ size: 1000, contentType: "image/png" }));
});

test("stored objects are only served if they are allowed images within the size limit", () => {
  assert.equal(isServableUpload({ contentType: "image/jpeg", size: "2048" }), true);
  assert.equal(isServableUpload({ contentType: "text/html", size: 100 }), false);
  assert.equal(isServableUpload({ contentType: "image/svg+xml", size: 100 }), false);
  assert.equal(isServableUpload({ contentType: "image/png", size: MAX_UPLOAD_BYTES + 1 }), false);
  assert.equal(isServableUpload({}), false);
});

async function uploadServer(signedIn: boolean, objectContentType = "image/png") {
  const calls = { rateLimited: 0, downloaded: 0 };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).isAuthenticated = () => signedIn;
    (req as any).user = signedIn ? { id: "u1" } : undefined;
    next();
  });
  registerObjectStorageRoutes(app, {
    rateLimit: (_req, _res, next) => { calls.rateLimited++; next(); },
    service: {
      getObjectEntityUploadURL: async () => "https://storage.example/upload/abc",
      normalizeObjectEntityPath: () => "/objects/uploads/abc",
      getObjectEntityFile: async () => ({ getMetadata: async () => [{ contentType: objectContentType, size: "100" }] }) as any,
      downloadObject: async (_file: unknown, res: any) => { calls.downloaded++; res.end("img"); },
    } as any,
  });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  return { server, calls };
}

const imageRequest = (server: Server, body: object) =>
  fetch(url(server, "/api/uploads/request-url"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("upload URLs need a signed-in session", async () => {
  const { server, calls } = await uploadServer(false);
  try {
    const res = await imageRequest(server, { name: "a.png", size: 1000, contentType: "image/png" });
    assert.equal(res.status, 401);
    assert.equal(calls.rateLimited, 1);
  } finally {
    server.close();
  }
});

test("signed-in users get an upload URL only for allowed images", async () => {
  const { server } = await uploadServer(true);
  try {
    const ok = await imageRequest(server, { name: "a.png", size: 1000, contentType: "image/png" });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).uploadURL, "https://storage.example/upload/abc");
    assert.equal((await imageRequest(server, { name: "x.html", size: 10, contentType: "text/html" })).status, 400);
    assert.equal((await imageRequest(server, { name: "a.png", size: MAX_UPLOAD_BYTES + 1, contentType: "image/png" })).status, 400);
  } finally {
    server.close();
  }
});

test("objects with a non-image type are not served; images get nosniff and a sandbox CSP", async () => {
  const html = await uploadServer(false, "text/html");
  try {
    const res = await fetch(url(html.server, "/objects/uploads/abc"));
    assert.equal(res.status, 404);
    assert.equal(html.calls.downloaded, 0);
  } finally {
    html.server.close();
  }
  const png = await uploadServer(false, "image/png");
  try {
    const res = await fetch(url(png.server, "/objects/uploads/abc"));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("content-security-policy") ?? "", /sandbox/);
  } finally {
    png.server.close();
  }
});

// ---- Smaller gaps ----

test("/api/auth/debug answers 404 in production", () => {
  const route = TWITTER_AUTH.slice(TWITTER_AUTH.indexOf('app.get("/api/auth/debug"'));
  assert.match(route.slice(0, 300), /NODE_ENV === "production"[\s\S]*status\(404\)/);
});

test("verify-ein no longer reveals an existing application's ID or status", () => {
  const route = ROUTES.slice(ROUTES.indexOf('app.post("/api/charities/verify-ein"'), ROUTES.indexOf('app.post("/api/charities/apply"'));
  assert.ok(!route.includes("existingCharity"));
  assert.ok(!/id: existingByEin\.id/.test(route));
});

test("charity application and verification routes are rate limited, per route", () => {
  for (const route of [
    'app.post("/api/charities/verify-ein", rateLimitMiddleware(',
    'app.post("/api/charities/apply", rateLimitMiddleware(',
    'app.get("/api/charities/verify/email/:token", rateLimitMiddleware(',
    'app.post("/api/charities/verify/wallet", rateLimitMiddleware(',
    'app.get("/api/charities/:id/status", rateLimitMiddleware(',
  ]) {
    assert.ok(ROUTES.includes(route), route);
  }
  assert.ok(ROUTES.includes("${getRateLimitKey(req)}:${req.method}:${req.route?.path ?? req.path}"));
});

test("wallet verification requires a verified email before checking the signature", () => {
  const route = ROUTES.slice(ROUTES.indexOf('app.post("/api/charities/verify/wallet"'));
  const emailCheck = route.indexOf("if (!charity.emailVerifiedAt)");
  const signatureCheck = route.indexOf("nacl.sign.detached.verify");
  assert.ok(emailCheck > 0 && emailCheck < signatureCheck);
});

test("coin-approval email matches the site and links to the X-verified portal", () => {
  const data = {
    charityName: "Food Yoga International",
    charityEmail: "x@example.org",
    tokenName: "<script>alert(1)</script>",
    tokenSymbol: "LEMON",
    tokenMintAddress: "5DQkgq56V81uRfzB4eDLNEQVDFrTRncS57YWa2fjBAGS",
    creatorWallet: "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP",
    approvalLink: "https://goodbags.tech/charity-portal?token=5DQk&charity=food-yoga-international&reauth=true",
  };
  for (const email of [generateApprovalEmailText(data), generateApprovalEmailHtml(data)]) {
    assert.ok(!/memecoin|automatic donation|royalt|—/i.test(email));
    assert.ok(email.includes("Bags.fm fee config"));
    assert.ok(email.includes("claim it on Bags.fm with your X account"));
    assert.ok(email.includes(data.approvalLink));
  }
  const html = generateApprovalEmailHtml(data);
  assert.ok(!html.includes("<script>alert(1)</script>"));
});
