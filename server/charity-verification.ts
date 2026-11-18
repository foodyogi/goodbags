import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";

/**
 * Charity email verification. The link is only ever sent to the charity's email address,
 * never returned in an API response. Expiry lives inside the token itself
 * ("<expiresAtMs>.<64 hex>") so no new database column is needed. Tokens in any other
 * format (issued before 1.0.9, when they were returned to the browser) count as expired.
 */
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

const TOKEN_PATTERN = /^(\d{13})\.([0-9a-f]{64})$/;

export function createEmailVerificationToken(now = Date.now()): string {
  return `${now + EMAIL_VERIFICATION_TTL_MS}.${randomBytes(32).toString("hex")}`;
}

export function isEmailVerificationTokenExpired(token: string, now = Date.now()): boolean {
  const match = TOKEN_PATTERN.exec(token);
  return !match || Number(match[1]) <= now;
}

export function emailVerificationLink(token: string): string {
  const baseUrl = process.env.APP_URL || "https://goodbags.tech";
  return `${baseUrl}/verify/email/${encodeURIComponent(token)}`;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

export interface IssueVerificationDeps {
  saveToken: (token: string) => Promise<unknown>;
  sendEmail: (link: string) => Promise<SendResult>;
}

/**
 * Store a fresh token (replacing any earlier one) and email the link.
 * Never throws and never returns the token: a failure only means emailSent is false.
 */
export async function issueEmailVerification(deps: IssueVerificationDeps): Promise<{ emailSent: boolean }> {
  try {
    const token = createEmailVerificationToken();
    await deps.saveToken(token);
    const result = await deps.sendEmail(emailVerificationLink(token));
    if (!result.success) {
      console.error("[Charity verification] Email not sent:", result.error);
    }
    return { emailSent: result.success };
  } catch (error) {
    console.error("[Charity verification] Could not issue verification email:", error instanceof Error ? error.message : error);
    return { emailSent: false };
  }
}

export const EMAIL_NOT_SENT_MESSAGE =
  "Your application is saved, but we couldn't send the verification email right now. Please use \"Resend verification email\" in a few minutes.";

export interface ResendRouteDeps {
  getCharity: (id: string) => Promise<{ id: string; name: string; email: string | null; emailVerifiedAt: Date | null } | undefined>;
  saveToken: (charityId: string, token: string) => Promise<unknown>;
  sendEmail: (to: { name: string; email: string }, link: string) => Promise<SendResult>;
  rateLimit: (req: Request, res: Response, next: () => void) => void;
}

/** POST /api/charities/:id/resend-verification: rate limited per IP, plus a per-charity cooldown. */
export function registerResendVerificationRoute(app: Express, deps: ResendRouteDeps): void {
  const lastSent = new Map<string, number>();

  app.post("/api/charities/:id/resend-verification", deps.rateLimit, async (req, res) => {
    try {
      const charity = await deps.getCharity(req.params.id);
      if (!charity) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }
      if (charity.emailVerifiedAt) {
        return res.status(400).json({ success: false, error: "This email address is already verified" });
      }
      if (!charity.email) {
        return res.status(400).json({ success: false, error: "This application has no email address" });
      }
      const sentAt = lastSent.get(charity.id);
      if (sentAt && Date.now() - sentAt < RESEND_COOLDOWN_MS) {
        return res.status(429).json({ success: false, error: "Please wait a minute before requesting another email" });
      }
      lastSent.set(charity.id, Date.now());

      const email = charity.email;
      const { emailSent } = await issueEmailVerification({
        saveToken: (token) => deps.saveToken(charity.id, token),
        sendEmail: (link) => deps.sendEmail({ name: charity.name, email }, link),
      });
      if (!emailSent) {
        return res.status(503).json({ success: false, emailSent, error: "We couldn't send the email right now. Please try again in a few minutes." });
      }
      // Don't echo the address: anyone who knows the charity ID can call this route
      res.json({ success: true, emailSent, message: "Verification email sent to the address on the application" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ success: false, error: "Failed to resend verification email" });
    }
  });
}
