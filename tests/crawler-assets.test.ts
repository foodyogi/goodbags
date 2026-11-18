import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { registerSeoRoutes, SITEMAP_STATIC_ROUTES, SITE_URL } from "../server/seo";
import { serveStatic } from "../server/static";
import { buildFaqJsonLd, jsonLdScriptContent } from "../client/src/lib/faq-jsonld";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../client/public");
const LEMONAID = "5DQkgq56V81uRfzB4eDLNEQVDFrTRncS57YWa2fjBAGS";

// Same order as production: SEO routes, then static files and the SPA catch-all
function start(loadTokens: () => Promise<{ mintAddress: string; launchedAt: string }[]>): Promise<Server> {
  const app = express();
  registerSeoRoutes(app, loadTokens);
  serveStatic(app, PUBLIC_DIR);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

let liveServer: Server;
let deadDbServer: Server;
const url = (server: Server, p: string) => `http://127.0.0.1:${(server.address() as AddressInfo).port}${p}`;

before(async () => {
  liveServer = await start(async () => [{ mintAddress: LEMONAID, launchedAt: "2026-02-01T17:12:12.949Z" }]);
  deadDbServer = await start(async () => {
    throw new Error("connect ECONNREFUSED");
  });
});

after(() => {
  liveServer.close();
  deadDbServer.close();
});

const EXPECTED_TYPES: Record<string, RegExp> = {
  "/robots.txt": /^text\/plain/,
  "/sitemap.xml": /^application\/xml/,
  "/favicon.ico": /^image\/(x-icon|vnd\.microsoft\.icon)/,
  "/site.webmanifest": /^application\/manifest\+json/,
  "/og-image.png": /^image\/png/,
  "/apple-touch-icon.png": /^image\/png/,
  "/icon-192.png": /^image\/png/,
  "/icon-512.png": /^image\/png/,
};

for (const [route, type] of Object.entries(EXPECTED_TYPES)) {
  test(`${route} is served with the right content type, not the SPA HTML`, async () => {
    const res = await fetch(url(liveServer, route));
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", type);
    const body = Buffer.from(await res.arrayBuffer());
    assert.ok(!body.toString("utf8", 0, 200).toLowerCase().includes("<!doctype html"), `${route} returned HTML`);
  });
}

test("og-image.png is exactly 1200x630", async () => {
  const png = Buffer.from(await (await fetch(url(liveServer, "/og-image.png"))).arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1200); // IHDR width
  assert.equal(png.readUInt32BE(20), 630); // IHDR height
});

test("robots.txt allows all and points to the sitemap", async () => {
  const text = await (await fetch(url(liveServer, "/robots.txt"))).text();
  assert.match(text, /User-agent: \*\nAllow: \//);
  assert.ok(text.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
});

test("sitemap lists the public routes and live token pages", async () => {
  const xml = await (await fetch(url(liveServer, "/sitemap.xml"))).text();
  for (const route of SITEMAP_STATIC_ROUTES) {
    assert.ok(xml.includes(`<loc>${SITE_URL}${route}</loc>`), route);
  }
  assert.ok(xml.includes(`<loc>${SITE_URL}/tokens/${LEMONAID}</loc><lastmod>2026-02-01</lastmod>`));
});

test("sitemap still returns the static routes when the database is down", async () => {
  const res = await fetch(url(deadDbServer, "/sitemap.xml"));
  assert.equal(res.status, 200);
  const xml = await res.text();
  for (const route of SITEMAP_STATIC_ROUTES) {
    assert.ok(xml.includes(`<loc>${SITE_URL}${route}</loc>`), route);
  }
  assert.ok(!xml.includes("/tokens/"));
});

test("site.webmanifest names GoodBags with dark theme colors and its icons", async () => {
  const manifest = await (await fetch(url(liveServer, "/site.webmanifest"))).json();
  assert.equal(manifest.name, "GoodBags");
  assert.equal(manifest.short_name, "GoodBags");
  assert.equal(manifest.theme_color, "#070708");
  assert.equal(manifest.background_color, "#070708");
  assert.deepEqual(manifest.icons.map((i: { src: string }) => i.src), ["/icon-192.png", "/icon-512.png"]);
});

test("FAQPage JSON-LD mirrors the rendered questions and answers", () => {
  const categories = [
    { questions: [{ question: "What is GoodBags?", answer: "Charity fundraising, built into the token." }] },
    { questions: [{ question: "Q2 <b>", answer: "A2 </script>" }] },
  ];
  const data = buildFaqJsonLd(categories);
  assert.equal(data["@type"], "FAQPage");
  assert.deepEqual(
    data.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
    [["What is GoodBags?", "Charity fundraising, built into the token."], ["Q2 <b>", "A2 </script>"]]
  );
  const script = jsonLdScriptContent(data);
  assert.ok(!script.includes("</script>"));
  assert.deepEqual(JSON.parse(script), data);
});
