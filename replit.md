# GoodBags - Solana Memecoin Launcher for Social Impact

## Overview
GoodBags is a Solana-based memecoin launcher platform that enables users to create and launch memecoins with built-in charity donations. The platform integrates with Bags.fm and features a comprehensive system for verifying charities, managing donations, and ensuring transparency. Key capabilities include launching tokens tied to over 75 verified charities, an X Account Payout System for charities to claim donations, and an anti-rug pull token approval system where charities endorse tokens launched in their name. 

Each token has a built-in 1% royalty stream from trading volume, split three ways:
- **0.75% to charity** - Majority of royalties go directly to verified charities
- **0.05% to FYI buyback** - Supports the ecosystem through automated token buybacks
- **0.20% to token creator** - Creators can donate 0%, 25%, 50%, 75%, or 100% to charity

Creators choose their donation tier (0%, 25%, 50%, 75%, or 100%) at launch. Each token stores its fee split in the database (charity_bps, buyback_bps, creator_bps) for historical accuracy.

**Fee Split Module** (`shared/feeSplit.ts`)
All fee calculations use the shared feeSplit module as the single source of truth to prevent drift:
- `BASE_CHARITY_BPS = 7500`, `BASE_BUYBACK_BPS = 500`, `BASE_CREATOR_BPS = 2000`
- `computeFeeSplit(tier)` - Compute BPS values for a donation tier
- `deriveTierFromBps(charity, buyback, creator)` - Derive tier from stored BPS
- `isBpsAnomaly(...)` - Check if BPS sum != 10000
- `getTierLabel(tier)` - Display label for tier

GoodBags aims to provide a secure and transparent way to leverage memecoins for social impact, offering public dashboards for impact tracking and detailed explanations of its mechanisms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and TanStack React Query for state management. UI components are developed using shadcn/ui (based on Radix UI primitives) and styled with Tailwind CSS, supporting dark/light modes. Form handling is managed by React Hook Form with Zod validation. Vite is used as the build tool.

### Backend Architecture
The backend is a Node.js Express.js application written in TypeScript (ES modules). It exposes RESTful JSON API endpoints and uses Drizzle ORM with PostgreSQL for data persistence. Zod is employed for schema validation, integrated with drizzle-zod.

### Authentication System
The platform uses Replit Auth for user authentication, supporting multiple login providers (X/Twitter, Google, GitHub, Apple, email). Key features:

**User Authentication** (`server/replit_integrations/auth/replitAuth.ts`)
- Users login via `/api/login` which redirects to Replit Auth
- Sessions are stored in PostgreSQL with express-session
- User profile available at `/api/auth/user`
- Logout via `/api/logout`

**Backend Wallet Storage** (`server/routes.ts`)
- Users can link their Solana wallet address to their account
- Wallet connection requires cryptographic signature verification
- Endpoints: `GET /api/user/wallet`, `POST /api/user/wallet/connect`, `POST /api/user/wallet/disconnect`
- Backend wallet is for identity/tracking purposes

**Custom Display Name** (`client/src/components/profile-settings-modal.tsx`)
- Users can set a custom display name via "Edit Profile" in the user menu
- Display priority: custom name → @twitterUsername → twitterDisplayName → firstName+lastName → email
- Endpoint: `PATCH /api/user/profile` with `{ displayName: string | null }`
- Max 50 characters, leave empty to show X handle

**Token Launch Flow**
- Unauthenticated users see "Login with X" prompt
- Authenticated users without wallet adapter connected see wallet connect prompt
- Wallet adapter is required for signing transactions (real launches)
- Test Mode bypasses authentication and wallet requirements entirely

**Key Files**
- `client/src/hooks/use-auth.ts` - React hook for auth state
- `client/src/components/user-menu.tsx` - User profile dropdown with wallet status
- `client/src/components/wallet-connection-modal.tsx` - Modal for linking wallet to account
- `shared/models/auth.ts` - Auth-related types
- `shared/schema.ts` - User and session database schemas

### Solana Integration
The platform integrates with Solana using `@solana/wallet-adapter-react` for wallet connections and `@bagsfm/bags-sdk` for token creation. The Solana network connection is configurable via environment variables.

**RPC Configuration**
- Backend uses `SOLANA_RPC_URL` (secret) for server-side Solana operations
- Frontend uses `VITE_SOLANA_RPC_URL` (env var) for client-side wallet operations
- Default: Public mainnet RPC (`api.mainnet-beta.solana.com`) which has strict rate limits
- Recommended: Use a dedicated RPC provider (Helius, QuickNode, Alchemy) for production to avoid 403 rate limit errors
- Error handling: The `formatLaunchError` helper in token-launch-form.tsx detects RPC errors and provides user-friendly messages

**Mobile Wallet Connection** (`client/src/components/wallet-connect-button.tsx`)
- On mobile browsers, the standard wallet adapter modal is bypassed to prevent redirect issues
- Custom mobile wallet selection modal shows Phantom and Solflare options with deep links
- Deep links open wallet apps directly: `phantom://browse/...` and `solflare://browse/...`
- Form data is preserved in URL parameters during the deep link flow
- `client/src/polyfills.ts` blocks unwanted redirects to phantom.app on mobile
- `client/src/lib/solana.tsx` conditionally excludes Phantom adapter on mobile when not installed

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

### Features Documentation
The platform provides comprehensive documentation of all features through:

**Features Summary** (`client/src/components/features-summary.tsx`)
- Displayed on the homepage after the fee transparency section
- Highlights 6 key capabilities with brief descriptions
- Links to the detailed Features page

**Features Page** (`client/src/pages/features.tsx`)
- Comprehensive documentation of all platform capabilities
- Organized into sections: Core Features, Gamification & Engagement, Personal & Social Features, Security & Trust, Advanced Features
- Details 10 achievement badges, leaderboard categories, profile features, and more
- Accessible via header navigation and footer links

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