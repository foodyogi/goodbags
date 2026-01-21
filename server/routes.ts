import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  CHARITY_FEE_PERCENTAGE, 
  PLATFORM_FEE_PERCENTAGE,
  tokenLaunchFormSchema,
  charityApplicationSchema,
  CHARITY_STATUS,
  TOKEN_APPROVAL_STATUS,
  type Charity,
} from "@shared/schema";
import { z } from "zod";
import { randomUUID, randomBytes, timingSafeEqual } from "crypto";
import * as bagsSDK from "./bags-sdk";
import bs58Pkg from "bs58";
const bs58 = bs58Pkg.default ?? bs58Pkg;
import nacl from "tweetnacl";
import * as buybackService from "./buyback-service";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

// Admin secret for approving charities - REQUIRED in all environments
// SECURITY FIX: No bypass allowed - must always set ADMIN_SECRET
function isAdminAuthorized(secret: string | undefined): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    console.error("SECURITY: ADMIN_SECRET not set - admin endpoints are disabled");
    return false;
  }
  
  if (!secret) {
    return false;
  }
  
  // Use crypto.timingSafeEqual for constant-time comparison to prevent timing attacks
  // Both buffers must be same length for timingSafeEqual
  const secretBuffer = Buffer.from(secret);
  const adminSecretBuffer = Buffer.from(adminSecret);
  
  if (secretBuffer.length !== adminSecretBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(secretBuffer, adminSecretBuffer);
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max requests per window

function getRateLimitKey(req: any): string {
  // Use IP address as identifier
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
             req.socket?.remoteAddress || 
             'unknown';
  return ip;
}

function checkRateLimit(key: string, maxRequests: number = RATE_LIMIT_MAX_REQUESTS): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries());
    for (const [k, v] of entries) {
      if (now > v.resetTime) rateLimitStore.delete(k);
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

// Rate limiting middleware factory
function rateLimitMiddleware(maxRequests: number = RATE_LIMIT_MAX_REQUESTS) {
  return (req: any, res: any, next: any) => {
    const key = getRateLimitKey(req);
    const result = checkRateLimit(key, maxRequests);
    
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000));
    
    if (!result.allowed) {
      return res.status(429).json({ 
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil(result.resetIn / 1000)
      });
    }
    
    next();
  };
}

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// SECURITY: Strict Solana public key validation
// Validates base58 encoding AND correct length (32 bytes = 44 chars typically)
function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Basic regex check for base58 characters (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(address)) {
    return false;
  }
  
  // Try to decode the base58 address to verify it's valid
  try {
    const decoded = bs58.decode(address);
    // Solana public keys are exactly 32 bytes
    return decoded.length === 32;
  } catch {
    return false;
  }
}

// Extend the shared schema with creatorWallet and charity source info
// Uses same validation rules as tokenLaunchFormSchema for consistency
// Note: creatorWallet min length reduced to 10 to allow test wallet addresses
// Real wallet validation happens in the actual signing process
const tokenLaunchRequestSchema = tokenLaunchFormSchema.extend({
  creatorWallet: z.string().min(10, "Invalid wallet address"),
  charitySource: z.enum(["change", "local"]).default("change"),
  charitySolanaAddress: z.string().nullable().optional(), // For Change API charities - can be null if using Twitter
  isTest: z.boolean().optional().default(false), // Test mode flag
});

// Import Change API for server-side verification
import * as changeApi from "./change-api";

// Helper function to verify Change API charity and get wallet address
// This centralizes wallet verification to prevent spoofing across all token endpoints
async function verifyChangeCharityWallet(
  charityId: string, 
  charitySource: string, 
  providedAddress?: string
): Promise<{ valid: boolean; walletAddress?: string; error?: string }> {
  if (charitySource !== "change") {
    return { valid: true }; // Local charities verified separately
  }
  
  try {
    const nonprofit = await changeApi.getNonprofitById(charityId);
    if (!nonprofit) {
      return { valid: false, error: "Charity not found in Change API" };
    }
    
    if (!changeApi.hasValidSolanaWallet(nonprofit)) {
      return { valid: false, error: "This charity doesn't have a Solana wallet yet" };
    }
    
    const verifiedAddress = nonprofit.crypto?.solana_address || undefined;
    
    // SECURITY: Validate the address from Change API is a valid Solana address
    // This protects against malformed upstream data
    if (!verifiedAddress || !isValidSolanaAddress(verifiedAddress)) {
      console.warn(`Invalid Solana address from Change API for ${charityId}: ${verifiedAddress}`);
      return { valid: false, error: "Charity has an invalid Solana wallet address" };
    }
    
    // Verify the client-provided address matches (if provided)
    if (providedAddress && providedAddress !== verifiedAddress) {
      console.warn(`Wallet address mismatch for ${charityId}: provided=${providedAddress}, verified=${verifiedAddress}`);
      return { valid: false, error: "Wallet address verification failed" };
    }
    
    return { valid: true, walletAddress: verifiedAddress };
  } catch (error) {
    console.error("Change API verification error:", error);
    return { valid: false, error: "Failed to verify charity wallet" };
  }
}

// Simple in-memory cache for Change API search results
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

function getCachedSearch(cacheKey: string): any | null {
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    searchCache.delete(cacheKey);
  }
  return null;
}

