import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Charity verification status enum values
export const CHARITY_STATUS = {
  PENDING: "pending",           // Initial submission
  EIN_VERIFIED: "ein_verified", // EIN verified against Every.org
  EMAIL_VERIFIED: "email_verified",  // Email ownership confirmed
  WALLET_VERIFIED: "wallet_verified", // Wallet ownership confirmed (both email + wallet done)
  APPROVED: "verified",         // Admin approved, ready to use
  DENIED: "denied",             // Rejected
} as const;

// Impact categories for charity selection
export const IMPACT_CATEGORIES = [
  { id: "hunger", name: "End Hunger", icon: "utensils" },
  { id: "environment", name: "Environment", icon: "leaf" },
  { id: "education", name: "Education", icon: "graduation-cap" },
  { id: "health", name: "Health & Medicine", icon: "heart-pulse" },
  { id: "animals", name: "Animal Welfare", icon: "paw-print" },
  { id: "disaster", name: "Disaster Relief", icon: "life-buoy" },
  { id: "community", name: "Community Development", icon: "users" },
  { id: "other", name: "Other Causes", icon: "hand-heart" },
] as const;

// Charity source - where the charity data comes from
export const CHARITY_SOURCE = {
  CHANGE: "change",       // From Change API (1.3M+ nonprofits with Solana wallets)
  EVERYORG: "everyorg",   // From Every.org API (EIN verification)
  MANUAL: "manual",       // Manually added/seeded charities
} as const;

// Payout method - how the charity receives donations
export const PAYOUT_METHOD = {
  WALLET: "wallet",       // Direct Solana wallet transfer (instant)
  TWITTER: "twitter",     // Via Bags.fm X account claim system (charity claims later)
} as const;

// Token approval status - charity endorsement of tokens created in their name
export const TOKEN_APPROVAL_STATUS = {
  PENDING: "pending",           // Awaiting charity review
  APPROVED: "approved",         // Charity has endorsed this token
  DENIED: "denied",             // Charity has rejected this token
  NOT_APPLICABLE: "not_applicable", // No charity selected (self-directed)
} as const;

