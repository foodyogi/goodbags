import { 
  launchedTokens, 
  donations,
  charities,
  auditLogs,
  buybacks,
  type LaunchedToken, 
  type InsertLaunchedToken,
  type Donation,
  type InsertDonation,
  type Charity,
  type InsertCharity,
  type AuditLog,
  type InsertAuditLog,
  type Buyback,
  type InsertBuyback,
  CHARITY_STATUS,
  VETTED_CHARITIES,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { isValidSolanaPublicKey, isValidTxSignature, verifiedDonationTotals } from "@shared/solana";

export interface IStorage {
  // Charity methods
  createCharity(charity: InsertCharity): Promise<Charity>;
  getCharities(): Promise<Charity[]>;
  getVerifiedCharities(): Promise<Charity[]>;
  getPendingCharities(): Promise<Charity[]>;
  getCharitiesByCategory(category: string): Promise<Charity[]>;
  getCharityById(id: string): Promise<Charity | undefined>;
  getCharityByEmail(email: string): Promise<Charity | undefined>;
  getCharityByEin(ein: string): Promise<Charity | undefined>;
  getCharityByEmailToken(token: string): Promise<Charity | undefined>;
  updateCharityStatus(id: string, status: string, verifiedAt?: Date): Promise<Charity | undefined>;
  updateCharityEmailVerification(id: string, emailVerifiedAt: Date): Promise<Charity | undefined>;
  updateCharityWalletVerification(id: string, walletVerifiedAt: Date): Promise<Charity | undefined>;
  setCharityVerificationTokens(id: string, emailToken: string, walletNonce: string): Promise<Charity | undefined>;
  updateCharityWithEveryOrgData(id: string, data: {
    everyOrgId: string;
    everyOrgSlug: string;
    everyOrgName: string;
    everyOrgDescription: string;
    everyOrgWebsite: string;
    everyOrgLogoUrl: string;
    everyOrgIsDisbursable: boolean;
    registrationNumber: string;
  }): Promise<Charity | undefined>;
  updateCharityXHandle(id: string, twitterHandle: string, verified: boolean): Promise<Charity | undefined>;
  getDefaultCharity(): Promise<Charity | undefined>;
  seedDefaultCharities(): Promise<void>;
  
  // Token methods
  createLaunchedToken(token: InsertLaunchedToken): Promise<LaunchedToken>;
  getLaunchedTokens(): Promise<LaunchedToken[]>;
  getLaunchedTokenByMint(mintAddress: string): Promise<LaunchedToken | undefined>;
  getTokensByCreator(creatorWallet: string): Promise<LaunchedToken[]>;
  updateTokenStats(mintAddress: string, volume: string, donated: string): Promise<LaunchedToken | undefined>;
  updateLaunchedToken(id: string, updates: Partial<LaunchedToken>): Promise<LaunchedToken | undefined>;
  
  // Donation methods
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDonationsByToken(tokenMint: string): Promise<Donation[]>;
  getDashboardStats(): Promise<{
    totalTokens: number;
    totalDonated: string;
    totalVolume: string;
    totalPlatformFees: string;
  }>;
  getTokenImpact(mintAddress: string): Promise<{
    totalDonated: string;
    donationCount: number;
    recentDonations: Donation[];
  } | null>;
  
  // Audit methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getLatestTokenApprovalAction(tokenId: string): Promise<string | undefined>;
  
  // Buyback methods
  createBuyback(buyback: InsertBuyback): Promise<Buyback>;
  getAllBuybacks(): Promise<Buyback[]>;
  
  // Token approval methods
  getTokensPendingApproval(): Promise<LaunchedToken[]>;
  getTokensByCharityEmail(charityEmail: string): Promise<LaunchedToken[]>;
  updateTokenApprovalStatus(
    tokenId: string, 
    status: string, 
    note?: string
  ): Promise<LaunchedToken | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Charity methods
  async createCharity(charity: InsertCharity): Promise<Charity> {
    const [newCharity] = await db
      .insert(charities)
      .values(charity)
      .returning();
    return newCharity;
  }

  async getCharities(): Promise<Charity[]> {
    return db
      .select()
      .from(charities)
      .orderBy(desc(charities.isFeatured), charities.name);
  }

  async getVerifiedCharities(): Promise<Charity[]> {
    return db
      .select()
      .from(charities)
      .where(eq(charities.status, CHARITY_STATUS.APPROVED))
      .orderBy(desc(charities.isFeatured), charities.name);
  }

  async getCharitiesByCategory(category: string): Promise<Charity[]> {
    return db
      .select()
      .from(charities)
      .where(and(
        eq(charities.category, category),
        eq(charities.status, CHARITY_STATUS.APPROVED)
      ))
      .orderBy(desc(charities.isFeatured), charities.name);
  }

  async getCharityById(id: string): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.id, id));
    return charity || undefined;
  }

  async updateCharityStatus(id: string, status: string, verifiedAt?: Date): Promise<Charity | undefined> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (verifiedAt) {
      updateData.verifiedAt = verifiedAt;
    }
    const [updated] = await db
      .update(charities)
      .set(updateData)
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async getPendingCharities(): Promise<Charity[]> {
    return db
      .select()
      .from(charities)
      .where(eq(charities.status, CHARITY_STATUS.PENDING))
      .orderBy(desc(charities.createdAt));
  }

  async getCharityByEmail(email: string): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.email, email));
    return charity || undefined;
  }

  async getCharityByEin(ein: string): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.registrationNumber, ein));
    return charity || undefined;
  }

  async getCharityByEmailToken(token: string): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.emailVerificationToken, token));
    return charity || undefined;
  }

  async setCharityVerificationTokens(id: string, emailToken: string, walletNonce: string): Promise<Charity | undefined> {
    const [updated] = await db
      .update(charities)
      .set({
        emailVerificationToken: emailToken,
        walletVerificationNonce: walletNonce,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCharityWithEveryOrgData(id: string, data: {
    everyOrgId: string;
    everyOrgSlug: string;
    everyOrgName: string;
    everyOrgDescription: string;
    everyOrgWebsite: string;
    everyOrgLogoUrl: string;
    everyOrgIsDisbursable: boolean;
    registrationNumber: string;
  }): Promise<Charity | undefined> {
    const [updated] = await db
      .update(charities)
      .set({
        everyOrgId: data.everyOrgId,
        everyOrgSlug: data.everyOrgSlug,
        everyOrgName: data.everyOrgName,
        everyOrgDescription: data.everyOrgDescription,
        everyOrgWebsite: data.everyOrgWebsite,
        everyOrgLogoUrl: data.everyOrgLogoUrl,
        everyOrgIsDisbursable: data.everyOrgIsDisbursable,
        everyOrgVerified: true,
        everyOrgVerifiedAt: new Date(),
        registrationNumber: data.registrationNumber,
        status: CHARITY_STATUS.EIN_VERIFIED,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCharityEmailVerification(id: string, emailVerifiedAt: Date): Promise<Charity | undefined> {
    const [updated] = await db
      .update(charities)
      .set({
        emailVerifiedAt,
        status: CHARITY_STATUS.EMAIL_VERIFIED,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCharityWalletVerification(id: string, walletVerifiedAt: Date): Promise<Charity | undefined> {
    const [updated] = await db
      .update(charities)
      .set({
        walletVerifiedAt,
        status: CHARITY_STATUS.WALLET_VERIFIED,
        updatedAt: new Date(),
      })
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCharityXHandle(id: string, twitterHandle: string, verified: boolean): Promise<Charity | undefined> {
    const [updated] = await db
      .update(charities)
      .set({
        twitterHandle,
        xHandleVerified: verified,
        payoutMethod: 'twitter',
        updatedAt: new Date(),
      })
      .where(eq(charities.id, id))
      .returning();
    return updated || undefined;
  }

  async getDefaultCharity(): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.isDefault, true));
    return charity || undefined;
  }

  async seedDefaultCharities(): Promise<void> {
    // Seed all vetted charities - insert new or update existing
    for (let i = 0; i < VETTED_CHARITIES.length; i++) {
      const charity = VETTED_CHARITIES[i];
      const existing = await this.getCharityById(charity.id);
      if (!existing) {
        await db.insert(charities).values({
          id: charity.id,
          name: charity.name,
          description: charity.description,
          category: charity.category,
          website: charity.website,
          walletAddress: isValidSolanaPublicKey(charity.wallet) ? charity.wallet : null,
          twitterHandle: charity.twitterHandle,
          payoutMethod: charity.payoutMethod,
          countryCode: charity.countryCode,
          countryName: charity.countryName,
          status: CHARITY_STATUS.APPROVED,
          isDefault: i === 0, // First one is default
          isFeatured: i < 10, // First 10 are featured
        });
      } else {
        // Update existing charity with Twitter handle, payout method, and country info
        await db.update(charities)
          .set({
            twitterHandle: charity.twitterHandle,
            payoutMethod: charity.payoutMethod,
            countryCode: charity.countryCode,
            countryName: charity.countryName,
            updatedAt: new Date(),
          })
          .where(eq(charities.id, charity.id));
      }
    }
    
    // Clean up duplicate Food Yoga International entries (keep the canonical one)
    const foodYogaCharities = await db
      .select()
      .from(charities)
      .where(eq(charities.name, "Food Yoga International"));
    
    if (foodYogaCharities.length > 1) {
      // Keep the one with the expected ID, delete others
      const toDelete = foodYogaCharities.filter(c => c.id !== "food-yoga-international");
      for (const dup of toDelete) {
        await db.delete(charities).where(eq(charities.id, dup.id));
      }
    }
  }

  // Audit methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  // Most recent audit action that approved this token (charity email flow, charity portal or admin)
  async getLatestTokenApprovalAction(tokenId: string): Promise<string | undefined> {
    const [log] = await db
      .select({ action: auditLogs.action })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.entityType, "token"),
        eq(auditLogs.entityId, tokenId),
        inArray(auditLogs.action, ["TOKEN_APPROVED_BY_CHARITY", "TOKEN_APPROVED_VIA_PORTAL", "admin_token_approved"])
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1);
    return log?.action;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Token methods
  async createLaunchedToken(token: InsertLaunchedToken): Promise<LaunchedToken> {
    const [newToken] = await db
      .insert(launchedTokens)
      .values(token)
      .returning();
    return newToken;
  }

  // Public token figures (charityDonated, donationCount) only count donations
  // with a real on-chain signature. Stored values are launch-time estimates.
  private async withVerifiedDonations(tokens: LaunchedToken[]): Promise<LaunchedToken[]> {
    const allDonations = await this.getDonations();
    return tokens.map((token) => {
      const { totalDonated, donationCount } = verifiedDonationTotals(
        allDonations.filter((d) => d.tokenMint === token.mintAddress),
      );
      return { ...token, charityDonated: totalDonated, donationCount };
    });
  }

  // Public list: live tokens whose launch has a real on-chain signature
  async getLaunchedTokens(): Promise<LaunchedToken[]> {
    const tokens = await db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.isTest, false))
      .orderBy(desc(launchedTokens.launchedAt));
    return this.withVerifiedDonations(
      tokens.filter((t) => isValidTxSignature(t.transactionSignature)),
    );
  }

  async getLaunchedTokenByMint(mintAddress: string): Promise<LaunchedToken | undefined> {
    const [token] = await db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.mintAddress, mintAddress));
    return token || undefined;
  }

  async updateTokenStats(
    mintAddress: string, 
    volume: string, 
    donated: string
  ): Promise<LaunchedToken | undefined> {
    // First get current stats to calculate the difference
    const currentToken = await this.getLaunchedTokenByMint(mintAddress);
    const currentDonated = currentToken ? parseFloat(currentToken.charityDonated || "0") : 0;
    const newDonated = parseFloat(donated);
    const donationDiff = newDonated - currentDonated;
    
    const updateData: Record<string, unknown> = {
      tradingVolume: volume,
      charityDonated: donated,
    };
    
    // Only increment donation count if there's a new donation
    if (donationDiff > 0) {
      updateData.donationCount = sql`COALESCE(${launchedTokens.donationCount}, 0) + 1`;
      updateData.lastDonationAt = new Date();
    }
    
    const [updated] = await db
      .update(launchedTokens)
      .set(updateData)
      .where(eq(launchedTokens.mintAddress, mintAddress))
      .returning();
    return updated || undefined;
  }

  async updateLaunchedToken(id: string, updates: Partial<LaunchedToken>): Promise<LaunchedToken | undefined> {
    const [updated] = await db
      .update(launchedTokens)
      .set(updates)
      .where(eq(launchedTokens.id, id))
      .returning();
    return updated || undefined;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db
      .insert(donations)
      .values(donation)
      .returning();
    
    // Update the token's donation count and last donation timestamp
    await db
      .update(launchedTokens)
      .set({
        donationCount: sql`COALESCE(${launchedTokens.donationCount}, 0) + 1`,
        lastDonationAt: new Date(),
      })
      .where(eq(launchedTokens.mintAddress, donation.tokenMint));
    
    return newDonation;
  }

  async getDonations(): Promise<Donation[]> {
    return db
      .select()
      .from(donations)
      .orderBy(desc(donations.donatedAt));
  }

  async getDashboardStats(): Promise<{
    totalTokens: number;
    totalDonated: string;
    totalVolume: string;
    totalPlatformFees: string;
  }> {
    // Same token set as the public list; donations only count with a real signature.
    // totalVolume and totalPlatformFees are launch-time figures and are labelled as such in the UI.
    const tokens = await this.getLaunchedTokens();
    const sum = (pick: (t: LaunchedToken) => string | null) =>
      tokens.reduce((total, t) => total + parseFloat(pick(t) || "0"), 0).toFixed(9);

    return {
      totalTokens: tokens.length,
      totalDonated: sum((t) => t.charityDonated),
      totalVolume: sum((t) => t.tradingVolume),
      totalPlatformFees: sum((t) => t.platformFeeCollected),
    };
  }

  async getTokensByCreator(creatorWallet: string): Promise<LaunchedToken[]> {
    const tokens = await db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.creatorWallet, creatorWallet))
      .orderBy(desc(launchedTokens.launchedAt));
    return this.withVerifiedDonations(tokens);
  }

  async getDonationsByToken(tokenMint: string): Promise<Donation[]> {
    return db
      .select()
      .from(donations)
      .where(eq(donations.tokenMint, tokenMint))
      .orderBy(desc(donations.donatedAt));
  }

  async getTokenImpact(mintAddress: string): Promise<{
    totalDonated: string;
    donationCount: number;
    recentDonations: Donation[];
  } | null> {
    const token = await this.getLaunchedTokenByMint(mintAddress);
    if (!token) return null;

    // Totals only count donations with a real on-chain signature.
    // recentDonations keeps unconfirmed records so the UI can show them as pending.
    const tokenDonations = await this.getDonationsByToken(mintAddress);

    return {
      ...verifiedDonationTotals(tokenDonations),
      recentDonations: tokenDonations.slice(0, 10),
    };
  }

  // Buyback methods
  async createBuyback(buyback: InsertBuyback): Promise<Buyback> {
    const [newBuyback] = await db
      .insert(buybacks)
      .values(buyback)
      .returning();
    return newBuyback;
  }

  async getAllBuybacks(): Promise<Buyback[]> {
    return db
      .select()
      .from(buybacks)
      .orderBy(desc(buybacks.executedAt));
  }

  // Token approval methods
  async getTokensPendingApproval(): Promise<LaunchedToken[]> {
    const tokens = await db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.charityApprovalStatus, "pending"))
      .orderBy(desc(launchedTokens.launchedAt));
    return this.withVerifiedDonations(tokens);
  }

  async getTokensByCharityEmail(charityEmail: string): Promise<LaunchedToken[]> {
    const tokens = await db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.charityEmail, charityEmail))
      .orderBy(desc(launchedTokens.launchedAt));
    return this.withVerifiedDonations(tokens);
  }

  async updateTokenApprovalStatus(
    tokenId: string,
    status: string,
    note?: string
  ): Promise<LaunchedToken | undefined> {
    const [updated] = await db
      .update(launchedTokens)
      .set({
        charityApprovalStatus: status,
        charityApprovalNote: note || null,
        charityRespondedAt: new Date(),
      })
      .where(eq(launchedTokens.id, tokenId))
      .returning();
    return updated;
  }

  async searchTokensByName(name: string): Promise<{ name: string; symbol: string; mintAddress: string }[]> {
    const normalizedName = name.toLowerCase().trim();
    if (normalizedName.length < 2) return [];
    
    const results = await db
      .select({
        name: launchedTokens.name,
        symbol: launchedTokens.symbol,
        mintAddress: launchedTokens.mintAddress,
      })
      .from(launchedTokens)
      .where(sql`LOWER(${launchedTokens.name}) LIKE ${`%${normalizedName}%`}`)
      .limit(10);
    
    return results;
  }
}

export const storage = new DatabaseStorage();