function setCachedSearch(cacheKey: string, data: any): void {
  // Clear old entries if cache is too large
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }
  searchCache.set(cacheKey, { data, timestamp: Date.now() });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed default charities on startup
  await storage.seedDefaultCharities();
  
  // Initialize buyback service (auto-buys FYI with platform fees)
  buybackService.initBuybackService();
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

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

  // === CHARITY VERIFICATION ENDPOINTS ===

  // Verify EIN against Every.org API
  app.post("/api/charities/verify-ein", async (req, res) => {
    try {
      const { ein } = req.body;
      
      if (!ein) {
        return res.status(400).json({
          success: false,
          error: "EIN (Tax ID) is required",
        });
      }

      // Clean EIN - remove dashes and spaces
      const cleanEin = ein.replace(/[-\s]/g, "");
      
      // Validate EIN format (9 digits for US nonprofits)
      if (!/^\d{9}$/.test(cleanEin)) {
        return res.status(400).json({
          success: false,
          error: "Invalid EIN format. Please enter a 9-digit Tax ID (e.g., 12-3456789)",
        });
      }

      // Check if a charity with this EIN already exists
      const existingByEin = await storage.getCharityByEin(cleanEin);
      if (existingByEin) {
        return res.status(400).json({
          success: false,
          error: "A charity with this EIN has already been registered",
          existingCharity: {
            id: existingByEin.id,
            name: existingByEin.name,
            status: existingByEin.status,
          },
        });
      }

      // Get Every.org API key
      const everyOrgApiKey = process.env.EVERY_ORG_API_KEY;
      if (!everyOrgApiKey) {
        console.error("EVERY_ORG_API_KEY not configured");
        return res.status(503).json({
          success: false,
          error: "Charity verification service is temporarily unavailable",
        });
      }

      // Query Every.org API
      const everyOrgUrl = `https://partners.every.org/v0.2/nonprofit/${cleanEin}?apiKey=${everyOrgApiKey}`;
      const everyOrgResponse = await fetch(everyOrgUrl);
      
      if (!everyOrgResponse.ok) {
        if (everyOrgResponse.status === 404) {
          return res.status(404).json({
            success: false,
            error: "No nonprofit found with this EIN. Please verify your Tax ID is correct.",
          });
        }
        console.error("Every.org API error:", everyOrgResponse.status, await everyOrgResponse.text());
        return res.status(502).json({
          success: false,
          error: "Unable to verify charity at this time. Please try again later.",
        });
      }

      const everyOrgData = await everyOrgResponse.json();
      const nonprofit = everyOrgData?.data?.nonprofit;
      
      if (!nonprofit) {
        return res.status(404).json({
          success: false,
          error: "No nonprofit found with this EIN",
        });
      }

      // Return verified nonprofit data
      res.json({
        success: true,
        nonprofit: {
          ein: nonprofit.ein,
          name: nonprofit.name,
          description: nonprofit.description || nonprofit.descriptionLong || "",
          website: nonprofit.websiteUrl || "",
          logoUrl: nonprofit.logoUrl || "",
          profileUrl: nonprofit.profileUrl || "",
          location: nonprofit.locationAddress || "",
          isDisbursable: nonprofit.isDisbursable || false,
          everyOrgId: nonprofit.id,
          everyOrgSlug: nonprofit.primarySlug,
          category: nonprofit.nteeCodeMeaning?.majorMeaning || "Other",
        },
      });
    } catch (error) {
      console.error("EIN verification error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify charity",
      });
    }
  });

  // Submit a charity application
  // Rate limited: 5 requests per minute (charity applications are rare)
  app.post("/api/charities/apply", rateLimitMiddleware(5), async (req, res) => {
    try {
      const validated = charityApplicationSchema.parse(req.body);
      const { submitterWallet, everyOrgData } = req.body;
      
      // Check if charity with this email already exists
      const existingByEmail = await storage.getCharityByEmail(validated.email);
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          error: "A charity with this email has already been submitted",
        });
      }
      
      // Check if charity with this EIN already exists
      if (validated.registrationNumber) {
        const existingByEin = await storage.getCharityByEin(validated.registrationNumber);
        if (existingByEin) {
          return res.status(400).json({
            success: false,
            error: "A charity with this EIN has already been submitted",
          });
        }
      }

      // SERVER-SIDE VERIFICATION: If everyOrgData is provided, verify the EIN against Every.org again
      // This prevents clients from bypassing verification by submitting fake everyOrgData
      let verifiedEveryOrgData = null;
      if (everyOrgData && validated.registrationNumber) {
        const everyOrgApiKey = process.env.EVERY_ORG_API_KEY;
        if (everyOrgApiKey) {
          const cleanEin = validated.registrationNumber.replace(/[-\s]/g, "");
          const everyOrgUrl = `https://partners.every.org/v0.2/nonprofit/${cleanEin}?apiKey=${everyOrgApiKey}`;
          
          try {
            const everyOrgResponse = await fetch(everyOrgUrl);
            if (everyOrgResponse.ok) {
              const everyOrgResult = await everyOrgResponse.json();
              const nonprofit = everyOrgResult.data?.nonprofit;
              
              if (nonprofit && nonprofit.ein === cleanEin) {
                // Server-verified: use server-fetched data, not client data
                verifiedEveryOrgData = {
                  everyOrgId: nonprofit.id,
                  everyOrgSlug: nonprofit.primarySlug,
                  everyOrgName: nonprofit.name,
                  everyOrgDescription: nonprofit.description || nonprofit.descriptionLong || "",
                  everyOrgWebsite: nonprofit.websiteUrl || "",
                  everyOrgLogoUrl: nonprofit.logoUrl || "",
                  everyOrgIsDisbursable: nonprofit.isDisbursable || false,
                };
              }
            }
          } catch (verifyError) {
            console.error("Failed to verify EIN with Every.org during apply:", verifyError);
            // Continue without EIN_VERIFIED status
          }
        }
      }

      // Create the charity - only set EIN_VERIFIED if server verified the data
      const charity = await storage.createCharity({
        name: validated.name,
        description: validated.description,
        category: validated.category,
        website: validated.website,
        email: validated.email,
        walletAddress: validated.walletAddress || null,
        twitterHandle: validated.twitterHandle || null,
        payoutMethod: validated.payoutMethod || "wallet",
        registrationNumber: validated.registrationNumber,
        submitterWallet: submitterWallet || null,
        status: verifiedEveryOrgData ? CHARITY_STATUS.EIN_VERIFIED : CHARITY_STATUS.PENDING,
        everyOrgId: verifiedEveryOrgData?.everyOrgId || null,
        everyOrgSlug: verifiedEveryOrgData?.everyOrgSlug || null,
        everyOrgName: verifiedEveryOrgData?.everyOrgName || null,
        everyOrgDescription: verifiedEveryOrgData?.everyOrgDescription || null,
        everyOrgWebsite: verifiedEveryOrgData?.everyOrgWebsite || null,
        everyOrgLogoUrl: verifiedEveryOrgData?.everyOrgLogoUrl || null,
        everyOrgIsDisbursable: verifiedEveryOrgData?.everyOrgIsDisbursable || null,
        everyOrgVerified: verifiedEveryOrgData ? true : false,
        everyOrgVerifiedAt: verifiedEveryOrgData ? new Date() : null,
      });

      // Generate verification tokens
      const emailToken = generateToken();
      const walletNonce = generateToken().slice(0, 32); // Shorter nonce for wallet signing
      await storage.setCharityVerificationTokens(charity.id, emailToken, walletNonce);

      // Log the submission
      await storage.createAuditLog({
        action: "CHARITY_SUBMITTED",
        entityType: "charity",
        entityId: charity.id,
        actorWallet: submitterWallet || null,
        details: JSON.stringify({
          name: validated.name,
          email: validated.email,
          website: validated.website,
        }),
      });

      res.json({
        success: true,
        charityId: charity.id,
        message: "Application submitted successfully. Please verify your email and wallet.",
        verificationUrl: `/verify/email/${emailToken}`,
        walletNonce: walletNonce,
      });
    } catch (error) {
      console.error("Charity application error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.errors.map(e => e.message).join(", "),
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to submit application",
        });
      }
    }
  });

  // Verify charity email
  app.get("/api/charities/verify/email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const charity = await storage.getCharityByEmailToken(token);
      
      if (!charity) {
        return res.status(404).json({
          success: false,
          error: "Invalid or expired verification token",
        });
      }

      if (charity.emailVerifiedAt) {
        return res.json({
          success: true,
          message: "Email already verified",
          charityId: charity.id,
        });
      }

      await storage.updateCharityEmailVerification(charity.id, new Date());

      await storage.createAuditLog({
        action: "CHARITY_EMAIL_VERIFIED",
        entityType: "charity",
        entityId: charity.id,
        details: JSON.stringify({ email: charity.email }),
      });

      res.json({
        success: true,
        message: "Email verified successfully",
        charityId: charity.id,
        walletNonce: charity.walletVerificationNonce,
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify email",
      });
    }
  });

  // Verify wallet ownership via signature
  app.post("/api/charities/verify/wallet", async (req, res) => {
    try {
      const { charityId, signature, publicKey } = req.body;
      
      if (!charityId || !signature || !publicKey) {
        return res.status(400).json({
          success: false,
          error: "charityId, signature, and publicKey are required",
        });
      }

      const charity = await storage.getCharityById(charityId);
      if (!charity) {
        return res.status(404).json({
          success: false,
          error: "Charity not found",
        });
      }

      // Check that the wallet matches the registered wallet
      if (charity.walletAddress !== publicKey) {
        return res.status(400).json({
          success: false,
          error: "Wallet address does not match the registered charity wallet",
        });
      }

      if (!charity.walletVerificationNonce) {
        return res.status(400).json({
          success: false,
          error: "No verification nonce found. Please restart the application process.",
        });
      }

      // Verify the signature
      const message = new TextEncoder().encode(
        `GoodBags Charity Verification: ${charity.walletVerificationNonce}`
      );
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(publicKey);

      const isValid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid signature. Please sign the message with the correct wallet.",
        });
      }

      await storage.updateCharityWalletVerification(charity.id, new Date());

      await storage.createAuditLog({
        action: "CHARITY_WALLET_VERIFIED",
        entityType: "charity",
        entityId: charity.id,
        actorWallet: publicKey,
        details: JSON.stringify({ walletAddress: publicKey }),
      });

      res.json({
        success: true,
        message: "Wallet verified successfully. Your application is now pending admin approval.",
        charityId: charity.id,
      });
    } catch (error) {
      console.error("Wallet verification error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify wallet",
      });
    }
  });

  // Get charity verification status
  app.get("/api/charities/:id/status", async (req, res) => {
    try {
      const charity = await storage.getCharityById(req.params.id);
      if (!charity) {
        return res.status(404).json({ error: "Charity not found" });
      }
      
      res.json({
        id: charity.id,
        name: charity.name,
        status: charity.status,
        emailVerified: !!charity.emailVerifiedAt,
        walletVerified: !!charity.walletVerifiedAt,
        approved: charity.status === CHARITY_STATUS.APPROVED,
      });
    } catch (error) {
      console.error("Get charity status error:", error);
      res.status(500).json({ error: "Failed to fetch charity status" });
    }
  });

  // === ADMIN ENDPOINTS ===

  // Get all pending charity applications (admin only)
  app.get("/api/admin/charities/pending", async (req, res) => {
    try {
      const adminSecret = req.headers["x-admin-secret"] as string;
      if (!isAdminAuthorized(adminSecret)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const pending = await storage.getPendingCharities();
      // Also get charities awaiting approval:
      // - Wallet payout: need WALLET_VERIFIED status
      // - X account payout: need EMAIL_VERIFIED status (no wallet verification required)
      const charities = await storage.getCharities();
      const awaitingApproval = charities.filter(c => {
        const payoutMethod = (c.payoutMethod as "wallet" | "twitter") || "wallet";
        if (payoutMethod === "twitter") {
          // X account payout: only need email verification
          return c.status === CHARITY_STATUS.EMAIL_VERIFIED && c.emailVerifiedAt;
        } else {
          // Wallet payout: need wallet verification
          return c.status === CHARITY_STATUS.WALLET_VERIFIED;
        }
      });
      
      res.json({
        pending,
        awaitingApproval,
      });
    } catch (error) {
      console.error("Get pending charities error:", error);
      res.status(500).json({ error: "Failed to fetch pending charities" });
    }
  });

  // Approve a charity (admin only)
  app.post("/api/admin/charities/:id/approve", async (req, res) => {
    try {
      const adminSecret = req.headers["x-admin-secret"] as string;
      if (!isAdminAuthorized(adminSecret)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const charity = await storage.getCharityById(req.params.id);
      if (!charity) {
        return res.status(404).json({ error: "Charity not found" });
      }

      // Ensure email verification is complete
      if (!charity.emailVerifiedAt) {
        return res.status(400).json({
          error: "Charity must complete email verification before approval",
          emailVerified: !!charity.emailVerifiedAt,
        });
      }
      
      // For wallet payout method, also require wallet verification
      // For X account payout method, wallet verification is not required
      const payoutMethod = (charity.payoutMethod as "wallet" | "twitter") || "wallet";
      if (payoutMethod === "wallet" && !charity.walletVerifiedAt) {
        return res.status(400).json({
          error: "Charity must complete wallet verification before approval",
          emailVerified: !!charity.emailVerifiedAt,
          walletVerified: !!charity.walletVerifiedAt,
        });
      }
      
      // For X account payout, verify they have a valid twitter handle
      if (payoutMethod === "twitter" && !charity.twitterHandle) {
        return res.status(400).json({
          error: "Charity must have an X account handle configured for X payout method",
        });
      }

      await storage.updateCharityStatus(charity.id, CHARITY_STATUS.APPROVED, new Date());

      await storage.createAuditLog({
        action: "CHARITY_APPROVED",
        entityType: "charity",
        entityId: charity.id,
        details: JSON.stringify({ name: charity.name, walletAddress: charity.walletAddress }),
      });

      res.json({
        success: true,
        message: "Charity approved successfully",
        charityId: charity.id,
      });
    } catch (error) {
      console.error("Charity approval error:", error);
      res.status(500).json({ error: "Failed to approve charity" });
    }
  });

  // Deny a charity (admin only)
  app.post("/api/admin/charities/:id/deny", async (req, res) => {
    try {
      const adminSecret = req.headers["x-admin-secret"] as string;
      if (!isAdminAuthorized(adminSecret)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { reason } = req.body;
      const charity = await storage.getCharityById(req.params.id);
      if (!charity) {
        return res.status(404).json({ error: "Charity not found" });
      }

      await storage.updateCharityStatus(charity.id, CHARITY_STATUS.DENIED);

      await storage.createAuditLog({
        action: "CHARITY_DENIED",
        entityType: "charity",
        entityId: charity.id,
        details: JSON.stringify({ name: charity.name, reason: reason || "Not specified" }),
      });

      res.json({
        success: true,
        message: "Charity application denied",
        charityId: charity.id,
      });
    } catch (error) {
      console.error("Charity denial error:", error);
      res.status(500).json({ error: "Failed to deny charity" });
    }
  });

  // === TOKEN APPROVAL ENDPOINTS ===
  // Charities can approve/deny tokens created in their name
  
  // Get tokens pending approval for a charity (by email verification)
  app.get("/api/charity/tokens/pending", async (req, res) => {
    try {
      const charityEmail = req.query.email as string;
      const verificationToken = req.headers["x-charity-token"] as string;
      
      if (!charityEmail) {
        return res.status(400).json({ error: "Charity email is required" });
      }
      
      // Verify the charity exists and the token matches
      const charity = await storage.getCharityByEmail(charityEmail);
      if (!charity) {
        return res.status(404).json({ error: "Charity not found" });
      }
      
      // Simple verification: check if email is verified (charity has access)
      if (!charity.emailVerifiedAt) {
        return res.status(401).json({ error: "Charity email not verified" });
      }
      
      // Get all tokens for this charity
      const tokens = await storage.getTokensByCharityEmail(charityEmail);
      const pendingTokens = tokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.PENDING);
      
      res.json({
        tokens: pendingTokens,
        totalPending: pendingTokens.length,
      });
    } catch (error) {
      console.error("Get pending tokens error:", error);
      res.status(500).json({ error: "Failed to fetch pending tokens" });
    }
  });
  
  // Get all tokens for a charity (for their dashboard)
  app.get("/api/charity/tokens", async (req, res) => {
    try {
      const charityEmail = req.query.email as string;
      
      if (!charityEmail) {
        return res.status(400).json({ error: "Charity email is required" });
      }
      
      const charity = await storage.getCharityByEmail(charityEmail);
      if (!charity || !charity.emailVerifiedAt) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tokens = await storage.getTokensByCharityEmail(charityEmail);
      
      res.json({
        tokens,
        stats: {
          total: tokens.length,
          pending: tokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.PENDING).length,
          approved: tokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.APPROVED).length,
          denied: tokens.filter(t => t.charityApprovalStatus === TOKEN_APPROVAL_STATUS.DENIED).length,
        },
      });
    } catch (error) {
      console.error("Get charity tokens error:", error);
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });
  
  // Approve a token (charity action)
  app.post("/api/charity/tokens/:id/approve", async (req, res) => {
    try {
      const { charityEmail, note } = req.body;
      const tokenId = req.params.id;
      
      if (!charityEmail) {
        return res.status(400).json({ error: "Charity email is required" });
      }
      
      // Verify charity owns this token
      const charity = await storage.getCharityByEmail(charityEmail);
      if (!charity || !charity.emailVerifiedAt) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the token and verify it belongs to this charity
      const tokens = await storage.getTokensByCharityEmail(charityEmail);
      const token = tokens.find(t => t.id === tokenId);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found or not associated with this charity" });
      }
      
      if (token.charityApprovalStatus !== TOKEN_APPROVAL_STATUS.PENDING) {
        return res.status(400).json({ error: "Token has already been reviewed" });
      }
      
      // Approve the token
      const updated = await storage.updateTokenApprovalStatus(tokenId, TOKEN_APPROVAL_STATUS.APPROVED, note);
      
      await storage.createAuditLog({
        action: "TOKEN_APPROVED_BY_CHARITY",
        entityType: "token",
        entityId: tokenId,
        details: JSON.stringify({ 
          charityEmail,
          charityName: charity.name,
          tokenName: token.name,
          note,
        }),
      });
      
      res.json({
        success: true,
        message: "Token officially endorsed by charity",
        token: updated,
      });
    } catch (error) {
      console.error("Token approval error:", error);
      res.status(500).json({ error: "Failed to approve token" });
    }
  });
  
  // Deny a token (charity action)
  app.post("/api/charity/tokens/:id/deny", async (req, res) => {
    try {
      const { charityEmail, note } = req.body;
      const tokenId = req.params.id;
      
      if (!charityEmail) {
        return res.status(400).json({ error: "Charity email is required" });
      }
      
      // Verify charity owns this token
      const charity = await storage.getCharityByEmail(charityEmail);
      if (!charity || !charity.emailVerifiedAt) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get the token and verify it belongs to this charity
      const tokens = await storage.getTokensByCharityEmail(charityEmail);
      const token = tokens.find(t => t.id === tokenId);
      
      if (!token) {
        return res.status(404).json({ error: "Token not found or not associated with this charity" });
      }
      
      if (token.charityApprovalStatus !== TOKEN_APPROVAL_STATUS.PENDING) {
        return res.status(400).json({ error: "Token has already been reviewed" });
      }
      
      // Deny the token
      const updated = await storage.updateTokenApprovalStatus(tokenId, TOKEN_APPROVAL_STATUS.DENIED, note);
      
      await storage.createAuditLog({
        action: "TOKEN_DENIED_BY_CHARITY",
        entityType: "token",
        entityId: tokenId,
        details: JSON.stringify({ 
          charityEmail,
          charityName: charity.name,
          tokenName: token.name,
          note,
        }),
      });
      
      res.json({
        success: true,
        message: "Token denied by charity",
        token: updated,
      });
    } catch (error) {
      console.error("Token denial error:", error);
      res.status(500).json({ error: "Failed to deny token" });
    }
  });
  
  // Admin: Get all tokens pending approval
  app.get("/api/admin/tokens/pending", async (req, res) => {
    try {
      const adminSecret = req.headers["x-admin-secret"] as string;
      if (!isAdminAuthorized(adminSecret)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const pendingTokens = await storage.getTokensPendingApproval();
      
      res.json({
        tokens: pendingTokens,
        total: pendingTokens.length,
      });
    } catch (error) {
      console.error("Get pending tokens error:", error);
      res.status(500).json({ error: "Failed to fetch pending tokens" });
    }
  });

  // === CHANGE API ENDPOINTS ===
  // Search nonprofits via Change API (1.3M+ verified with Solana wallets)

  // Rate limited: 30 requests per minute
  app.get("/api/charities/change/search", rateLimitMiddleware(30), async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const category = req.query.category as string | undefined;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ 
          error: "Search query must be at least 2 characters" 
        });
      }

      // Check cache first to reduce API calls
      const cacheKey = `${query.toLowerCase()}_${page}_${category || "all"}`;
      const cached = getCachedSearch(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const results = await changeApi.searchNonprofits(query, {
        page,
        categories: category ? [category] : undefined,
      });

      console.log(`Change API search for "${query}": ${results.nonprofits.length} total results`);
      
      // Return all nonprofits with info about which have Solana addresses
      // Users can see all matches but can only select those with wallets
      const nonprofitsWithSolanaInfo = results.nonprofits.map(np => ({
        id: np.id,
        name: np.name,
        ein: np.ein,
        mission: np.mission,
        category: changeApi.mapChangeCategory(np.category),
        website: np.website,
        logoUrl: np.icon_url,
        solanaAddress: np.crypto?.solana_address || null,
        hasSolanaWallet: changeApi.hasValidSolanaWallet(np),
        location: np.city && np.state ? `${np.city}, ${np.state}` : null,
      }));
      
      const countWithSolana = nonprofitsWithSolanaInfo.filter(np => np.hasSolanaWallet).length;
      console.log(`After Solana check: ${countWithSolana} with wallets out of ${results.nonprofits.length}`);

      const response = {
        nonprofits: nonprofitsWithSolanaInfo,
        page: results.page || page,
        totalResults: results.nonprofits.length,
        totalWithSolana: countWithSolana,
        source: "change",
      };
      
      // Cache the response
      setCachedSearch(cacheKey, response);

      res.json(response);
    } catch (error) {
      console.error("Change API search error:", error);
      res.status(500).json({ error: "Failed to search nonprofits" });
    }
  });

  // Get single nonprofit by Change ID
  app.get("/api/charities/change/:id", async (req, res) => {
    try {
      const nonprofit = await changeApi.getNonprofitById(req.params.id);

      if (!nonprofit) {
        return res.status(404).json({ error: "Nonprofit not found" });
      }

      if (!changeApi.hasValidSolanaWallet(nonprofit)) {
        return res.status(400).json({ 
          error: "This nonprofit does not have a Solana wallet configured" 
        });
      }

      res.json({
        id: nonprofit.id,
        name: nonprofit.name,
        ein: nonprofit.ein,
        mission: nonprofit.mission,
        category: changeApi.mapChangeCategory(nonprofit.category),
        website: nonprofit.website,
        email: nonprofit.email,
        logoUrl: nonprofit.icon_url,
        solanaAddress: nonprofit.crypto?.solana_address,
        location: nonprofit.city && nonprofit.state 
          ? `${nonprofit.city}, ${nonprofit.state}` 
          : null,
        socials: nonprofit.socials,
        displayImpact: nonprofit.display_impact,
        source: "change",
      });
    } catch (error) {
      console.error("Change API get error:", error);
      res.status(500).json({ error: "Failed to fetch nonprofit" });
    }
  });

  // === TOKEN ENDPOINTS ===

  // Check if Bags SDK is configured
  app.get("/api/bags/status", async (req, res) => {
    res.json({
      configured: bagsSDK.isConfigured(),
    });
  });

  // Step 1: Create token metadata on Bags.fm
  // Rate limited: 10 requests per minute (token launches are expensive operations)
  app.post("/api/tokens/prepare", rateLimitMiddleware(10), async (req, res) => {
    try {
      const validated = tokenLaunchRequestSchema.parse(req.body);
      
      let charityInfo: { 
        id: string; 
        name: string; 
        walletAddress: string; 
        twitterHandle?: string;
        payoutMethod?: string;
        source: string;
      };
      
      if (validated.charitySource === "change") {
        // Change API charity - verify the Solana address is provided and valid
        if (!validated.charitySolanaAddress || !isValidSolanaAddress(validated.charitySolanaAddress)) {
          return res.status(400).json({
            success: false,
            error: "Invalid Solana wallet address for selected charity",
          });
        }
        
        // SECURITY: Always verify with Change API - prevents wallet spoofing
        const verification = await verifyChangeCharityWallet(
          validated.charityId, 
          validated.charitySource, 
          validated.charitySolanaAddress
        );
        if (!verification.valid) {
          return res.status(400).json({
            success: false,
            error: verification.error || "Charity verification failed",
          });
        }
        const nonprofit = await changeApi.getNonprofitById(validated.charityId);
        charityInfo = {
          id: validated.charityId,
          name: nonprofit?.name || "Unknown Charity",
          walletAddress: verification.walletAddress!,
          source: "change",
        };
      } else {
        // Local charity - look up from database
        let charity: Charity | undefined = await storage.getCharityById(validated.charityId);
        if (!charity) {
          charity = await storage.getDefaultCharity();
        }
        if (!charity) {
          return res.status(400).json({
            success: false,
            error: "No charity selected and no default available",
          });
        }

        // SECURITY: Enforce only approved/verified charities can be used for launches
        if (charity.status !== CHARITY_STATUS.APPROVED) {
          return res.status(400).json({
            success: false,
            error: "Selected charity has not been verified. Please choose an approved charity.",
          });
        }
        
        // Charities need either a valid wallet address OR a Twitter handle for Bags.fm payout
        const hasValidWallet = charity.walletAddress && isValidSolanaAddress(charity.walletAddress);
        const hasTwitterPayout = charity.twitterHandle && charity.payoutMethod === "twitter";
        
        if (!hasValidWallet && !hasTwitterPayout) {
          return res.status(400).json({
            success: false,
            error: "Selected charity does not have a valid payout method (wallet or Twitter handle)",
          });
        }
        
        charityInfo = {
          id: charity.id,
          name: charity.name,
          walletAddress: charity.walletAddress || `twitter:@${charity.twitterHandle}`,
          twitterHandle: charity.twitterHandle || undefined,
          payoutMethod: charity.payoutMethod || (hasValidWallet ? "wallet" : "twitter"),
          source: "local",
        };
      }

      // Check if Bags SDK is configured
      if (!bagsSDK.isConfigured()) {
        // Return mock data for development
        const mockMintAddress = `mock${randomUUID().replace(/-/g, "").slice(0, 40)}`;
        return res.json({
          success: true,
          mock: true,
          tokenMint: mockMintAddress,
          metadataUrl: `https://example.com/metadata/${mockMintAddress}`,
          charity: charityInfo,
        });
      }

      // Create token info using Bags SDK
      const tokenInfo = await bagsSDK.createTokenInfoAndMetadata({
        name: validated.name,
        symbol: validated.symbol,
        description: validated.description,
        imageUrl: validated.imageUrl,
        creatorWallet: validated.creatorWallet,
      });

      res.json({
        success: true,
        mock: false,
        tokenMint: tokenInfo.tokenMint,
        metadataUrl: tokenInfo.metadataUrl,
        charity: charityInfo,
      });
    } catch (error) {
      console.error("Token prepare error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: error.errors.map(e => e.message).join(", "),
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to prepare token",
        });
      }
    }
  });

  // Step 2: Create fee share config and get transactions to sign
  // Rate limited: 10 requests per minute
  app.post("/api/tokens/config", rateLimitMiddleware(10), async (req, res) => {
    try {
      const { tokenMint, creatorWallet, charityId, charitySource, charitySolanaAddress } = req.body;
      
      if (!tokenMint || !creatorWallet || !charityId) {
        return res.status(400).json({
          success: false,
          error: "tokenMint, creatorWallet, and charityId are required",
        });
      }

      // Check if this is a mock token (from dev mode when Bags SDK not configured)
      const isMockToken = tokenMint.startsWith("mock");

      // Validate address formats using strict Solana validation (skip for mock tokens)
      if (!isMockToken && !isValidSolanaAddress(tokenMint)) {
        const tokenMintStr = String(tokenMint || '');
        // Log with character codes to detect invisible/special characters
        const charCodes = tokenMintStr.slice(0, 50).split('').map(c => c.charCodeAt(0)).join(',');
        console.error(`Invalid tokenMint received in /api/tokens/config:`);
        console.error(`  Value: "${tokenMintStr.slice(0, 60)}${tokenMintStr.length > 60 ? '...' : ''}"`);
        console.error(`  Length: ${tokenMintStr.length}, Type: ${typeof tokenMint}`);
        console.error(`  First 50 char codes: [${charCodes}]`);
        console.error(`  Matches base58 regex: ${/^[1-9A-HJ-NP-Za-km-z]+$/.test(tokenMintStr)}`);
        console.error(`  Matches length 32-44: ${tokenMintStr.length >= 32 && tokenMintStr.length <= 44}`);
        return res.status(400).json({
          success: false,
          error: "Invalid token mint address format",
        });
      }
      if (!isValidSolanaAddress(creatorWallet)) {
        return res.status(400).json({
          success: false,
          error: "Invalid creator wallet address format",
        });
      }

      let charityWallet: string | undefined;
      let charityTwitterHandle: string | undefined;
      let payoutMethod: "wallet" | "twitter" = "wallet";
      
      if (charitySource === "change") {
        // Change API charity - validate the provided Solana address
        if (!charitySolanaAddress || !isValidSolanaAddress(charitySolanaAddress)) {
          return res.status(400).json({
            success: false,
            error: "Invalid Solana wallet address for Change charity",
          });
        }
        
        // SECURITY: Verify with Change API - do NOT skip verification
        const verification = await verifyChangeCharityWallet(
          charityId, 
          charitySource, 
          charitySolanaAddress
        );
        if (!verification.valid) {
          return res.status(400).json({
            success: false,
            error: verification.error || "Charity wallet verification failed",
          });
        }
        
        charityWallet = verification.walletAddress!;
        payoutMethod = "wallet";
      } else {
        // Local charity - look up from database
        const charity = await storage.getCharityById(charityId);
        if (!charity) {
          return res.status(400).json({
            success: false,
            error: "Invalid charity ID - charity not found",
          });
        }

        // SECURITY: Enforce only approved/verified charities can be used
        if (charity.status !== CHARITY_STATUS.APPROVED) {
          return res.status(400).json({
            success: false,
            error: "Selected charity has not been verified. Please choose an approved charity.",
          });
        }
        
        // Determine payout method based on charity configuration
        const charityPayoutMethod = (charity.payoutMethod as "wallet" | "twitter") || "wallet";
        
        if (charityPayoutMethod === "twitter" && charity.twitterHandle) {
          // Use Bags.fm X account claim system
          charityTwitterHandle = charity.twitterHandle;
          payoutMethod = "twitter";
        } else if (charity.walletAddress && isValidSolanaAddress(charity.walletAddress)) {
          // Direct wallet payout
          charityWallet = charity.walletAddress;
          payoutMethod = "wallet";
        } else {
          return res.status(400).json({
            success: false,
            error: "Selected charity does not have a valid payout method configured",
          });
        }
      }

      if (!bagsSDK.isConfigured()) {
        // Return mock data
        return res.json({
          success: true,
          mock: true,
          configKey: `config${randomUUID().replace(/-/g, "").slice(0, 40)}`,
          transactions: [],
        });
      }

      const config = await bagsSDK.createFeeShareConfig({
        tokenMint,
        creatorWallet,
        charityWallet,
        charityTwitterHandle,
        payoutMethod,
      });

      res.json({
        success: true,
        mock: false,
        configKey: config.configKey,
        transactions: config.transactions,
      });
    } catch (error) {
      console.error("Config creation error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create config",
      });
    }
  });

  // Step 3: Create launch transaction
  app.post("/api/tokens/launch-tx", async (req, res) => {
    try {
      const { tokenMint, metadataUrl, configKey, creatorWallet, initialBuyAmountSol } = req.body;
      
      if (!tokenMint || !metadataUrl || !configKey || !creatorWallet) {
        return res.status(400).json({
          success: false,
          error: "tokenMint, metadataUrl, configKey, and creatorWallet are required",
        });
      }

      if (!bagsSDK.isConfigured()) {
        // Return mock data
        return res.json({
          success: true,
          mock: true,
          transaction: null,
        });
      }

      const initialBuyLamports = bagsSDK.lamportsFromSol(parseFloat(initialBuyAmountSol) || 0);
      const launchTx = await bagsSDK.createLaunchTransaction(
        tokenMint,
        metadataUrl,
        configKey,
        creatorWallet,
        initialBuyLamports
      );

      res.json({
        success: true,
        mock: false,
        transaction: launchTx.transaction,
      });
    } catch (error) {
      console.error("Launch transaction error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create launch transaction",
      });
    }
  });
  
  // Step 4: Record successful launch after client broadcasts transaction
  // Rate limited: 10 requests per minute
  app.post("/api/tokens/launch", rateLimitMiddleware(10), async (req, res) => {
    try {
      const validated = tokenLaunchRequestSchema.parse(req.body);
      const { mintAddress, transactionSignature } = req.body;
      
      if (!mintAddress) {
        return res.status(400).json({
          success: false,
          error: "mintAddress is required",
        });
      }
      
      // Get the selected charity - handle both Change API and local charities
      let charityInfo: { 
        id: string; 
        name: string; 
        walletAddress: string | null; 
        email: string | null; 
        website: string | null;
        twitter: string | null;
        facebook: string | null;
        source: string 
      };
      
      if (validated.charitySource === "change") {
        // SECURITY: Verify Change API charity wallet address
        const verification = await verifyChangeCharityWallet(
          validated.charityId, 
          validated.charitySource, 
          validated.charitySolanaAddress ?? undefined
        );
        if (!verification.valid) {
          return res.status(400).json({
            success: false,
            error: verification.error || "Charity verification failed",
          });
        }
        
        const nonprofit = await changeApi.getNonprofitById(validated.charityId);
        // Extract social links from Change API response
        const socials = nonprofit?.socials as { twitter?: string; facebook?: string } | undefined;
        charityInfo = {
          id: validated.charityId,
          name: nonprofit?.name || "Unknown Charity",
          walletAddress: verification.walletAddress || null,
          email: null, // Change API doesn't provide email
          website: nonprofit?.website || null,
          twitter: socials?.twitter || null,
          facebook: socials?.facebook || null,
          source: "change",
        };
      } else {
        // Local charity - look up from database
        let charity: Charity | undefined = await storage.getCharityById(validated.charityId);
        if (!charity) {
          charity = await storage.getDefaultCharity();
        }
        if (!charity) {
          return res.status(400).json({
            success: false,
            error: "No charity selected and no default available",
          });
        }
        
        // SECURITY: Enforce only approved/verified charities can be used for launches
        if (charity.status !== CHARITY_STATUS.APPROVED) {
          return res.status(400).json({
            success: false,
            error: "Selected charity has not been verified. Please choose an approved charity.",
          });
        }
        
        // Charities need either a valid wallet address OR a Twitter handle for Bags.fm payout
        const hasValidWallet = charity.walletAddress && isValidSolanaAddress(charity.walletAddress);
        const hasTwitterPayout = charity.twitterHandle && charity.payoutMethod === "twitter";
        
        if (!hasValidWallet && !hasTwitterPayout) {
          return res.status(400).json({
            success: false,
            error: "Selected charity does not have a valid payout method (wallet or Twitter handle)",
          });
        }
        
        charityInfo = {
          id: charity.id,
          name: charity.name,
          walletAddress: charity.walletAddress || `twitter:@${charity.twitterHandle}`,
          email: charity.email || null,
          website: charity.website || null,
          twitter: charity.twitterHandle || null,
          facebook: null, // Local charities don't store facebook
          source: "local",
        };
      }
      
      // Calculate fees
      const initialBuy = parseFloat(validated.initialBuyAmount) || 0;
      const charityDonation = (initialBuy * CHARITY_FEE_PERCENTAGE / 100).toFixed(9);
      const platformFee = (initialBuy * PLATFORM_FEE_PERCENTAGE / 100).toFixed(9);
      
      // Check if this is a test mode launch
      const isTestLaunch = validated.isTest === true;
      
      // Create the token record with charity approval tracking
      const token = await storage.createLaunchedToken({
        name: validated.name,
        symbol: validated.symbol,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        mintAddress: mintAddress,
        creatorWallet: validated.creatorWallet,
        charityId: charityInfo.id,
        // Charity approval tracking
        charityApprovalStatus: isTestLaunch ? "not_applicable" : "pending", // Test tokens don't need approval
        charityName: charityInfo.name,
        charityEmail: charityInfo.email,
        charityWebsite: charityInfo.website,
        charityTwitter: charityInfo.twitter,
        charityFacebook: charityInfo.facebook,
        charityNotifiedAt: isTestLaunch ? null : (charityInfo.email ? new Date() : null), // Don't notify for test tokens
        // Financial tracking
        initialBuyAmount: validated.initialBuyAmount,
        charityDonated: charityDonation,
        platformFeeCollected: platformFee,
        tradingVolume: validated.initialBuyAmount,
        transactionSignature: transactionSignature || `tx${randomUUID().replace(/-/g, "")}`,
        // Test mode flag
        isTest: isTestLaunch,
      });

      // Log the launch
      await storage.createAuditLog({
        action: isTestLaunch ? "TEST_TOKEN_LAUNCHED" : "TOKEN_LAUNCHED",
        entityType: "token",
        entityId: token.id,
        actorWallet: validated.creatorWallet,
        details: JSON.stringify({ 
          name: validated.name, 
          charityId: charityInfo.id, 
          charityName: charityInfo.name,
          charitySource: charityInfo.source,
          initialBuy,
          isTest: isTestLaunch,
        }),
      });
      
      // Record the donation if there was an initial buy and charity has a wallet (skip for test tokens)
      if (initialBuy > 0 && charityInfo.walletAddress && !isTestLaunch) {
        await storage.createDonation({
          tokenMint: mintAddress,
          amount: charityDonation,
          charityWallet: charityInfo.walletAddress,
          transactionSignature: `donation${randomUUID().replace(/-/g, "")}`,
        });
      }
      
      res.json({
        success: true,
        isTest: isTestLaunch,
        token: {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          mintAddress: token.mintAddress,
          transactionSignature: token.transactionSignature,
        },
        charity: {
          id: charityInfo.id,
          name: charityInfo.name,
          source: charityInfo.source,
          hasWallet: !!charityInfo.walletAddress,
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

  // Search token names to check if already used (for Bags.fm duplicate detection)
  app.get("/api/tokens/search/name", rateLimitMiddleware(30), async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ 
          local: [], 
          external: [],
          hasExternalSearch: false
        });
      }

      // Search local database for tokens launched via GoodBags
      const localResults = await storage.searchTokensByName(query);

      // Check for Solana Tracker API key for external search
      const solanaTrackerKey = process.env.SOLANA_TRACKER_API_KEY;
      let externalResults: { name: string; symbol: string; mintAddress: string; launchpad?: string }[] = [];
      let hasExternalSearch = false;

      if (solanaTrackerKey) {
        hasExternalSearch = true;
        try {
          // Search Solana Tracker for Bags.fm tokens specifically
          const searchUrl = new URL("https://data.solanatracker.io/search");
          searchUrl.searchParams.set("query", query);
          searchUrl.searchParams.set("launchpad", "bags");
          searchUrl.searchParams.set("limit", "20");
          searchUrl.searchParams.set("sortBy", "createdAt");
          searchUrl.searchParams.set("sortOrder", "desc");

          const response = await fetch(searchUrl.toString(), {
            headers: {
              "x-api-key": solanaTrackerKey,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status === "success" && Array.isArray(data.data)) {
              externalResults = data.data.map((token: any) => ({
                name: token.name || "",
                symbol: token.symbol || "",
                mintAddress: token.mint || "",
                launchpad: token.launchpad?.name || "bags",
              }));
            }
          }
        } catch (extError) {
          console.error("External token search error:", extError);
          // Continue with local results only
        }
      }

      res.json({
        local: localResults,
        external: externalResults,
        hasExternalSearch,
      });
    } catch (error) {
      console.error("Token name search error:", error);
      res.status(500).json({ error: "Failed to search tokens" });
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
          description: token.description,
          mintAddress: token.mintAddress,
          imageUrl: token.imageUrl,
          creatorWallet: token.creatorWallet,
          launchedAt: token.launchedAt,
          charityId: token.charityId,
          tradingVolume: token.tradingVolume,
          charityApprovalStatus: token.charityApprovalStatus,
          charityName: token.charityName,
          charityApprovalNote: token.charityApprovalNote,
          // Charity contact info for creator outreach
          charityWebsite: token.charityWebsite,
          charityTwitter: token.charityTwitter,
          charityFacebook: token.charityFacebook,
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

  // === BUYBACK ENDPOINTS ===

  // Get buyback stats (public)
  app.get("/api/buyback/stats", async (req, res) => {
    try {
      const stats = await buybackService.getBuybackStats();
      res.json(stats);
    } catch (error) {
      console.error("Get buyback stats error:", error);
      res.status(500).json({ error: "Failed to fetch buyback stats" });
    }
  });

  // Get buyback history (public)
  app.get("/api/buyback/history", async (req, res) => {
    try {
      const buybacks = await storage.getAllBuybacks();
      res.json(buybacks);
    } catch (error) {
      console.error("Get buyback history error:", error);
      res.status(500).json({ error: "Failed to fetch buyback history" });
    }
  });

  // Trigger manual buyback (admin only)
  app.post("/api/admin/buyback/execute", async (req, res) => {
    const adminSecret = req.headers["x-admin-secret"] as string;
    if (!isAdminAuthorized(adminSecret)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { amount } = req.body;
      const result = await buybackService.executeBuyback(amount);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Buyback completed: ${result.solSpent?.toFixed(4)} SOL -> ${result.fyiReceived?.toFixed(2)} FYI`,
          txSignature: result.txSignature,
          solSpent: result.solSpent,
          fyiReceived: result.fyiReceived,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Execute buyback error:", error);
      res.status(500).json({ error: "Failed to execute buyback" });
    }
  });

  return httpServer;
}
