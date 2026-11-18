import type { Express, RequestHandler } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { tokenLaunchFormSchema } from "@shared/schema";
import { computeFeeSplit, effectiveSplitForNewLaunch, resolveDonationTier } from "@shared/feeSplit";

/**
 * Test launch: a dry run of the launch flow. It validates the same form fields, charity
 * rules and donation tier as a real launch and returns the fee split the coin would get,
 * but makes no Bags API call, no Solana transaction and stores nothing, so a test launch
 * can never appear in any public figure, list, notification or email.
 */
export const testLaunchRequestSchema = tokenLaunchFormSchema.extend({
  charitySource: z.enum(["change", "local"]).default("local"),
  charitySolanaAddress: z.string().nullable().optional(),
  donateCreatorPercent: z.number().optional(),
  donateCreatorShare: z.boolean().optional(),
});

export interface TestLaunchCharity {
  id: string;
  name: string;
  source: "local" | "change";
}

export type ResolveTestCharity = (request: {
  charityId: string;
  charitySource: "local" | "change";
  charitySolanaAddress?: string | null;
}) => Promise<{ ok: true; charity: TestLaunchCharity } | { ok: false; error: string }>;

export function testMintLabel(): string {
  return `TEST-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function registerTestLaunchRoute(
  app: Express,
  deps: { rateLimit: RequestHandler; resolveCharity: ResolveTestCharity }
): void {
  app.post("/api/tokens/test-launch", deps.rateLimit, async (req, res) => {
    const parsed = testLaunchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors.map((e) => e.message).join(", ") });
    }
    const request = parsed.data;

    const tier = resolveDonationTier(request.donateCreatorPercent, request.donateCreatorShare);
    if (tier === null) {
      return res.status(400).json({ success: false, error: "donateCreatorPercent must be 0, 25, 50, 75, or 100" });
    }

    let resolved: Awaited<ReturnType<ResolveTestCharity>>;
    try {
      resolved = await deps.resolveCharity({
        charityId: request.charityId,
        charitySource: request.charitySource,
        charitySolanaAddress: request.charitySolanaAddress,
      });
    } catch (error) {
      console.error("Test launch charity check failed:", error instanceof Error ? error.message : error);
      return res.status(503).json({ success: false, error: "Couldn't check the charity right now. Please try again." });
    }
    if (!resolved.ok) {
      return res.status(400).json({ success: false, error: resolved.error });
    }

    const { charityBps, buybackBps, creatorBps } = computeFeeSplit(tier);
    const effective = effectiveSplitForNewLaunch(tier);

    res.json({
      success: true,
      isTest: true,
      stored: false,
      token: {
        name: request.name,
        symbol: request.symbol,
        description: request.description || null,
        imageUrl: request.imageUrl || null,
        mintAddress: testMintLabel(),
        transactionSignature: null,
      },
      charity: resolved.charity,
      initialBuyAmount: request.initialBuyAmount,
      feeSplit: {
        donateCreatorPercent: tier,
        charityBps,
        buybackBps,
        creatorBps,
        charityPercent: effective.charityPercent,
        creatorPercent: effective.creatorPercent,
        buybackPercent: effective.buybackPercent,
      },
    });
  });
}
