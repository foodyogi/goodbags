import type { Express } from "express";

export const SITE_URL = "https://goodbags.tech";

// Public pages listed in the sitemap
export const SITEMAP_STATIC_ROUTES = [
  "/",
  "/how-it-works",
  "/features",
  "/faq",
  "/charities",
  "/food-yoga-international",
  "/buyback",
  "/terms",
];

const TOKEN_LOOKUP_TIMEOUT_MS = 3000;

export interface SitemapToken {
  mintAddress: string;
  launchedAt: Date | string;
}

export const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function buildSitemap(tokens: SitemapToken[]): string {
  const urls = [
    ...SITEMAP_STATIC_ROUTES.map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`),
    ...tokens.map((token) => {
      const lastmod = new Date(token.launchedAt);
      const lastmodTag = isNaN(lastmod.getTime()) ? "" : `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`;
      return `  <url><loc>${SITE_URL}/tokens/${escapeXml(token.mintAddress)}</loc>${lastmodTag}</url>`;
    }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

/**
 * /robots.txt and /sitemap.xml. Register before the SPA catch-all.
 * loadTokens returns live tokens; if it fails or is slow, the sitemap still lists the static routes.
 */
export function registerSeoRoutes(app: Express, loadTokens: () => Promise<SitemapToken[]>): void {
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(ROBOTS_TXT);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    let tokens: SitemapToken[] = [];
    try {
      let timer: NodeJS.Timeout | undefined;
      tokens = await Promise.race([
        loadTokens(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Token lookup timed out")), TOKEN_LOOKUP_TIMEOUT_MS);
        }),
      ]).finally(() => clearTimeout(timer));
    } catch (error) {
      console.error("Sitemap: token lookup failed, listing static routes only:", error instanceof Error ? error.message : error);
    }
    res.type("application/xml").send(buildSitemap(tokens));
  });
}
