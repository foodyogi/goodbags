# GoodBags - Charity fundraising, built into the token

## Overview
GoodBags is charity fundraising infrastructure on Solana. Users launch coins on Bags.fm with a charity's share written into the on-chain fee split. A coin can be launched only for a charity that has completed onboarding (a confirmed X handle or a Solana wallet; shared rule `isCharityOnboarded` in `shared/charities.ts`). Charities onboard through the application, which verifies a US nonprofit's EIN through Every.org. The charity directory also lists nonprofits from public records that have not joined GoodBags. Charities can endorse or deny coins launched in their name. Since Bags.fm's September 2026 change, the fee-config payer (the creator) receives 25% of a new coin's shared fees as deployer and the GoodBags split covers the other 75%, so the charity gets 56.25% to 71.25% of shared fees depending on the creator's donation tier, the FYI buyback 3.75% and the creator 40% to 25%. Coins launched before the change keep their original split (75% charity, 5% buyback, 20% creator). The tier table lives in `shared/feeSplit.ts`. Public pages show charity share earned (Bags.fm lifetime fees x each coin's on-chain charity share) and verified on-chain fee claims.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Wouter for routing, and TanStack React Query for state management. UI components use shadcn/ui (Radix UI primitives) and Tailwind CSS, supporting dark/light modes. React Hook Form with Zod handles forms, and Vite is the build tool.

### Backend
The backend is a Node.js Express.js application in TypeScript (ES modules), providing RESTful JSON API endpoints. It uses Drizzle ORM with PostgreSQL for data persistence and Zod for schema validation.

### Authentication
Replit Auth is used for user authentication, supporting multiple login providers. Sessions are stored in PostgreSQL. Users can link their Solana wallet addresses, which are verified cryptographically and stored for identity/tracking. Custom display names are supported. The token launch flow requires authentication and wallet connection.

### Solana Integration
Solana integration uses `@solana/wallet-adapter-react` for wallet connections and `@bagsfm/bags-sdk` for token creation. RPC configuration is managed via environment variables, with support for dedicated RPC providers to avoid rate limiting. Mobile wallet connections utilize custom modals and deep links for Phantom and Solflare.

### Data Storage
Data is stored in a PostgreSQL database managed by Drizzle ORM, with key tables for `launched_tokens`, `donations`, `charities`, `audit_logs`, and `buybacks`.

### Design Patterns
The project follows a monorepo structure (`/client`, `/server`, `/shared`) with path aliases. API requests are handled by a centralized `apiRequest` function.

### Security
Security features include wallet validation, server-side charity wallet lookups, enforcement of approved charity statuses, API wallet re-validation, `ADMIN_SECRET` protection for admin endpoints, and rate limiting for public endpoints. All sensitive actions are audit logged.

### Charity Search & Token Approval
A unified charity search system combines local verified charities with the Change API database. An anti-rug pull token approval system requires charities to approve or deny tokens launched in their name. Email notifications are sent to charities upon token launch, with fallbacks for charities without email.

### Charity Approval Portal
A dedicated portal at `/charity-portal` allows charity representatives to review and approve/deny tokens launched in their name. The portal requires X/Twitter OAuth verification to prove identity - the user's X handle must match the charity's registered X handle. Features include:
- Token details display (name, symbol, creator, donation percentages)
- Identity verification via X handle matching
- Terms of Collaboration acceptance before approval
- Optional public endorsement message or denial reason
- Audit logging of all approval/denial decisions
API endpoints: `/api/charity-portal/token` (GET), `/api/charity-portal/approve` (POST), `/api/charity-portal/deny` (POST).

### Token Features
Token image uploads are supported via Replit Object Storage to Google Cloud Storage. A share of fees is reserved for FYI token buybacks, and a buyback service can swap SOL in the buyback wallet for FYI via Jupiter; the buyback share has not been claimed from the fee configs yet, so no buybacks have been executed. Test Mode was removed from the UI in 1.0.5; the server still accepts `isTest=true` launch records, which are excluded from public figures.

### Community & Gamification
The platform includes a Community Impact Tracker displaying token donations and milestones, social share integrations, and an Endorsement Celebration for charity-approved tokens. Gamification features include a Token Leaderboard (Top Givers, Most Traded, Hot Now), Trending Tokens, and Achievement Badges (10 unlockable achievements across various categories). Users have a "My Impact Profile" dashboard to view their launched tokens, aggregate stats, and earned badges.

## External Dependencies

### Blockchain Services
- **Solana RPC**: For blockchain interaction.
- **Bags.fm SDK**: For token creation and management.

### Database
- **PostgreSQL**: Primary data store.

### Third-Party APIs
- **Every.org API**: For verifying US 501(c)(3) nonprofits.
- **Change API**: For charity search and details.
- **Solana Tracker API**: Optional, for searching Bags.fm tokens.
- **Resend**: For sending email notifications.

### Third-Party UI Libraries
- **Radix UI**: UI primitives.
- **Lucide React & React Icons**: Icon libraries.
- **date-fns**: Date manipulation.
- **embla-carousel-react**: Carousel components.
- **react-day-picker**: Calendar and date selection.