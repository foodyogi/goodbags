# Changelog

## 1.0.11

- Test Mode is back: a "Test launch (no wallet, no transaction, nothing on-chain)" toggle in the launch form runs the whole flow (validation, charity selection, donation tier, effective fee split) as a dry run on `POST /api/tokens/test-launch`, without login or a wallet. It makes no Bags.fm launch call, no Solana transaction, no SOL is spent and nothing is saved. The result screen is marked TEST and shows the fee split the coin would get on-chain; the form keeps its details for a real launch.
- Test launches are never stored, so they can't appear anywhere. The real launch route now rejects `isTest`, and test tokens stored by earlier versions are filtered out of every public list and page (home stats, trending, leaderboard, dashboard, sitemap, charity share and fee claims, creator pages, token pages, charity portal, name search). Tests fail if a test token leaks into any public endpoint.
- The dashboard's Live/Test filter is removed (there are no test tokens to show).
- `/api/charities` falls back to the seeded charity list if the database is unavailable, so the directory and launch form keep working.
- FAQ and How It Works explain Test Mode.

## 1.0.10

- X login diagnostics: every failure point in both X login flows logs the step, HTTP status, X's error fields (title, detail, type, errors, OAuth error and description) and the x-rate-limit-* headers, and a successful login logs the X username. Nothing secret is logged; three existing log lines that could print token secrets, access tokens or state values were replaced.
- X login requests only what GET /2/users/me needs: scopes `tweet.read users.read` (removed the unused `offline.access`) and `user.fields=profile_image_url` (id, name and username are returned by default).
- Login return addresses must be relative paths on this site and never carry an `error` parameter (also closes an open redirect in the OAuth 2.0 callback).
- The home page shows a dismissible message for each X login error code and removes `?error=` from the URL, and the login prompt no longer pops up over it.

## 1.0.9

- Security: approving or denying coins by charity email address is retired. `/api/charity/tokens`, `/api/charity/tokens/pending` and `/api/charity/tokens/:id/approve|deny` now return 410, and the X-verified charity portal is the only way a charity approves or denies a coin. The old `/charity/tokens` page explains the portal instead. Admin approval is unchanged.
- Security: charity email verification now proves access to the email address. The verification link is emailed through Resend and is never returned by the API or shown in the UI. Links expire after 24 hours (expiry is stored inside the token, no schema change), links issued before this release no longer work, and a rate-limited `POST /api/charities/:id/resend-verification` sends a new one. If the email can't be sent, the application is still saved and the applicant is told to use resend later. The application only continues once the server has recorded the verification.
- New `/verify/email/:token` page for the emailed link.
- The server no longer crashes at startup when `RESEND_API_KEY` is not set (the Resend client is created on first use).
- Security: `POST /api/uploads/request-url` requires a signed-in session and is rate limited, and only accepts PNG, JPG, GIF or WebP images up to 10MB. Stored objects are only served if they are one of those image types within the size limit, with `nosniff` and a sandbox Content-Security-Policy, so an upload can't be served as HTML from our domain.
- Security: `/api/auth/debug` returns 404 in production. `/api/charities/verify-ein` no longer reveals an existing application's ID or status. The EIN check, email and wallet verification and status routes are rate limited, and rate limits now count per route instead of sharing one counter per IP across all routes. Wallet verification requires the email to be verified first.
- The coin-approval email describes a charity coin, the charity's share building up in the coin's Bags.fm fee config and being claimed on Bags.fm with its X account, and links to the X-verified charity portal. Coin details are escaped in the HTML email.

## 1.0.8

- Security: public API responses are built from explicit allowlists in one shared module (`shared/public.ts`). Charity responses no longer include email verification tokens, wallet verification nonces, applicant emails, EINs, submitter wallets or internal verification fields; token responses no longer include the charity email or admin anomaly notes; buyback history no longer includes error details.
- `GET /api/charities/:id` only returns approved charities, so applications in progress are no longer public.
- `GET /api/bags/diagnostic` now requires the admin secret (it echoed part of the Bags API key and raw upstream responses). `GET /api/bags/status?test=true` no longer echoes raw RPC errors.
- Tests fail if a public charity response contains a key matching token, nonce, secret or password, or if a public route sends raw rows.

## 1.0.7

- Honest charity directory: one shared onboarding rule (`isCharityOnboarded` in `shared/charities.ts`: a confirmed X handle or a Solana wallet, the rule the launch form already used). The Charities page is now "Charity directory", with "Onboarded charities" (Verified) first and "Listed, not yet onboarded" below, explaining that those nonprofits are listed from public records and have not joined or endorsed GoodBags.
- The launch form only shows onboarded charities and links to the directory instead of listing the not-yet-available ones. The launch API applies the same rule, so a coin can only be launched for an onboarded charity.
- Token pages show "Verified" for a charity only when it is onboarded. "Verified" and "partner" no longer describe the listed charities anywhere on the site.
- Token endorsement box and share text no longer say a coin is "safe" or "legit"; they say who endorsed it (the charity, or the GoodBags team on its behalf, from the approval record) and that an endorsement is not financial advice.
- Buyback page shows the real number of buybacks executed (0) instead of "undefined".
- Food Yoga International: 63 countries, "one of the world's largest plant-based food relief organizations".
- Terms: "charity coins", and the charity share is described as building up in the coin's Bags.fm fee config until the charity claims it.

## 1.0.6

