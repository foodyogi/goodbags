import { 
  launchedTokens, 
  donations,
  type LaunchedToken, 
  type InsertLaunchedToken,
  type Donation,
  type InsertDonation 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  createLaunchedToken(token: InsertLaunchedToken): Promise<LaunchedToken>;
  getLaunchedTokens(): Promise<LaunchedToken[]>;
  getLaunchedTokenByMint(mintAddress: string): Promise<LaunchedToken | undefined>;
  getTokensByCreator(creatorWallet: string): Promise<LaunchedToken[]>;
  updateTokenStats(mintAddress: string, volume: string, donated: string): Promise<LaunchedToken | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDonationsByToken(tokenMint: string): Promise<Donation[]>;
  getDashboardStats(): Promise<{
    totalTokens: number;
    totalDonated: string;
    totalVolume: string;
  }>;
  getTokenImpact(mintAddress: string): Promise<{
    totalDonated: string;
    donationCount: number;
    recentDonations: Donation[];
  } | null>;
}

export class DatabaseStorage implements IStorage {
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
  }> {
    const [tokenStats] = await db
      .select({
        count: sql<number>`count(*)`,
        totalVolume: sql<string>`coalesce(sum(${launchedTokens.tradingVolume}::numeric), 0)`,
        totalDonated: sql<string>`coalesce(sum(${launchedTokens.charityDonated}::numeric), 0)`,
      })
      .from(launchedTokens);

    return {
      totalTokens: Number(tokenStats?.count ?? 0),
      totalDonated: String(tokenStats?.totalDonated ?? "0"),
      totalVolume: String(tokenStats?.totalVolume ?? "0"),
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
}

export const storage = new DatabaseStorage();
