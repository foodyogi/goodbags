# Design Guidelines: Solana Memecoin Launcher

## Design Approach
**Reference-Based Hybrid**: Drawing from leading Solana DeFi platforms (Jupiter, Raydium) for credibility and established Web3 patterns, with memecoin culture influences (Pump.fun) for personality. Balance professional trading interfaces with accessible, playful token creation.

## Core Design Elements

### Typography
- **Primary Font**: Inter (via Google Fonts) - clean, technical, crypto-industry standard
- **Display/Headings**: Bold 700, sizes: text-4xl to text-6xl for hero, text-2xl to text-3xl for sections
- **Body Text**: Regular 400, text-base to text-lg, medium line-height for readability
- **Data/Metrics**: Mono font (font-mono) for addresses, volumes, and token symbols
- **Micro-copy**: text-sm for helper text, medium 500 for labels

### Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 (p-4, gap-6, mb-8, py-12, mt-16, py-24)
- Mobile padding: p-4 to p-6
- Desktop padding: p-8 to p-12
- Section spacing: py-16 to py-24
- Card/component gaps: gap-4 to gap-8
- Max container width: max-w-7xl

### Component Library

**Header/Navigation**
- Fixed header with gradient border-bottom
- Left: Logo/brand, Center: Navigation (Launch, Dashboard), Right: Wallet connect button (prominent, gradient when connected showing truncated address)
- Mobile: Hamburger menu

**Hero Section** (Full viewport)
- Two-column layout (60/40 split): Left - Large headline + subtext + primary CTA, Right - Animated/illustrated crypto visual OR token preview mockup
- Headline emphasizes "Launch + Give Back" value prop
- Subtext explains 1% charity donation mechanic
- Primary CTA: "Launch Your Token" (large, gradient button)
- Background: Subtle gradient mesh or animated particles (minimalist)

**Token Launch Form** (Main feature)
- Card-based design (rounded-2xl, shadow-lg)
- Single column, generous spacing (gap-6)
- Input fields with labels above: Token Name, Symbol (uppercase, max-length indicator), Description (textarea)
- Image upload: Large dashed border dropzone with preview thumbnail
- Initial Buy Amount: SOL input with wallet balance display
- Charity wallet display: Read-only field showing placeholder address (truncated with copy button)
- Submit button: Full-width, gradient, loading state with spinner
- Error/success messages: Toast notifications top-right

**Dashboard Grid**
- Three-column responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Token cards: Image thumbnail, name/symbol, creation date, trading volume metric, charity donated (in SOL), "View Details" link
- Stats header: Total tokens launched, Total donated, Total volume (in highlighted cards above grid)
- Empty state: Illustration + "Launch your first token" prompt

**Transaction Status Modal**
- Overlay (backdrop blur)
- Centered card showing: Progress steps (Creating token → Initial buy → Confirming), Transaction signature (copyable), Success/error state, "View on Solscan" link

**Footer**
- Simple single row: Links (Docs, Twitter, Discord), Powered by Bags.fm badge, Legal links

### Interaction Patterns
- Wallet connect: Modal overlay with wallet options (Phantom, Solflare, etc.)
- Form validation: Inline errors below fields
- Loading states: Skeleton screens for dashboard, spinners for actions
- Hover states: Subtle scale (scale-105) on cards, brightness adjustments on buttons
- Clipboard copy: Icon button with checkmark confirmation

### Responsive Behavior
- Mobile (<768px): Single column, full-width cards, collapsed navigation
- Tablet (768-1024px): Two-column grids, maintained spacing
- Desktop (>1024px): Three-column grids, side-by-side form layouts

## Images
**Hero Section**: Abstract Solana-themed illustration (gradient coins, blockchain network visualization, or memecoin mascot collage) - position right side, takes 40% width. Ensures trust and visual interest without stock photography.