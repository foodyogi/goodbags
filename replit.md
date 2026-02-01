# GoodBags - Solana Memecoin Launcher for Social Impact

## Overview
GoodBags is a Solana-based memecoin launcher platform designed to integrate charity donations directly into memecoin launches. It enables users to create and launch tokens tied to over 75 verified charities, featuring an X Account Payout System for charities and an anti-rug pull token approval mechanism where charities endorse tokens launched in their name. Each token incorporates a 1% royalty stream from trading volume, split between charity (0.75%), FYI token buyback (0.05%), and the token creator (0.20%), with creators choosing their donation tier at launch. The platform aims to provide a transparent and secure way to leverage memecoins for social impact, offering public dashboards for impact tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Wouter for routing, and TanStack React Query for state management. UI components use shadcn/ui (Radix UI primitives) and Tailwind CSS, supporting dark/light modes. React Hook Form with Zod handles forms, and Vite is the build tool.

### Backend
The backend is a Node.js Express.js application in TypeScript (ES modules), providing RESTful JSON API endpoints. It uses Drizzle ORM with PostgreSQL for data persistence and Zod for schema validation.

### Authentication
Replit Auth is used for user authentication, supporting multiple login providers. Sessions are stored in PostgreSQL. Users can link their Solana wallet addresses, which are verified cryptographically and stored for identity/tracking. Custom display names are supported. The token launch flow requires authentication and wallet connection, with a "Test Mode" available to bypass these for simulation.

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

### Token Features
Token image uploads are supported via Replit Object Storage to Google Cloud Storage. An automated FYI Buyback System uses 0.25% of platform fees to buy FYI tokens via Jupiter. A "Test Mode" allows simulated token launches that are marked as `isTest=true` and do not trigger charity notifications or donation records.

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