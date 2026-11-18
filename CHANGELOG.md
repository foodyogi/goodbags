# Changelog

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
