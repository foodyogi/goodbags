import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Charity verification status enum values
export const CHARITY_STATUS = {
  PENDING: "pending",
  CONTACTED: "contacted", 
  VERIFIED: "verified",
  DENIED: "denied",
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
  verifiedAt: timestamp("verified_at"),
  lastContactedAt: timestamp("last_contacted_at"),
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
export type TokenLaunchForm = z.infer<typeof tokenLaunchFormSchema>;

// Fee constants
export const CHARITY_FEE_PERCENTAGE = 1; // 1% royalty to charity
export const PLATFORM_FEE_PERCENTAGE = 0.25; // 0.25% platform fee

// Vetted charities - personally managed
export const VETTED_CHARITIES = [
  {
    id: "food-yoga-international",
    name: "Food Yoga International",
    wallet: "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP",
    category: "hunger",
    description: "Providing plant-based meals to the hungry worldwide",
    website: "https://ffl.org",
  },
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