// Charities registry table
export const charities = pgTable("charities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  website: text("website"),
  email: text("email"),
  walletAddress: text("wallet_address"),
  twitterHandle: text("twitter_handle"), // X account handle for Bags.fm claim system
  xHandleVerified: boolean("x_handle_verified").default(false), // True if X handle confirmed working with Bags.fm
  payoutMethod: text("payout_method").notNull().default("wallet"), // wallet or twitter
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("manual"), // change, everyorg, or manual
  isDefault: boolean("is_default").default(false),
  isFeatured: boolean("is_featured").default(false),
  logoUrl: text("logo_url"),
  createdBy: text("created_by"),
  // Verification fields
  emailVerificationToken: text("email_verification_token"),
  emailVerifiedAt: timestamp("email_verified_at"),
  walletVerificationNonce: text("wallet_verification_nonce"),
  walletVerifiedAt: timestamp("wallet_verified_at"),
  verifiedAt: timestamp("verified_at"),
  lastContactedAt: timestamp("last_contacted_at"),
  // EIN/registration number for US 501(c)(3) or equivalent
  registrationNumber: text("registration_number"),
  submitterWallet: text("submitter_wallet"),
  // Every.org verification fields
  everyOrgId: text("every_org_id"),
  everyOrgSlug: text("every_org_slug"),
  everyOrgVerified: boolean("every_org_verified").default(false),
  everyOrgVerifiedAt: timestamp("every_org_verified_at"),
  everyOrgName: text("every_org_name"),
  everyOrgDescription: text("every_org_description"),
  everyOrgWebsite: text("every_org_website"),
  everyOrgLogoUrl: text("every_org_logo_url"),
  everyOrgIsDisbursable: boolean("every_org_is_disbursable").default(false),
  // Change API fields
  changeId: text("change_id"),  // Change API nonprofit ID
  // Country registration info
  countryCode: text("country_code"),  // ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "IN")
  countryName: text("country_name"),  // Full country name (e.g., "United States", "United Kingdom")
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit logs for security tracking
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  actorWallet: text("actor_wallet"),
  actorIp: text("actor_ip"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Launched tokens table
export const launchedTokens = pgTable("launched_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  mintAddress: text("mint_address").notNull().unique(),
  creatorWallet: text("creator_wallet").notNull(),
  charityId: text("charity_id"),
  // Charity approval status - tracks if the charity has endorsed this token
  charityApprovalStatus: text("charity_approval_status").notNull().default("pending"),
  charityApprovalNote: text("charity_approval_note"), // Optional note from charity
  charityNotifiedAt: timestamp("charity_notified_at"), // When we emailed the charity
  charityRespondedAt: timestamp("charity_responded_at"), // When charity approved/denied
  // Charity info snapshot (in case charity record changes)
  charityName: text("charity_name"),
  charityEmail: text("charity_email"),
  charityWebsite: text("charity_website"),
  charityTwitter: text("charity_twitter"),
  charityFacebook: text("charity_facebook"),
  // Financial tracking
  initialBuyAmount: decimal("initial_buy_amount", { precision: 18, scale: 9 }).default("0"),
  charityDonated: decimal("charity_donated", { precision: 18, scale: 9 }).default("0"),
  platformFeeCollected: decimal("platform_fee_collected", { precision: 18, scale: 9 }).default("0"),
  tradingVolume: decimal("trading_volume", { precision: 18, scale: 9 }).default("0"),
  transactionSignature: text("transaction_signature"),
  launchedAt: timestamp("launched_at").defaultNow().notNull(),
  donationCount: integer("donation_count").default(0),
  lastDonationAt: timestamp("last_donation_at"),
  // Test mode flag - marks tokens created in test mode (not real on-chain tokens)
  isTest: boolean("is_test").default(false),
});

// Donation tracking table - blockchain verified
export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenMint: text("token_mint").notNull(),
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  charityWallet: text("charity_wallet").notNull(),
  transactionSignature: text("transaction_signature").notNull().unique(),
  donatedAt: timestamp("donated_at").defaultNow().notNull(),
});

