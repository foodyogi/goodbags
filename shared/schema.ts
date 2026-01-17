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

// Charities registry table
export const charities = pgTable("charities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  website: text("website"),
  email: text("email"),
  walletAddress: text("wallet_address"),
  status: text("status").notNull().default("pending"),
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
  initialBuyAmount: decimal("initial_buy_amount", { precision: 18, scale: 9 }).default("0"),
  charityDonated: decimal("charity_donated", { precision: 18, scale: 9 }).default("0"),
  platformFeeCollected: decimal("platform_fee_collected", { precision: 18, scale: 9 }).default("0"),
  tradingVolume: decimal("trading_volume", { precision: 18, scale: 9 }).default("0"),
  transactionSignature: text("transaction_signature"),
  launchedAt: timestamp("launched_at").defaultNow().notNull(),
  donationCount: integer("donation_count").default(0),
  lastDonationAt: timestamp("last_donation_at"),
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

// Fee constants - Bot-friendly 1% total fee
// Split: 0.75% to charity + 0.25% platform fee for FYI buyback = 1% total
// This keeps total tax at 1% so trading bots can participate
export const CHARITY_FEE_PERCENTAGE = 0.75; // 0.75% to charity
export const PLATFORM_FEE_PERCENTAGE = 0.25; // 0.25% platform fee for FYI buyback
export const TOTAL_FEE_PERCENTAGE = 1; // Total: 1% (bot-friendly)
export const CREATOR_FEE_PERCENTAGE = 0; // Creators do not receive trading fees

// Platform wallet for collecting platform fees (must be set in environment or use a default devnet address)
// In production, set PLATFORM_WALLET_ADDRESS environment variable
// For devnet/testing, using a valid test wallet address
export const PLATFORM_WALLET = "So1iMpaCTFee1111111111111111111111111111111" as const;

// Convert percentage to basis points (1% = 100 bps, 0.25% = 25 bps)
// Charity: 0.75% = 75 bps, Platform: 0.25% = 25 bps, Total: 100 bps (1%)
export const CHARITY_FEE_BPS = 75; // 0.75%
export const PLATFORM_FEE_BPS = 25; // 0.25%
export const TOTAL_FEE_BPS = 100; // 1% total
export const CREATOR_FEE_BPS = 0; // Creator receives nothing

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

// Vetted charities - personally managed by admin
// NOTE: Only add charities here after proper verification (email + wallet + admin approval)
// The Water Project was removed as it was not properly vetted
export const VETTED_CHARITIES = [
  {
    id: "julianas-animal-sanctuary",
    name: "Juliana's Animal Sanctuary",
    wallet: "JULSxvKLfEDpMqR7ePNvXxGGcNAPtYvWqmCjXhKBVPZ",
    category: "animals",
    description: "Rescuing and caring for farm animals in Colombia",
    website: "https://julianasanimalsanctuary.org",
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
  walletAddress: z.string().min(32, "Please provide a valid Solana wallet address").max(44),
  registrationNumber: z.string().optional(),
});
