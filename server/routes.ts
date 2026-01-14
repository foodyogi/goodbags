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

  return httpServer;
}
