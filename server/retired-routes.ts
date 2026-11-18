import type { Express } from "express";

export const CHARITY_EMAIL_APPROVAL_RETIRED =
  "Approving or denying coins by email address has been retired. Charities now approve or deny coins only through the X-verified charity portal: open the link in the message GoodBags sent you and sign in with your charity's official X account.";

/**
 * The email-based charity coin approval routes trusted whoever supplied a charity's email
 * address. They now answer 410 Gone for every request, whatever it contains.
 */
export function registerRetiredCharityEmailRoutes(app: Express): void {
  const gone = (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) =>
    res.status(410).json({ error: CHARITY_EMAIL_APPROVAL_RETIRED, portal: "/charity-portal" });

  app.get("/api/charity/tokens", gone);
  app.get("/api/charity/tokens/pending", gone);
  app.post("/api/charity/tokens/:id/approve", gone);
  app.post("/api/charity/tokens/:id/deny", gone);
}
