# GoodBags - Solana Memecoin Launcher for Social Impact

## Overview

GoodBags (goodbags.io) is a Solana-based memecoin launcher platform powered by Bags.fm that enables users to create and launch their own memecoins with built-in charity donations. Token creators choose their own impact cause during launch, selecting from verified charities across categories like hunger, environment, education, health, animals, disaster relief, and community.

### Key Features
- **Multi-charity system**: Creators choose their cause from verified charities by category
- **Automated charity verification**: 3-step verification process (email + wallet signature + admin approval)
- **Fee structure**: 1% total fee split: 0.75% to charity + 0.25% platform fee for FYI buyback
- **Impact Dashboard**: Track donations with blockchain-verified transparency
- **Security**: Only verified charities can receive donations (enforced server-side)
- **Audit logging**: All charity submissions and token launches tracked for compliance
- **Maximum Transparency**: Public pages for verified charities, buyback activity, and how the platform works

### Public Transparency Pages
- `/` - Homepage with live impact stats (auto-refreshing every 30s) and fee breakdown
- `/ffl` - Dedicated page for Food Yoga International (founding partner charity)
- `/charities` - Public list of all verified charities with Solscan verification links
- `/buyback` - FYI Token Buyback Dashboard showing all buyback transactions
- `/how-it-works` - Complete explanation of the platform, fee distribution, and security features
- `/dashboard` - All launched tokens with trading volume and donation stats

### Charity Verification Workflow (5-Step Wizard)
1. **EIN Verification** (`/charities/apply`): Charity enters EIN (Tax ID), verified against Every.org API
2. **Organization Info**: Pre-filled form with Every.org data, user adds category and email
3. **Email Verification**: Verify ownership of charity email domain
4. **Wallet Setup & Verification**: Connect Solana wallet (with Phantom/Solflare guidance) and sign message to prove ownership
5. **Admin Approval**: GoodBags admin reviews and approves (`/admin/charities`)
6. **Active**: Charity appears in token launch dropdown

### Change API Integration (Primary)
- **Purpose**: Access 1.3M+ verified nonprofits with pre-existing Solana wallets
- **API Endpoints**:
  - `GET /api/charities/change/search?q={query}` - Search nonprofits
  - `GET /api/charities/change/:id` - Get nonprofit details with Solana address
- **Data Retrieved**: Organization name, mission, category, logo, Solana wallet address
- **Security**: Server-side verification against Change API prevents wallet spoofing
- **UI**: Token launch form includes searchable dropdown showing all nonprofits with "Crypto Ready" or "No Wallet" badges
- **Environment Variables**: `CHANGE_API_PUBLIC_KEY`, `CHANGE_API_SECRET_KEY`
- **Note**: Most nonprofits don't have Solana wallets yet - only those with wallets can be selected for token launches

### Every.org Integration (Backup/Custom Charities)
- **Purpose**: Verify US 501(c)(3) nonprofits by their EIN for custom charity registration
- **API Endpoint**: `POST /api/charities/verify-ein` validates EIN against Every.org database
- **Data Retrieved**: Organization name, description, website, logo, disbursable status
- **Security**: Server-side re-verification in `/api/charities/apply` prevents client bypassing
- **Status Flow**: EIN_VERIFIED → EMAIL_VERIFIED → WALLET_VERIFIED → PENDING → APPROVED
- **Use Case**: For charities not on Change API or without Solana wallets who want to join the platform

### Security Model
- Charity wallets are looked up server-side from vetted database (prevents fee diversion)
- Only `APPROVED` status charities can be used for token launches
- All wallet addresses validated before on-chain operations
- Admin endpoints protected by ADMIN_SECRET environment variable

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark/light mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON API endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Validation**: Zod for request/response validation with drizzle-zod integration

### Solana Integration
- **Wallet Connection**: @solana/wallet-adapter-react with modal UI
- **Network**: Configurable via VITE_SOLANA_RPC_URL environment variable, defaults to Devnet
- **Token SDK**: @bagsfm/bags-sdk for token creation functionality
- **Polyfills**: Buffer polyfill for browser compatibility with Solana libraries

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Tables**:
  - `launched_tokens`: Stores token metadata, mint addresses, creator info, charity selection, and statistics
  - `donations`: Tracks blockchain-verified charity donations with transaction signatures
  - `charities`: Registry of charities with verification status, wallet addresses, and categories
  - `audit_logs`: Security and compliance tracking for charity submissions and token launches
  - `buybacks`: Tracks automated FYI token buyback transactions
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod schemas

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory
- **API Request Pattern**: Centralized `apiRequest` function handles fetch with error handling
- **Component Organization**: Feature components at root of components folder, UI primitives in `/components/ui`

### Build and Development
- **Development**: Vite dev server with HMR, Express serves API routes
- **Production Build**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Database Migrations**: Drizzle Kit with `db:push` command for schema synchronization

## External Dependencies

### Blockchain Services
- **Solana RPC**: Connects to Solana network (Devnet by default, configurable via environment)
- **Bags.fm SDK**: Token creation and management on Solana

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `BAGS_API_KEY`: Bags.fm SDK API key for token creation (required for real launches)
- `SOLANA_RPC_URL`: Solana RPC endpoint URL
- `SESSION_SECRET`: Session encryption secret
- `PLATFORM_WALLET_ADDRESS`: Platform wallet for fee collection (set to buyback wallet)
- `BUYBACK_WALLET_PRIVATE_KEY`: Private key for automated FYI buyback swaps
- `ADMIN_SECRET`: Required in production for admin endpoints
- `EVERY_ORG_API_KEY`: Every.org API key for nonprofit EIN verification (get from https://www.every.org/developer)

### Token Launch Flow
The token launch process uses a multi-step flow with wallet signing:
1. **POST /api/tokens/prepare**: Creates token metadata via Bags SDK
2. **POST /api/tokens/config**: Creates fee share config with splits (Creator 98.75%, Charity 1%, Platform 0.25%)
3. **POST /api/tokens/launch-tx**: Creates unsigned launch transaction
4. **Client signs and broadcasts**: User wallet signs and submits to Solana
5. **POST /api/tokens/launch**: Records successful launch in database

### Security
- Charity wallets are looked up server-side from vetted charity database (prevents fee diversion)
- All wallet addresses validated before on-chain operations
- Platform wallet validated at startup; fails in production if invalid

### Partner Referral
- Partner wallet set to buyback wallet (`8pgMzffWjeuYvjYQkyfvWpzKWQDvjXAm4iQB1auvQZH8`) via Bags SDK's `partner` parameter
- All Bags.fm referral credits go to buyback wallet for automatic FYI token purchases

### Automated FYI Buyback System
- **Purpose**: Platform fees automatically buy FYI tokens, creating buy pressure
- **Buyback Wallet**: `8pgMzffWjeuYvjYQkyfvWpzKWQDvjXAm4iQB1auvQZH8`
- **Flow**: Platform fees (0.25%) → Buyback wallet → Auto-swap to FYI via Jupiter
- **Frequency**: Checks every 60 minutes, swaps when balance ≥ 0.015 SOL
- **Tracking**: All buybacks recorded in `buybacks` table with transaction signatures
- **API Endpoints**:
  - `GET /api/buyback/stats` - View buyback statistics
  - `GET /api/buyback/history` - View buyback transaction history
  - `POST /api/admin/buyback/execute` - Manually trigger buyback (admin only)

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library
- **React Icons**: Additional icon sets (Solana logo)
- **date-fns**: Date formatting utilities
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Calendar/date picker component