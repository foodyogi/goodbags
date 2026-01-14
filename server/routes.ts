import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  CHARITY_FEE_PERCENTAGE, 
  PLATFORM_FEE_PERCENTAGE,
  tokenLaunchFormSchema,
  type Charity,
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Extend the shared schema with creatorWallet for server-side validation
const tokenLaunchRequestSchema = tokenLaunchFormSchema.extend({
  creatorWallet: z.string().min(32, "Invalid wallet address"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed default charities on startup
  await storage.seedDefaultCharities();

  // === CHARITY ENDPOINTS ===
  
  // Get all verified charities
  app.get("/api/charities", async (req, res) => {
    try {
      const charities = await storage.getVerifiedCharities();
      res.json(charities);
    } catch (error) {
      console.error("Get charities error:", error);
      res.status(500).json({ error: "Failed to fetch charities" });
    }
  });

  // Get charity by ID
  app.get("/api/charities/:id", async (req, res) => {
    try {
      const charity = await storage.getCharityById(req.params.id);
      if (!charity) {
        return res.status(404).json({ error: "Charity not found" });
      }
      res.json(charity);
    } catch (error) {
      console.error("Get charity error:", error);
      res.status(500).json({ error: "Failed to fetch charity" });
    }
  });

  // === TOKEN ENDPOINTS ===
  
  // Launch a new token
  app.post("/api/tokens/launch", async (req, res) => {
    try {
      const validated = tokenLaunchRequestSchema.parse(req.body);
      
      // Get the selected charity
      let charity: Charity | undefined = await storage.getCharityById(validated.charityId);
      
      if (!charity) {
        // Fall back to default charity
        charity = await storage.getDefaultCharity();
      }
      
      if (!charity) {
        return res.status(400).json({
          success: false,
          error: "No charity selected and no default available",
        });
      }
      
      // Generate a mock mint address for now (in production, this comes from the SDK)
      const mockMintAddress = `mint${randomUUID().replace(/-/g, "").slice(0, 40)}`;
      const mockTxSignature = `tx${randomUUID().replace(/-/g, "")}`;
      
      // Calculate fees
      const initialBuy = parseFloat(validated.initialBuyAmount) || 0;
      const charityDonation = (initialBuy * CHARITY_FEE_PERCENTAGE / 100).toFixed(9);
      const platformFee = (initialBuy * PLATFORM_FEE_PERCENTAGE / 100).toFixed(9);
      
      // Create the token record
      const token = await storage.createLaunchedToken({
        name: validated.name,
        symbol: validated.symbol,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        mintAddress: mockMintAddress,
        creatorWallet: validated.creatorWallet,
        charityId: charity.id,
        initialBuyAmount: validated.initialBuyAmount,
        charityDonated: charityDonation,
        platformFeeCollected: platformFee,
        tradingVolume: validated.initialBuyAmount,
        transactionSignature: mockTxSignature,
      });

      // Log the launch
      await storage.createAuditLog({
        action: "TOKEN_LAUNCHED",
        entityType: "token",
        entityId: token.id,
        actorWallet: validated.creatorWallet,
        details: JSON.stringify({ 
          name: validated.name, 
          charityId: charity.id, 
          charityName: charity.name,
          initialBuy,
        }),
      });
      
      // Record the donation if there was an initial buy and charity has a wallet
      if (initialBuy > 0 && charity.walletAddress) {
        await storage.createDonation({
          tokenMint: mockMintAddress,
          amount: charityDonation,
          charityWallet: charity.walletAddress,
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
        charity: {
          id: charity.id,
          name: charity.name,
          status: charity.status,
          hasWallet: !!charity.walletAddress,
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
      
      // Get the charity for this token
      let charity: Charity | undefined;
      if (token.charityId) {
        charity = await storage.getCharityById(token.charityId);
      }
      if (!charity) {
        charity = await storage.getDefaultCharity();
      }
      
      res.json({
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          imageUrl: token.imageUrl,
          creatorWallet: token.creatorWallet,
          launchedAt: token.launchedAt,
          charityId: token.charityId,
        },
        impact: impact || {
          totalDonated: "0",
          donationCount: 0,
          recentDonations: [],
        },
        charityInfo: charity ? {
          id: charity.id,
          name: charity.name,
          wallet: charity.walletAddress,
          category: charity.category,
          status: charity.status,
          feePercentage: CHARITY_FEE_PERCENTAGE,
          platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
        } : null,
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
      const charitiesMap = new Map<string, Charity>();

      for (const token of tokens) {
        const impact = await storage.getTokenImpact(token.mintAddress);
        
        // Get charity info for this token
        let charity: Charity | undefined;
        if (token.charityId) {
          if (charitiesMap.has(token.charityId)) {
            charity = charitiesMap.get(token.charityId);
          } else {
            charity = await storage.getCharityById(token.charityId);
            if (charity) charitiesMap.set(token.charityId, charity);
          }
        }
        
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
            charity: charity ? {
              id: charity.id,
              name: charity.name,
              category: charity.category,
            } : null,
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
        charities: Array.from(charitiesMap.values()).map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          wallet: c.walletAddress,
        })),
        certified: totalDonated >= 0.001,
      });
    } catch (error) {
      console.error("Get creator impact error:", error);
      res.status(500).json({ error: "Failed to fetch creator impact" });
    }
  });

  return httpServer;
}
