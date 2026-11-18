# GoodBags

**Charity fundraising, built into the token.**

GoodBags is charity fundraising infrastructure on Solana. You launch a coin on Bags.fm with a charity's share written into its fee split. At least 56% of the coin's shared trading fees go to a registered nonprofit, claimed on-chain and checkable by anyone on Solscan.

## How It Works

1. **Pick a verified charity and launch your coin.**
2. **The fee split is written on-chain at launch:** the charity, you as the creator, and a small buyback.
3. **The charity claims its share on Bags.fm,** and every claim is public on Solscan.

## Fee Split

Since Bags.fm's September 2026 change, the wallet that pays for a new coin's fee config (the deployer, which on GoodBags is the creator) receives 25% of the coin's shared fees. The GoodBags split covers the other 75%. Effective shares of a new coin's shared trading fees:

| Creator donates | Charity | Creator (incl. 25% deployer share) | FYI buyback |
|---|---|---|---|
| 0% | 56.25% | 40% | 3.75% |
| 25% | 60% | 36.25% | 3.75% |
| 50% | 63.75% | 32.5% | 3.75% |
| 75% | 67.5% | 28.75% | 3.75% |
| 100% | 71.25% | 25% | 3.75% |

So the charity gets at least 56%, up to 71% if the creator donates their full share. Coins launched before September 2026 keep their original on-chain split (for example 75% charity, 5% buyback, 20% creator). The table is defined once in `shared/feeSplit.ts`.

The buyback share is reserved for FYI token buybacks. None have been executed yet.

## Features

- **Charity directory** - Pick a charity that has completed onboarding; US nonprofits onboard with their EIN, checked through Every.org. Other nonprofits are listed from public records only
- **Charity Endorsements** - Charities can endorse or deny coins launched in their name
- **Verified on-chain fee claims** - Every charity claim is listed with its Solscan transaction
- **Impact Dashboard** - Charity share earned (Bags.fm lifetime fees x each coin's on-chain charity share) and verified fee claims
- **Leaderboards and Achievement Badges** - Based on the same live figures

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Solana, @bagsfm/bags-sdk
- **Auth**: Replit Auth with optional Solana wallet connection

## Links

- **Website**: [goodbags.tech](https://goodbags.tech)
- **X**: [@goodbagstech](https://x.com/goodbagstech)
- **Food Yoga International**: [ffl.org](https://ffl.org)
- **Trading**: [Bags.fm](https://bags.fm)

## License

MIT, as declared in `package.json`.
