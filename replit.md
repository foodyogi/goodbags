# GoodBags - Solana Memecoin Launcher for Social Impact

## Overview

GoodBags (goodbags.io) is a Solana-based memecoin launcher platform powered by Bags.fm that enables users to create and launch their own memecoins with built-in charity donations. Token creators choose their own impact cause during launch, selecting from verified charities across categories like hunger, environment, education, health, animals, disaster relief, and community.

### Key Features
- **Multi-charity system**: Creators choose their cause from verified charities by category
- **Custom charity submission**: Submit new charities with verification workflow
- **Fee structure**: 0.25% platform fee + 1% charity donation from trading fees
- **Impact Dashboard**: Track donations with blockchain-verified transparency
- **Charity verification**: Pending → Contacted → Verified → Active workflow
- **Audit logging**: All charity submissions and token launches tracked for compliance

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
- `PLATFORM_WALLET_ADDRESS` (optional): Platform wallet for fee collection (uses default if not set)

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
- Partner wallet (paulrodturner) integrated via Bags SDK's `partner` parameter
- All token launches earn Bags.fm referral credits for the partner wallet

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library
- **React Icons**: Additional icon sets (Solana logo)
- **date-fns**: Date formatting utilities
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Calendar/date picker component