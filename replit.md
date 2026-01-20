# GoodBags - Solana Memecoin Launcher for Social Impact

## Overview
GoodBags is a Solana-based memecoin launcher platform that enables users to create and launch memecoins with built-in charity donations. The platform integrates with Bags.fm and features a comprehensive system for verifying charities, managing donations, and ensuring transparency. Key capabilities include launching tokens tied to over 75 verified charities, an X Account Payout System for charities to claim donations, and an anti-rug pull token approval system where charities endorse tokens launched in their name. The platform charges a 1% fee, split between charity donations (0.75%) and platform operations (0.25%) which fuels an automated token buyback system for FYI tokens. GoodBags aims to provide a secure and transparent way to leverage memecoins for social impact, offering public dashboards for impact tracking and detailed explanations of its mechanisms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and TanStack React Query for state management. UI components are developed using shadcn/ui (based on Radix UI primitives) and styled with Tailwind CSS, supporting dark/light modes. Form handling is managed by React Hook Form with Zod validation. Vite is used as the build tool.

### Backend Architecture
The backend is a Node.js Express.js application written in TypeScript (ES modules). It exposes RESTful JSON API endpoints and uses Drizzle ORM with PostgreSQL for data persistence. Zod is employed for schema validation, integrated with drizzle-zod.

### Solana Integration
The platform integrates with Solana using `@solana/wallet-adapter-react` for wallet connections and `@bagsfm/bags-sdk` for token creation. The Solana network connection is configurable via environment variables, defaulting to Devnet.

### Data Storage
Data is stored in a PostgreSQL database managed by Drizzle ORM. Key tables include `launched_tokens`, `donations`, `charities`, `audit_logs`, and `buybacks`.

### Key Design Patterns
The project follows a monorepo structure with distinct `/client`, `/server`, and `/shared` directories. Path aliases (`@/`, `@shared/`) are used for improved module resolution. API requests are handled by a centralized `apiRequest` function.

### Security Model
Security features include wallet validation using bs58 decoding, server-side charity wallet lookups, enforcement of `APPROVED` charity statuses, re-validation of Change API wallet addresses, and `ADMIN_SECRET` protection for admin endpoints. Rate limiting is applied to public endpoints (e.g., Search: 30 req/min, Token operations: 10 req/min, Charity applications: 5 req/min). All sensitive actions are audit logged.

### Unified Charity Search System
The system combines local verified charities with a broader database from the Change API, allowing users to search and filter charities based on criteria like having an X handle or Solana wallet. Server-side verification is used to prevent wallet spoofing.

### Token Name Duplicate Detection
When users type a token name, a background search checks for existing tokens with similar names:
- Searches local database for GoodBags-launched tokens
- Optionally searches Solana Tracker API for Bags.fm tokens (requires `SOLANA_TRACKER_API_KEY`)
- Debounced at 500ms, minimum 2 characters to trigger search
- Non-blocking warning: users can still launch with duplicate names
- Rate limited to 30 requests/minute

### Token Approval System
This system prevents "rug pulls" by requiring charities to approve (or deny) tokens launched in their name. Charities verify their identity via email and manage token endorsements through a dedicated portal, with an audit trail for all actions.

### Token Image Upload
The token launch form supports image uploads via Replit Object Storage:
- Users can upload PNG, JPG, GIF, or WebP images up to 10MB
- Files are uploaded via presigned URLs to Google Cloud Storage
- Uploaded images are served from `/objects/uploads/...` paths
- Two options available: URL input or file upload

### Automated FYI Buyback System
A core feature where 0.25% of platform fees are automatically used to buy FYI tokens via Jupiter, creating continuous buy pressure. The buybacks are tracked and occur approximately every 60 minutes when a minimum SOL balance is met.

### Test Mode Token Launches
Users can test the token launch flow without connecting a wallet or spending SOL:
- Toggle "Test Mode" in the launch form to simulate the full launch flow
- Test tokens are saved to the database with `isTest=true` and `charityApprovalStatus="not_applicable"`
- Test tokens display a purple "TEST" badge on the dashboard
- Test tokens don't create charity notifications or donation records
- Dashboard includes Live/Test/All filter to view tokens by type
- Test tokens have mock addresses (starting with "TEST") and don't show Solscan links