- GoodBags favicon set (favicon.ico 16/32/48, favicon-32x32.png, apple-touch-icon.png, icon-192.png, icon-512.png) and site.webmanifest, replacing the default Replit favicon. New 1200x630 social share image with the GoodBags logo, "Charity fundraising, built into the token." and "goodbags.tech". All generated from the logo by `npm run generate:brand` (script/generate-brand-assets.ts).
- Open Graph and Twitter image tags point to https://goodbags.tech/og-image.png with size, type and alt text; added theme-color and manifest links.
- Real /robots.txt and /sitemap.xml (public routes plus live token pages; static routes only if the database is unavailable).
- FAQPage JSON-LD on the FAQ page, generated from the same questions and answers the page renders.
- The server now starts listening before the charity seed runs, so "/" answers health checks immediately; the seed runs in the background with errors logged.
- replit.md overview updated to the current fee split, charity registration and buyback status.

## 1.0.5

- New homepage narrative: "Charity fundraising, built into the token.", a live proof strip (charity share earned, verified fee claims by Food Yoga International), "Why GoodBags exists" and a 3-step "How it works". Page title, meta description, Open Graph and Twitter tags updated, and JSON-LD (Organization and WebApplication) added.
- Fee figures corrected everywhere for Bags.fm's September 2026 deployer share: on new coins the charity gets 56.25% to 71.25% of shared trading fees, the creator 40% to 25% (including the 25% deployer share) and the FYI buyback 3.75%. The tier table lives in `shared/feeSplit.ts` with tests. Coins launched before the change keep showing their real on-chain split. Percentages are of the coin's shared fees, never "of every trade".
- Launch form shows the effective on-chain split for every donation tier and explains the deployer share. New FAQ entry on coins launched before and after September 2026.
- Removed false or outdated claims: Test Mode (removed from copy and the launch form), "75+ charities across 9 countries" (registration supports US nonprofits verified by EIN through Every.org), automatic FYI buybacks (a share is reserved, none executed yet), referral credits buying FYI, "anti-rug pull protection", instant wallet transfers to charities, and the home "Estimated Buyback Fees" card.
- Achievements, the impact report, My Impact, public profiles, embeddable widgets and the charity approval page now use the live charity share earned and verified fee claims instead of launch-time donation records.
- README: new fee figures, Food Yoga International linked to ffl.org, removed the reference to a missing LICENSE file.
- Removed the unused donation tracker component and all em dashes from site copy.

## 1.0.4

- New "Verified on-chain fee claims": each transaction in which a charity's wallet claimed its share of a token's Bags.fm fees, with exact amount, date and a Solscan "View TX" link. Source is the Bags `GET /fee-share/token/claim-events` endpoint, with a Solana RPC fallback that counts only transactions signed by the charity wallet that run the Bags fee-share ClaimUser instruction, using the amount from the program's claim event. Cached server-side for 10 minutes; nothing is stored in the database.
- Shown on the home stats (next to "Charity share earned"), token pages, the FYI page and the dashboard. Trending, Token Leaderboard, token cards, the dashboard and token-page impact cards now use the same live figures as the home page instead of launch-time "donated" records.
- Removed a hardcoded SOL-to-USD estimate from the token-page impact card.
- Copy: the charity share is now described accurately (75% of the 1% fee, 0.75% of every trade, more if the creator donates their share). The FYI wallet box explains that the charity's share is claimed on-chain through Bags.fm. The hero example charity is now Food Yoga International. goodbags.io and old X handles replaced with goodbags.tech and @goodbagstech.
- 404 page rewritten in the site theme with a link home (removed the developer "add the page to the router" message).

## 1.0.3

- Creator donation tier now reaches the chain: the launch form sends the selected tier to `/api/tokens/config`, which builds the on-chain fee split from it (previously every token launched at 7500/500/2000). Invalid tiers are rejected. Splits always total 10000 BPS and buyback stays 500 BPS. Existing tokens are unchanged.
- Launch records store the split read back from the token's on-chain Bags fee config, so the database matches the chain.
- New "Charity share earned (via Bags.fm, on-chain)" figure on the home stats, token pages and the FYI page: Bags.fm lifetime fees x the charity BPS in each token's on-chain fee config, cached for 10 minutes, with Solscan links to the fee config or charity wallet. Shows "Live data temporarily unavailable" if the data can't be fetched.
- Shared wallet validation (`isValidSolanaPublicKey`: base58, exactly 32 bytes) for charity applications, the charity seed and fee split wallets.
- Juliana's Animal Sanctuary and The Water Project seed wallets removed; both pay out via their X handles.

## 1.0.2

- Food Yoga International charity wallet corrected to the @fflglobal Bags.fm wallet, held in one shared constant (`FYI_CHARITY_WALLET`) used by the partner page and the charity seed.
- Added a disclosure next to the featured $FYI coin explaining which wallet receives its fees.
- Donation transaction links only render for real Solana transaction signatures (shared `isValidTxSignature`). Other records show "Pending on-chain confirmation" and are never labelled "Verified".
- Public donation totals and counts (platform, per token, per creator) only count donations with a real transaction signature. Token counts only include live tokens with a real launch signature, and creator totals exclude test tokens.
- Relabelled figures that are launch-time records, not on-chain totals: "Trading Volume" is now "Launch Buy Volume" and "FYI Buyback Pool" is now "Estimated Buyback Fees".

## 1.0.1

- All Solscan links now point to Solana mainnet (removed `?cluster=devnet`), built from one shared helper (`shared/solana.ts`).
- Fixed the "View FYI Token" link on the buyback page, which used an incorrect FYI mint.
