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
import { eq, desc, sql, and } from "drizzle-orm";

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
  getDefaultCharity(): Promise<Charity | undefined>;
  seedDefaultCharities(): Promise<void>;
  
  // Token methods
  createLaunchedToken(token: InsertLaunchedToken): Promise<LaunchedToken>;
  getLaunchedTokens(): Promise<LaunchedToken[]>;
  getLaunchedTokenByMint(mintAddress: string): Promise<LaunchedToken | undefined>;
  getTokensByCreator(creatorWallet: string): Promise<LaunchedToken[]>;
  updateTokenStats(mintAddress: string, volume: string, donated: string): Promise<LaunchedToken | undefined>;
  
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

  async getDefaultCharity(): Promise<Charity | undefined> {
    const [charity] = await db
      .select()
      .from(charities)
      .where(eq(charities.isDefault, true));
    return charity || undefined;
  }

  async seedDefaultCharities(): Promise<void> {
    // Seed all vetted charities
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
          walletAddress: charity.wallet,
          status: CHARITY_STATUS.APPROVED,
          isDefault: i === 0, // First one is default
          isFeatured: true,
        });
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

  async getLaunchedTokens(): Promise<LaunchedToken[]> {
    return db
      .select()
      .from(launchedTokens)
      .orderBy(desc(launchedTokens.launchedAt));
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
    const [tokenStats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalVolume: sql<string>`coalesce(sum(${launchedTokens.tradingVolume}::numeric), 0)`,
        totalDonated: sql<string>`coalesce(sum(${launchedTokens.charityDonated}::numeric), 0)`,
        totalPlatformFees: sql<string>`coalesce(sum(${launchedTokens.platformFeeCollected}::numeric), 0)`,
      })
      .from(launchedTokens);

    return {
      totalTokens: Number(tokenStats?.count ?? 0),
      totalDonated: String(tokenStats?.totalDonated ?? "0"),
      totalVolume: String(tokenStats?.totalVolume ?? "0"),
      totalPlatformFees: String(tokenStats?.totalPlatformFees ?? "0"),
    };
  }

  async getTokensByCreator(creatorWallet: string): Promise<LaunchedToken[]> {
    return db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.creatorWallet, creatorWallet))
      .orderBy(desc(launchedTokens.launchedAt));
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

    const tokenDonations = await this.getDonationsByToken(mintAddress);
    const totalDonated = tokenDonations.reduce(
      (sum, d) => sum + parseFloat(d.amount),
      0
    );

    return {
      totalDonated: totalDonated.toFixed(9),
      donationCount: tokenDonations.length,
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
    return db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.charityApprovalStatus, "pending"))
      .orderBy(desc(launchedTokens.launchedAt));
  }

  async getTokensByCharityEmail(charityEmail: string): Promise<LaunchedToken[]> {
    return db
      .select()
      .from(launchedTokens)
      .where(eq(launchedTokens.charityEmail, charityEmail))
      .orderBy(desc(launchedTokens.launchedAt));
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
}

export const storage = new DatabaseStorage();
