import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { logXFailure, rateLimitHeaders, summarizeXErrorBody } from "../server/replit_integrations/auth/x-diagnostics";
import { safeReturnTo } from "../server/replit_integrations/auth/return-to";
import { AUTH_ERROR_MESSAGES } from "../client/src/components/auth-error-banner";

const TWITTER_AUTH = readFileSync(new URL("../server/replit_integrations/auth/twitterAuth.ts", import.meta.url), "utf8");

test("X error bodies keep only the error fields, never tokens", () => {
  const summary = summarizeXErrorBody(JSON.stringify({
    title: "CreditsDepleted",
    detail: "Your enrolled account does not have any credits",
    type: "https://api.x.com/2/problems/credits",
    errors: [{ message: "No credits", code: 402, access_token: "SECRET-A" }],
    access_token: "SECRET-B",
    refresh_token: "SECRET-C",
  }));
  assert.deepEqual(summary, {
    title: "CreditsDepleted",
    detail: "Your enrolled account does not have any credits",
    type: "https://api.x.com/2/problems/credits",
    errors: [{ message: "No credits", code: 402 }],
  });
  assert.ok(!JSON.stringify(summary).includes("SECRET"));

  // OAuth 1.0a responses are form-encoded and can contain the token secret: only the size is kept
  const formBody = "oauth_token=SECRET-T&oauth_token_secret=SECRET-S";
  const form = summarizeXErrorBody(formBody);
  assert.ok(!JSON.stringify(form).includes("SECRET"));
  assert.equal(form.nonJsonBodyBytes, formBody.length);

  assert.deepEqual(summarizeXErrorBody(JSON.stringify({ error: "invalid_request", error_description: "Value passed for the authorization code was invalid." })), {
    error: "invalid_request",
    error_description: "Value passed for the authorization code was invalid.",
  });
});

test("rate limit headers are reported", () => {
  const headers = new Headers({ "x-rate-limit-limit": "75", "x-rate-limit-remaining": "0", "x-rate-limit-reset": "1795000000", authorization: "Bearer SECRET" });
  assert.deepEqual(rateLimitHeaders(headers), { "x-rate-limit-limit": "75", "x-rate-limit-remaining": "0", "x-rate-limit-reset": "1795000000" });
});

test("logXFailure logs step, status, error fields and rate limits without secrets", async () => {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => { lines.push(args.join(" ")); };
  try {
    await logXFailure("User lookup (GET /2/users/me)", new Response(
      JSON.stringify({ title: "Forbidden", detail: "client-not-enrolled", access_token: "SECRET" }),
      { status: 403, statusText: "Forbidden", headers: { "x-rate-limit-remaining": "74" } }
    ));
  } finally {
    console.error = original;
  }
  assert.equal(lines.length, 1);
  assert.match(lines[0], /\[X Login\] User lookup \(GET \/2\/users\/me\) failed/);
  assert.match(lines[0], /"status":403/);
  assert.match(lines[0], /"detail":"client-not-enrolled"/);
  assert.match(lines[0], /"x-rate-limit-remaining":"74"/);
  assert.ok(!lines[0].includes("SECRET"));
});

test("return addresses are relative, on this site, and never carry the error parameter", () => {
  assert.equal(safeReturnTo("/?error=user_fetch_failed"), "/");
  assert.equal(safeReturnTo("/charity-portal?token=abc&charity=fyi&error=x"), "/charity-portal?token=abc&charity=fyi");
  assert.equal(safeReturnTo("/launch"), "/launch");
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "", null, undefined, 42]) {
    assert.equal(safeReturnTo(bad), "/", String(bad));
  }
});

test("login requests only the scopes and fields needed for GET /2/users/me", () => {
  assert.ok(TWITTER_AUTH.includes('scope: "tweet.read users.read"'));
  assert.ok(!TWITTER_AUTH.includes("offline.access"));
  assert.ok(TWITTER_AUTH.includes("?user.fields=profile_image_url`"));
});

test("no raw X response text is logged", () => {
  for (const raw of [/console\.\w+\([^)]*errorText/, /console\.\w+\([^)]*responseText/, /console\.\w+\([^)]*accessResponseText/, /received: \$\{(state|oauth_token)\}/]) {
    assert.ok(!raw.test(TWITTER_AUTH), String(raw));
  }
});

test("every login error code has a user-facing message", () => {
  const codes = new Set([...TWITTER_AUTH.matchAll(/\/\?error=([a-z_]+)/g)].map((m) => m[1]));
  assert.ok(codes.has("user_fetch_failed"));
  for (const code of codes) {
    assert.ok(AUTH_ERROR_MESSAGES[code], code);
  }
  assert.equal(AUTH_ERROR_MESSAGES.user_fetch_failed, "X login didn't complete. Please try again in a few minutes.");
});
