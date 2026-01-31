import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./twitterAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Twitter OAuth stores user data directly in req.user
      const userId = req.user.id;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        // Return session user data if database lookup fails
        return res.json({
          id: req.user.id,
          twitterId: req.user.twitterId,
          twitterUsername: req.user.twitterUsername,
          twitterDisplayName: req.user.twitterDisplayName,
          profileImageUrl: req.user.profileImageUrl,
          email: req.user.email,
          walletAddress: req.user.walletAddress,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
