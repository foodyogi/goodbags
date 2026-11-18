/**
 * Generates the favicon set, web manifest and social share image from the GoodBags logo.
 * Outputs go to client/public, which Vite serves at the site root.
 *
 * Run: npm run generate:brand
 */
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "client/public");
const LOGO = path.join(ROOT, "attached_assets/goodbags_logo_white_text_tech_green_1769293157780.png");

// Dark theme tokens from client/src/index.css (.dark)
const BACKGROUND = "#070708"; // --background: 240 10% 3%
const CARD = "#0e0e11"; // --card: 240 10% 6%
const PRIMARY = "#b066f2"; // --primary: 271 81% 65%
const SECONDARY = "#41d4c3"; // --secondary: 174 62% 55%
const FOREGROUND = "#fafafa"; // --foreground: 0 0% 98%

// The bag-and-hand mark inside the logo (the wordmark sits below it)
const MARK_CROP = { left: 171, top: 59, width: 400, height: 400 };

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

function mark(size: number): Promise<Buffer> {
  return sharp(LOGO).extract(MARK_CROP).resize(size, size).png().toBuffer();
}

// Mark centred on a dark rounded square; padding keeps it inside maskable-icon safe zones
async function icon(size: number, paddingRatio: number, rounded: boolean): Promise<Buffer> {
  const inner = Math.round(size * (1 - 2 * paddingRatio));
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" fill="${BACKGROUND}"/>
    </svg>`
  );
  return sharp(background)
    .composite([{ input: await mark(inner), gravity: "center" }])
    .png()
    .toBuffer();
}

// ICO container holding PNG images (supported by all current browsers)
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // no palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function ogImage(): Promise<Buffer> {
  // All content stays inside a 120px side / 70px top-bottom safe area, so X's 2:1 and
  // LinkedIn's 1.91:1 crops never cut it
  const markSize = 210;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
      <defs>
        <radialGradient id="glowPrimary" cx="15%" cy="20%" r="55%">
          <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glowSecondary" cx="88%" cy="85%" r="55%">
          <stop offset="0%" stop-color="${SECONDARY}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${SECONDARY}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="${BACKGROUND}"/>
      <rect width="100%" height="100%" fill="url(#glowPrimary)"/>
      <rect width="100%" height="100%" fill="url(#glowSecondary)"/>
      <rect x="40" y="40" width="${OG_WIDTH - 80}" height="${OG_HEIGHT - 80}" rx="28" fill="${CARD}" fill-opacity="0.55"
        stroke="#ffffff" stroke-opacity="0.08"/>
      <g font-family="Helvetica Neue, Helvetica, Arial, DejaVu Sans, sans-serif" text-anchor="middle">
        <text x="600" y="395" font-size="62" font-weight="700" fill="${FOREGROUND}">Charity fundraising,</text>
        <text x="600" y="468" font-size="62" font-weight="700" fill="${PRIMARY}">built into the token.</text>
        <text x="600" y="540" font-size="34" font-weight="500" fill="${SECONDARY}">goodbags.tech</text>
      </g>
    </svg>`
  );
  return sharp(svg)
    .composite([{ input: await mark(markSize), top: 80, left: Math.round((OG_WIDTH - markSize) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const write = (name: string, data: Buffer | string) => writeFile(path.join(OUT, name), data);

  const icoSizes = [16, 32, 48];
  await write(
    "favicon.ico",
    ico(await Promise.all(icoSizes.map(async (size) => ({ size, png: await icon(size, 0.04, true) }))))
  );
  await write("favicon-32x32.png", await icon(32, 0.04, true));
  // iOS adds its own rounded mask and shows transparency as black, so keep it square
  await write("apple-touch-icon.png", await icon(180, 0.1, false));
  await write("icon-192.png", await icon(192, 0.12, false));
  await write("icon-512.png", await icon(512, 0.12, false));

  await write(
    "site.webmanifest",
    JSON.stringify(
      {
        name: "GoodBags",
        short_name: "GoodBags",
        description: "Charity fundraising, built into the token.",
        start_url: "/",
        display: "standalone",
        theme_color: BACKGROUND,
        background_color: BACKGROUND,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      null,
      2
    ) + "\n"
  );

  await write("og-image.png", await ogImage());
  console.log(`Brand assets written to ${path.relative(ROOT, OUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
