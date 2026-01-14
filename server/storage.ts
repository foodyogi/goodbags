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
  updateTokenStats(mintAddress: string, volume: string, donated: string): Promise<LaunchedToken | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDashboardStats(): Promise<{
    totalTokens: number;
    totalDonated: string;
    totalVolume: string;
  }>;
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
    const [updated] = await db
      .update(launchedTokens)
      .set({
        tradingVolume: volume,
        charityDonated: donated,
      })
      .where(eq(launchedTokens.mintAddress, mintAddress))
      .returning();
    return updated || undefined;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db
      .insert(donations)
      .values(donation)
      .returning();
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
}

export const storage = new DatabaseStorage();
