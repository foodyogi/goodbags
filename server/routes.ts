import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tokenLaunchFormSchema, CHARITY_WALLET, CHARITY_FEE_PERCENTAGE } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Launch a new token
  app.post("/api/tokens/launch", async (req, res) => {
    try {
      const body = req.body;
      
      // Validate the request body
      const launchSchema = tokenLaunchFormSchema.extend({
        creatorWallet: z.string().min(32, "Invalid wallet address"),
      });
      
      const validated = launchSchema.parse(body);
      
      // Generate a mock mint address for now (in production, this comes from the SDK)
      const mockMintAddress = `mint${randomUUID().replace(/-/g, "").slice(0, 40)}`;
      const mockTxSignature = `tx${randomUUID().replace(/-/g, "")}`;
      
      // Calculate initial charity donation (1% of initial buy)
      const initialBuy = parseFloat(validated.initialBuyAmount) || 0;
      const charityDonation = (initialBuy * CHARITY_FEE_PERCENTAGE / 100).toFixed(9);
      
      // Create the token record
      const token = await storage.createLaunchedToken({
        name: validated.name,
        symbol: validated.symbol,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        mintAddress: mockMintAddress,
        creatorWallet: validated.creatorWallet,
        initialBuyAmount: validated.initialBuyAmount,
        charityDonated: charityDonation,
        tradingVolume: validated.initialBuyAmount,
        transactionSignature: mockTxSignature,
      });
      
      // Record the donation if there was an initial buy
      if (initialBuy > 0) {
        await storage.createDonation({
          tokenMint: mockMintAddress,
          amount: charityDonation,
          charityWallet: CHARITY_WALLET,
          transactionSignature: `donation${randomUUID().replace(/-/g, "")}`,
        });
      }
      
      res.json({
        success: true,
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          transactionSignature: token.transactionSignature,
        },
      });
    } catch (error) {
      console.error("Token launch error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.errors.map(e => e.message).join(", "),
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to launch token",
        });
      }
    }
  });
  
  // Get all launched tokens
  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getLaunchedTokens();
      res.json(tokens);
    } catch (error) {
      console.error("Get tokens error:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });
  
  // Get dashboard data
  app.get("/api/dashboard", async (req, res) => {
    try {
      const [tokens, donations, stats] = await Promise.all([
        storage.getLaunchedTokens(),
        storage.getDonations(),
        storage.getDashboardStats(),
      ]);
      
      res.json({
        tokens,
        donations,
        stats,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  
  // Get donations
  app.get("/api/donations", async (req, res) => {
    try {
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      console.error("Get donations error:", error);
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  // Get tokens by creator wallet
  app.get("/api/tokens/creator/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const tokens = await storage.getTokensByCreator(wallet);
      res.json(tokens);
    } catch (error) {
      console.error("Get creator tokens error:", error);
      res.status(500).json({ error: "Failed to fetch creator tokens" });
    }
  });

  // Get token impact data
  app.get("/api/tokens/:mint/impact", async (req, res) => {
    try {
      const { mint } = req.params;
      const token = await storage.getLaunchedTokenByMint(mint);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }

      const impact = await storage.getTokenImpact(mint);
      
      res.json({
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          imageUrl: token.imageUrl,
          creatorWallet: token.creatorWallet,
          launchedAt: token.launchedAt,
        },
        impact: impact || {
          totalDonated: "0",
          donationCount: 0,
          recentDonations: [],
        },
        charityInfo: {
          name: "Food Yoga International",
          wallet: CHARITY_WALLET,
          feePercentage: CHARITY_FEE_PERCENTAGE,
        },
      });
    } catch (error) {
      console.error("Get token impact error:", error);
      res.status(500).json({ error: "Failed to fetch token impact" });
    }
  });

  // Get creator impact summary (all tokens for a wallet)
  app.get("/api/creator/:wallet/impact", async (req, res) => {
    try {
      const { wallet } = req.params;
      const tokens = await storage.getTokensByCreator(wallet);
      
      let totalDonated = 0;
      let totalDonationCount = 0;
      const tokenImpacts = [];

      for (const token of tokens) {
        const impact = await storage.getTokenImpact(token.mintAddress);
        if (impact) {
          totalDonated += parseFloat(impact.totalDonated);
          totalDonationCount += impact.donationCount;
          tokenImpacts.push({
            token: {
              id: token.id,
              name: token.name,
              symbol: token.symbol,
              mintAddress: token.mintAddress,
              imageUrl: token.imageUrl,
            },
            donated: impact.totalDonated,
            donationCount: impact.donationCount,
          });
        }
      }

      res.json({
        creatorWallet: wallet,
        totalTokens: tokens.length,
        totalDonated: totalDonated.toFixed(9),
        totalDonationCount,
        tokens: tokenImpacts,
        charityInfo: {
          name: "Food Yoga International",
          wallet: CHARITY_WALLET,
        },
        certified: totalDonated >= 0.001, // Certified if at least 0.001 SOL donated
      });
    } catch (error) {
      console.error("Get creator impact error:", error);
      res.status(500).json({ error: "Failed to fetch creator impact" });
    }
  });

  return httpServer;
}
