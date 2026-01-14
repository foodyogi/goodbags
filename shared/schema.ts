import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Launched tokens table
export const launchedTokens = pgTable("launched_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  mintAddress: text("mint_address").notNull().unique(),
  creatorWallet: text("creator_wallet").notNull(),
  initialBuyAmount: decimal("initial_buy_amount", { precision: 18, scale: 9 }).default("0"),
  charityDonated: decimal("charity_donated", { precision: 18, scale: 9 }).default("0"),
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
export const launchedTokensRelations = relations(launchedTokens, ({ many }) => ({
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  token: one(launchedTokens, {
    fields: [donations.tokenMint],
    references: [launchedTokens.mintAddress],
  }),
}));

// Insert schemas
export const insertLaunchedTokenSchema = createInsertSchema(launchedTokens).omit({
  id: true,
  launchedAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  donatedAt: true,
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
});

// Types
export type InsertLaunchedToken = z.infer<typeof insertLaunchedTokenSchema>;
export type LaunchedToken = typeof launchedTokens.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;
export type TokenLaunchForm = z.infer<typeof tokenLaunchFormSchema>;

// Charity wallet constant - Food Yoga International
export const CHARITY_WALLET = "8UjmkVVLqBrrMsRkcBWQadQWCzWgWaHnxztwhJ1c8RTP";
export const CHARITY_NAME = "Food Yoga International";
export const CHARITY_FEE_PERCENTAGE = 1; // 1% royalty to charity