// FYI token buyback tracking
export const buybacks = pgTable("buybacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  solAmount: decimal("sol_amount", { precision: 18, scale: 9 }).notNull(),
  fyiAmount: decimal("fyi_amount", { precision: 18, scale: 9 }).notNull(),
  transactionSignature: text("transaction_signature").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Relations
export const charitiesRelations = relations(charities, ({ many }) => ({
  tokens: many(launchedTokens),
}));

export const launchedTokensRelations = relations(launchedTokens, ({ one, many }) => ({
  charity: one(charities, {
    fields: [launchedTokens.charityId],
    references: [charities.id],
  }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  token: one(launchedTokens, {
    fields: [donations.tokenMint],
    references: [launchedTokens.mintAddress],
  }),
}));

// Insert schemas
export const insertCharitySchema = createInsertSchema(charities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  lastContactedAt: true,
});

export const insertLaunchedTokenSchema = createInsertSchema(launchedTokens).omit({
  id: true,
  launchedAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  donatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBuybackSchema = createInsertSchema(buybacks).omit({
  id: true,
  executedAt: true,
});

// Validation schema for token launch form
export const tokenLaunchFormSchema = z.object({
  name: z.string().min(1, "Token name is required").max(32, "Token name must be 32 characters or less"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol must be 10 characters or less").toUpperCase(),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  initialBuyAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Initial buy amount must be a valid number"),
  charityId: z.string().min(1, "Please select a charity"),
});

// Types
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type Charity = typeof charities.$inferSelect;
export type InsertLaunchedToken = z.infer<typeof insertLaunchedTokenSchema>;
export type LaunchedToken = typeof launchedTokens.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertBuyback = z.infer<typeof insertBuybackSchema>;
export type Buyback = typeof buybacks.$inferSelect;
export type TokenLaunchForm = z.infer<typeof tokenLaunchFormSchema>;
export type CharityApplication = z.infer<typeof charityApplicationSchema>;

// Fee constants - 1% total fee
// Split: 0.75% to charity + 0.25% platform fee for FYI buyback = 1% total
export const CHARITY_FEE_PERCENTAGE = 0.75; // 0.75% to charity
export const PLATFORM_FEE_PERCENTAGE = 0.25; // 0.25% platform fee for FYI buyback
export const TOTAL_FEE_PERCENTAGE = 1; // Total: 1%
export const CREATOR_FEE_PERCENTAGE = 0; // Creators do not receive trading fees

// Platform wallet for collecting platform fees (must be set in environment or use a default devnet address)
// In production, set PLATFORM_WALLET_ADDRESS environment variable
// For devnet/testing, using a valid test wallet address
export const PLATFORM_WALLET = "So1iMpaCTFee1111111111111111111111111111111" as const;

// Fee distribution in basis points (must total 10000 BPS = 100%)
// This represents the split of collected fees, not the fee rate
// Charity: 75% of fees, Platform: 25% of fees
export const CHARITY_FEE_BPS = 7500; // 75% of fees go to charity
export const PLATFORM_FEE_BPS = 2500; // 25% of fees go to platform
export const TOTAL_FEE_BPS = 10000; // Must equal 10000 (100%)
export const CREATOR_FEE_BPS = 0; // Creator receives 0% of fees

// Partner referral wallet for earning Bags.fm credits
// PARTNER_WALLET is used in SDK's createBagsFeeShareConfig as the partner PublicKey
// Referral credits go to buyback wallet for automatic FYI token purchases
export const PARTNER_WALLET = "8pgMzffWjeuYvjYQkyfvWpzKWQDvjXAm4iQB1auvQZH8" as const;
export const PARTNER_REF = "goodbags" as const;

// Featured impact project - existing FYI token on Bags.fm
export const FEATURED_IMPACT_PROJECT = {
  name: "Food Yoga International",
  tokenMint: "N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbGKgvBAGS",
  bagsUrl: "https://bags.fm/N1WughP83SzwbcYRrfD7n34T4VtAq8bi3pbGKgvBAGS",
  description: "Supporting plant-based meals for the hungry worldwide",
  category: "hunger",
} as const;

// Vetted charities - verified nonprofits with X accounts for Bags.fm claim payouts
// NOTE: All charities verified via their official X accounts and registration records
// Primary payout method is "twitter" - charities claim via Bags.fm app with their X account
// Country codes follow ISO 3166-1 alpha-2 standard
export const VETTED_CHARITIES = [
  // === HUNGER & FOOD SECURITY ===
  {
    id: "food-yoga-international",
    name: "Food Yoga International",
    wallet: "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP",
    twitterHandle: "FoodforLifeGlob",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "Providing plant-based meals to the hungry worldwide through Food for Life programs",
    website: "https://ffl.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "feeding-america",
    name: "Feeding America",
    wallet: null,
    twitterHandle: "FeedingAmerica",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "The nation's largest domestic hunger-relief organization with 200+ food banks",
    website: "https://www.feedingamerica.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "world-central-kitchen",
    name: "World Central Kitchen",
    wallet: null,
    twitterHandle: "WCKitchen",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "Chef-led humanitarian organization providing meals in crisis zones worldwide",
    website: "https://wck.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "action-against-hunger",
    name: "Action Against Hunger",
    wallet: null,
    twitterHandle: "ActionAgainstHunger",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "Leading global organization fighting hunger through nutrition, water, and livelihoods",
    website: "https://www.actionagainsthunger.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "rise-against-hunger",
    name: "Rise Against Hunger",
    wallet: null,
    twitterHandle: "RiseAgstHunger",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "International hunger relief organization distributing food and aid to those in need",
    website: "https://www.riseagainsthunger.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "no-kid-hungry",
    name: "No Kid Hungry",
    wallet: null,
    twitterHandle: "nokidhungry",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "Ending childhood hunger in America through school meals and nutrition programs",
    website: "https://www.nokidhungry.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === ANIMAL WELFARE ===
  {
    id: "julianas-animal-sanctuary",
    name: "Juliana's Animal Sanctuary",
    wallet: "JULSxvKLfEDpMqR7ePNvXxGGcNAPtYvWqmCjXhKBVPZ",
    twitterHandle: "JulianasAnimalS",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Rescuing and caring for farm animals in Colombia",
    website: "https://julianasanimalsanctuary.org",
    countryCode: "CO",
    countryName: "Colombia",
  },
  {
    id: "aspca",
    name: "ASPCA",
    wallet: null,
    twitterHandle: "ASPCA",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "American Society for the Prevention of Cruelty to Animals - protecting animals since 1866",
    website: "https://www.aspca.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "humane-society",
    name: "Humane Society of the United States",
    wallet: null,
    twitterHandle: "HumaneSociety",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Fighting for all animals through advocacy, education, and hands-on programs",
    website: "https://www.humanesociety.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "world-wildlife-fund",
    name: "World Wildlife Fund",
    wallet: null,
    twitterHandle: "WWF",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Leading conservation organization working to protect wildlife and habitats globally",
    website: "https://www.worldwildlife.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "ocean-conservancy",
    name: "Ocean Conservancy",
    wallet: null,
    twitterHandle: "OurOcean",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Protecting the ocean through science-based solutions and policy advocacy",
    website: "https://oceanconservancy.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "best-friends-animal-society",
    name: "Best Friends Animal Society",
    wallet: null,
    twitterHandle: "bestaborig",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Leading animal welfare organization working to end the killing of dogs and cats in shelters",
    website: "https://bestfriends.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === WATER & SANITATION ===
  {
    id: "the-water-project",
    name: "The Water Project",
    wallet: "WATERpVLQx4fGjFqJmqSqU1Jc7gU7eSdF8xvRtNsK9zP",
    twitterHandle: "thewaterproject",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Building sustainable water projects in sub-Saharan Africa",
    website: "https://thewaterproject.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "charity-water",
    name: "charity: water",
    wallet: null,
    twitterHandle: "charitywater",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Bringing clean and safe drinking water to people in developing countries",
    website: "https://www.charitywater.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "water-org",
    name: "Water.org",
    wallet: null,
    twitterHandle: "water",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Pioneering market-driven solutions to the global water crisis",
    website: "https://water.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === ENVIRONMENT & CLIMATE ===
  {
    id: "rainforest-alliance",
    name: "Rainforest Alliance",
    wallet: null,
    twitterHandle: "RnfrstAlliance",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "Working to conserve biodiversity and transform land-use practices",
    website: "https://www.rainforest-alliance.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "sierra-club-foundation",
    name: "Sierra Club Foundation",
    wallet: null,
    twitterHandle: "SierraClub",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "America's largest grassroots environmental organization since 1892",
    website: "https://www.sierraclub.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "earthjustice",
    name: "Earthjustice",
    wallet: null,
    twitterHandle: "Earthjustice",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "The premier nonprofit environmental law organization using courts to protect nature",
    website: "https://earthjustice.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "environmental-defense-fund",
    name: "Environmental Defense Fund",
    wallet: null,
    twitterHandle: "EnvDefenseFund",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "Finding practical solutions to the most serious environmental problems",
    website: "https://www.edf.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "one-tree-planted",
    name: "One Tree Planted",
    wallet: null,
    twitterHandle: "onetreeplanted",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "Global reforestation nonprofit planting trees around the world",
    website: "https://onetreeplanted.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "350-org",
    name: "350.org",
    wallet: null,
    twitterHandle: "350",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "International movement building a fossil-free future and climate justice",
    website: "https://350.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === EDUCATION ===
  {
    id: "pencils-of-promise",
    name: "Pencils of Promise",
    wallet: null,
    twitterHandle: "PencilsOfPromis",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "Building schools and increasing educational opportunities in developing countries",
    website: "https://pencilsofpromise.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "room-to-read",
    name: "Room to Read",
    wallet: null,
    twitterHandle: "RoomtoRead",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "Transforming lives through literacy and gender equality in education",
    website: "https://www.roomtoread.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "teach-for-all",
    name: "Teach For All",
    wallet: null,
    twitterHandle: "TeachForAll",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "Global network developing collective leadership for educational equity",
    website: "https://teachforall.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "khan-academy",
    name: "Khan Academy",
    wallet: null,
    twitterHandle: "kaborig",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "Free world-class education for anyone, anywhere through online learning",
    website: "https://www.khanacademy.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "girls-who-code",
    name: "Girls Who Code",
    wallet: null,
    twitterHandle: "GirlsWhoCode",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "Closing the gender gap in technology through computer science education",
    website: "https://girlswhocode.com",
    countryCode: "US",
    countryName: "United States",
  },

  // === HEALTH & MEDICINE ===
  {
    id: "doctors-without-borders",
    name: "Doctors Without Borders",
    wallet: null,
    twitterHandle: "MSF_USA",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Independent medical humanitarian organization providing emergency aid worldwide",
    website: "https://www.doctorswithoutborders.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "direct-relief",
    name: "Direct Relief",
    wallet: null,
    twitterHandle: "DirectRelief",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Improving health and lives of people affected by poverty and emergencies",
    website: "https://www.directrelief.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "partners-in-health",
    name: "Partners In Health",
    wallet: null,
    twitterHandle: "PIH",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Providing quality healthcare to the poor and marginalized globally",
    website: "https://www.pih.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "americares",
    name: "Americares",
    wallet: null,
    twitterHandle: "americaborig",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Health-focused relief and development organization saving lives worldwide",
    website: "https://www.americares.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "global-fund",
    name: "The Global Fund",
    wallet: null,
    twitterHandle: "GlobalFund",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Partnership to end AIDS, tuberculosis and malaria as epidemics",
    website: "https://www.theglobalfund.org",
    countryCode: "CH",
    countryName: "Switzerland",
  },

  // === DISASTER RELIEF ===
  {
    id: "team-rubicon",
    name: "Team Rubicon",
    wallet: null,
    twitterHandle: "TeamRubicon",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Veteran-led disaster response organization serving communities in crisis",
    website: "https://teamrubiconusa.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "all-hands-and-hearts",
    name: "All Hands and Hearts",
    wallet: null,
    twitterHandle: "AllHandsHearts",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Volunteer-driven disaster relief and recovery organization worldwide",
    website: "https://www.allhandsandhearts.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "international-rescue-committee",
    name: "International Rescue Committee",
    wallet: null,
    twitterHandle: "theIRC",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Helping people whose lives are shattered by conflict and disaster",
    website: "https://www.rescue.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "globalgiving",
    name: "GlobalGiving",
    wallet: null,
    twitterHandle: "GlobalGiving",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Connecting donors with grassroots projects around the world",
    website: "https://www.globalgiving.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === INTERNATIONAL DEVELOPMENT ===
  {
    id: "care",
    name: "CARE",
    wallet: null,
    twitterHandle: "CARE",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Fighting global poverty and providing lifesaving assistance in emergencies",
    website: "https://www.care.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "oxfam",
    name: "Oxfam International",
    wallet: null,
    twitterHandle: "Oxfam",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Global movement working to end the injustice of poverty",
    website: "https://www.oxfam.org",
    countryCode: "GB",
    countryName: "United Kingdom",
  },
  {
    id: "heifer-international",
    name: "Heifer International",
    wallet: null,
    twitterHandle: "Heifer",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Ending hunger and poverty through sustainable agriculture",
    website: "https://www.heifer.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "kiva",
    name: "Kiva",
    wallet: null,
    twitterHandle: "Kiva",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Crowdfunded microloans expanding financial access for underserved communities",
    website: "https://www.kiva.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "mercy-corps",
    name: "Mercy Corps",
    wallet: null,
    twitterHandle: "mercycorps",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Global humanitarian organization empowering people to survive crises",
    website: "https://www.mercycorps.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === CHILDREN & YOUTH ===
  {
    id: "save-the-children",
    name: "Save the Children",
    wallet: null,
    twitterHandle: "SavetheChildren",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Giving children a healthy start, opportunity to learn, and protection from harm",
    website: "https://www.savethechildren.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "unicef",
    name: "UNICEF USA",
    wallet: null,
    twitterHandle: "UNICEFUSA",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Working in 190+ countries to save and protect the world's most vulnerable children",
    website: "https://www.unicefusa.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "world-vision",
    name: "World Vision",
    wallet: null,
    twitterHandle: "WorldVisionUSA",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Christian humanitarian organization helping children and families thrive",
    website: "https://www.worldvision.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "plan-international",
    name: "Plan International USA",
    wallet: null,
    twitterHandle: "PlanGlobal",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Striving for a just world advancing children's rights and equality for girls",
    website: "https://www.planusa.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === HUMAN RIGHTS ===
  {
    id: "amnesty-international",
    name: "Amnesty International USA",
    wallet: null,
    twitterHandle: "amnestyusa",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Fighting injustice and promoting human rights worldwide since 1961",
    website: "https://www.amnestyusa.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "human-rights-watch",
    name: "Human Rights Watch",
    wallet: null,
    twitterHandle: "hrw",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Investigating and reporting on abuses in all corners of the world",
    website: "https://www.hrw.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "aclu",
    name: "ACLU",
    wallet: null,
    twitterHandle: "ACLU",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Defending and preserving individual rights and liberties in the United States",
    website: "https://www.aclu.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === MENTAL HEALTH ===
  {
    id: "nami",
    name: "NAMI",
    wallet: null,
    twitterHandle: "NAMICommunicate",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "National Alliance on Mental Illness - advocacy and support for mental health",
    website: "https://www.nami.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "mental-health-america",
    name: "Mental Health America",
    wallet: null,
    twitterHandle: "MentalHealthAm",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Promoting mental health through advocacy, education, and support services",
    website: "https://mhanational.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "crisis-text-line",
    name: "Crisis Text Line",
    wallet: null,
    twitterHandle: "CrisisTextLine",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Free 24/7 crisis support via text message for people in mental health crisis",
    website: "https://www.crisistextline.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === VETERAN SERVICES ===
  {
    id: "wounded-warrior-project",
    name: "Wounded Warrior Project",
    wallet: null,
    twitterHandle: "wwp",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Programs and services meeting the needs of wounded veterans and their families",
    website: "https://www.woundedwarriorproject.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "gary-sinise-foundation",
    name: "Gary Sinise Foundation",
    wallet: null,
    twitterHandle: "GarySiniseFound",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Serving and honoring defenders, veterans, first responders, and their families",
    website: "https://www.garysinisefoundation.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === INTERNATIONAL ORGANIZATIONS ===
  {
    id: "united-way",
    name: "United Way Worldwide",
    wallet: null,
    twitterHandle: "UnitedWay",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Fighting for health, education, and financial stability of every person",
    website: "https://www.unitedway.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "habitat-for-humanity",
    name: "Habitat for Humanity",
    wallet: null,
    twitterHandle: "Habitat_org",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Building homes, communities, and hope around the world since 1976",
    website: "https://www.habitat.org",
    countryCode: "US",
    countryName: "United States",
  },
  {
    id: "goodwill",
    name: "Goodwill Industries International",
    wallet: null,
    twitterHandle: "GoodwillIntl",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Providing job training, employment, and community programs",
    website: "https://www.goodwill.org",
    countryCode: "US",
    countryName: "United States",
  },

  // === INDIA-BASED CHARITIES ===
  {
    id: "giveIndia",
    name: "GiveIndia",
    wallet: null,
    twitterHandle: "GiveIndia",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "India's largest and most trusted giving platform connecting donors with verified NGOs",
    website: "https://www.giveindia.org",
    countryCode: "IN",
    countryName: "India",
  },
  {
    id: "akshaya-patra",
    name: "Akshaya Patra Foundation",
    wallet: null,
    twitterHandle: "AkshayaPatra",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "World's largest NGO-run school lunch program feeding 2 million children daily",
    website: "https://www.akshayapatra.org",
    countryCode: "IN",
    countryName: "India",
  },
  {
    id: "pratham",
    name: "Pratham",
    wallet: null,
    twitterHandle: "prataborig",
    payoutMethod: "twitter" as const,
    category: "education",
    description: "India's largest NGO for education reaching millions of children annually",
    website: "https://www.pratham.org",
    countryCode: "IN",
    countryName: "India",
  },
  {
    id: "cry",
    name: "CRY - Child Rights and You",
    wallet: null,
    twitterHandle: "CRaborig",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Ensuring lasting change in the lives of underprivileged children across India",
    website: "https://www.cry.org",
    countryCode: "IN",
    countryName: "India",
  },

  // === UK-BASED CHARITIES ===
  {
    id: "british-red-cross",
    name: "British Red Cross",
    wallet: null,
    twitterHandle: "BritishRedCross",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Helping people in crisis, whoever and wherever they are in the UK and worldwide",
    website: "https://www.redcross.org.uk",
    countryCode: "GB",
    countryName: "United Kingdom",
  },
  {
    id: "rspca",
    name: "RSPCA",
    wallet: null,
    twitterHandle: "RSPCA_official",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "The oldest and largest animal welfare charity in England and Wales",
    website: "https://www.rspca.org.uk",
    countryCode: "GB",
    countryName: "United Kingdom",
  },
  {
    id: "shelter-uk",
    name: "Shelter",
    wallet: null,
    twitterHandle: "Shelter",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Fighting homelessness and bad housing in England and Scotland",
    website: "https://www.shelter.org.uk",
    countryCode: "GB",
    countryName: "United Kingdom",
  },
  {
    id: "comic-relief",
    name: "Comic Relief",
    wallet: null,
    twitterHandle: "comicrelief",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Tackling poverty and social injustice in the UK and around the world",
    website: "https://www.comicrelief.com",
    countryCode: "GB",
    countryName: "United Kingdom",
  },

  // === CANADA-BASED CHARITIES ===
  {
    id: "food-banks-canada",
    name: "Food Banks Canada",
    wallet: null,
    twitterHandle: "FoodBanksCanada",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "National charitable organization working to relieve hunger across Canada",
    website: "https://www.foodbankscanada.ca",
    countryCode: "CA",
    countryName: "Canada",
  },
  {
    id: "toronto-humane-society",
    name: "Toronto Humane Society",
    wallet: null,
    twitterHandle: "TorontoHumane",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "One of the largest animal shelters in Canada providing care and adoption services",
    website: "https://www.torontohumanesociety.com",
    countryCode: "CA",
    countryName: "Canada",
  },
  {
    id: "david-suzuki-foundation",
    name: "David Suzuki Foundation",
    wallet: null,
    twitterHandle: "DavidSuzukiFdn",
    payoutMethod: "twitter" as const,
    category: "environment",
    description: "Protecting nature and building sustainable communities in Canada",
    website: "https://davidsuzuki.org",
    countryCode: "CA",
    countryName: "Canada",
  },

  // === AUSTRALIA-BASED CHARITIES ===
  {
    id: "oxfam-australia",
    name: "Oxfam Australia",
    wallet: null,
    twitterHandle: "OxfamAustralia",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Working to create lasting solutions to poverty, hunger, and injustice",
    website: "https://www.oxfam.org.au",
    countryCode: "AU",
    countryName: "Australia",
  },
  {
    id: "rspca-australia",
    name: "RSPCA Australia",
    wallet: null,
    twitterHandle: "RSPCA",
    payoutMethod: "twitter" as const,
    category: "animals",
    description: "Leading animal welfare organization in Australia since 1871",
    website: "https://www.rspca.org.au",
    countryCode: "AU",
    countryName: "Australia",
  },
  {
    id: "beyond-blue",
    name: "Beyond Blue",
    wallet: null,
    twitterHandle: "BeyondBlue",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "Mental health organization supporting Australians with anxiety and depression",
    website: "https://www.beyondblue.org.au",
    countryCode: "AU",
    countryName: "Australia",
  },

  // === EUROPE-BASED CHARITIES ===
  {
    id: "msf-international",
    name: "Médecins Sans Frontières",
    wallet: null,
    twitterHandle: "MSF",
    payoutMethod: "twitter" as const,
    category: "health",
    description: "International medical humanitarian organization (Doctors Without Borders)",
    website: "https://www.msf.org",
    countryCode: "CH",
    countryName: "Switzerland",
  },
  {
    id: "red-cross-icrc",
    name: "International Committee of the Red Cross",
    wallet: null,
    twitterHandle: "ICRC",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "Humanitarian organization protecting victims of armed conflict and violence",
    website: "https://www.icrc.org",
    countryCode: "CH",
    countryName: "Switzerland",
  },
  {
    id: "unhcr",
    name: "UNHCR, The UN Refugee Agency",
    wallet: null,
    twitterHandle: "Refugees",
    payoutMethod: "twitter" as const,
    category: "disaster",
    description: "UN agency protecting refugees, forcibly displaced, and stateless people",
    website: "https://www.unhcr.org",
    countryCode: "CH",
    countryName: "Switzerland",
  },
  {
    id: "wfp",
    name: "World Food Programme",
    wallet: null,
    twitterHandle: "WFP",
    payoutMethod: "twitter" as const,
    category: "hunger",
    description: "Leading humanitarian organization fighting hunger worldwide (Nobel Peace Prize 2020)",
    website: "https://www.wfp.org",
    countryCode: "IT",
    countryName: "Italy",
  },

  // === AFRICA-BASED CHARITIES ===
  {
    id: "africa-foundation",
    name: "Africa Foundation",
    wallet: null,
    twitterHandle: "africafoundtn",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Empowering rural communities in Africa through education, healthcare, and infrastructure",
    website: "https://www.africafoundation.org",
    countryCode: "ZA",
    countryName: "South Africa",
  },
  {
    id: "nelson-mandela-foundation",
    name: "Nelson Mandela Foundation",
    wallet: null,
    twitterHandle: "NelsMandelaFoun",
    payoutMethod: "twitter" as const,
    category: "community",
    description: "Promoting Mandela's legacy through dialogue, memory, and legacy work",
    website: "https://www.nelsonmandela.org",
    countryCode: "ZA",
    countryName: "South Africa",
  },
] as const;

// Default charity (first in the list)
export const DEFAULT_CHARITY = VETTED_CHARITIES[0];

// Charity application validation schema
export const charityApplicationSchema = z.object({
  name: z.string().min(2, "Charity name must be at least 2 characters").max(100),
  description: z.string().min(10, "Please provide a brief description").max(500),
  category: z.string().min(1, "Please select a category"),
  website: z.string().url("Please provide a valid website URL"),
  email: z.string().email("Please provide a valid official email address"),
  walletAddress: z.string().min(32, "Please provide a valid Solana wallet address").max(44).optional(),
  twitterHandle: z.string().min(1, "Please provide your X account handle").max(50).optional(),
  payoutMethod: z.enum(["wallet", "twitter"]).default("wallet"),
  registrationNumber: z.string().optional(),
}).refine(
  (data) => {
    // Must have either wallet address or twitter handle based on payout method
    if (data.payoutMethod === "wallet") {
      return data.walletAddress && data.walletAddress.length >= 32;
    } else if (data.payoutMethod === "twitter") {
      return data.twitterHandle && data.twitterHandle.length >= 1;
    }
    return false;
  },
  {
    message: "Please provide a valid Solana wallet address or X account handle based on your payout method",
  }
);