### Community Features
The platform includes features designed to foster community development for launched tokens:

**Community Impact Tracker** (`client/src/components/community-impact.tsx`)
- Displays total donations per token with compelling visual presentation
- Shows USD equivalent of SOL donations
- Includes donation milestone progress bar (First Steps → Legendary)
- Displays donation count and current milestone status
- "Charity Endorsed" badge appears when token is approved

**Social Share Integration** (`client/src/components/social-share.tsx`)
- Twitter/X share buttons with pre-filled text for sharing tokens
- "See Mentions" button links to Twitter search for token discussions
- Special "Share Endorsement" button for charity-approved tokens
- "Share Impact Milestone" button for celebrating donation achievements

**Endorsement Celebration** (`client/src/components/endorsement-celebration.tsx`)
- Visual celebration display when a charity officially endorses a token
- Animated badge with gradient background for approved tokens
- Clear warning display for denied tokens with reason
- Pending review state showing awaiting charity response

### Gamification & Personalization
The platform includes gamification features to drive engagement and community growth:

**Token Leaderboard** (`client/src/components/token-leaderboard.tsx`)
- Top Givers: Tokens ranked by total charity donations
- Most Traded: Tokens ranked by trading volume
- Hot Now: Algorithm combining recency, activity, and value metrics
- Visual rank badges (gold crown, silver/bronze medals)

**Trending Tokens** (`client/src/components/trending-tokens.tsx`)
- Real-time trending algorithm based on recent activity
- "New" badge for tokens launched within 24 hours
- "Hot" badge for high-activity tokens
- Time-ago display and quick stats

**Achievement Badges** (`client/src/components/achievement-badges.tsx`)
- 10 unlockable achievements with progress tracking
- Categories: Launches (First Launch, Serial Launcher), Donations (Generous Giver, Impact Hero, Legendary Philanthropist), Volume (Volume Driver, Market Maker), Community (Community Builder), Endorsements (Charity Endorsed, Trusted Creator)
- Progress bars for locked achievements showing path to unlock
- Compact view for profile display

**My Impact Profile** (`client/src/pages/my-impact.tsx`)
- Personal dashboard showing all user's launched tokens
- Aggregate stats: tokens launched, SOL donated, volume generated
- Earned achievement badges display
- Shareable profile with Twitter/X integration
- Profile link for sharing impact with community

## External Dependencies

### Blockchain Services
- **Solana RPC**: For interacting with the Solana blockchain.
- **Bags.fm SDK**: For token creation and management functionalities.

### Database
- **PostgreSQL**: The primary relational database for all application data.

### Third-Party APIs
- **Every.org API**: Used for verifying US 501(c)(3) nonprofits by their EIN during charity registration.
- **Change API**: Provides access to a large database of nonprofits for charity search and details.

### Third-Party UI Libraries
- **Radix UI**: Provides accessible and customizable UI primitives.
- **Lucide React & React Icons**: Icon libraries.
- **date-fns**: Utilities for date manipulation and formatting.
- **embla-carousel-react**: For carousel components.
- **react-day-picker**: For calendar and date selection.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `BAGS_API_KEY`: Bags.fm SDK API key.
- `SOLANA_RPC_URL`: Solana RPC endpoint.
- `SESSION_SECRET`: Secret for session encryption.
- `PLATFORM_WALLET_ADDRESS`: Platform wallet for fee collection.
- `BUYBACK_WALLET_PRIVATE_KEY`: Private key for automated FYI buyback swaps.
- `ADMIN_SECRET`: Required for admin endpoints.
- `EVERY_ORG_API_KEY`: API key for Every.org.
- `CHANGE_API_PUBLIC_KEY`, `CHANGE_API_SECRET_KEY`: API keys for Change API.
- `SOLANA_TRACKER_API_KEY`: Optional API key for searching Bags.fm tokens via Solana Tracker.