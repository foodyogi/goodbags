import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import crypto from "crypto";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_USER_URL = "https://api.twitter.com/2/users/me";

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

interface TwitterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "lax" : "lax",
      maxAge: sessionTtl,
    },
  });
}

function getBaseUrl(req: any): string {
  // Use REPLIT_DOMAINS for production, otherwise construct from request
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const primaryDomain = replitDomains.split(",")[0];
    return `https://${primaryDomain}`;
  }
  
  // For development or custom domains
  const protocol = req.protocol || "https";
  const host = req.get("host") || req.hostname;
  return `${protocol}://${host}`;
}

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Twitter OAuth 2.0 login endpoint
  app.get("/api/login", (req, res) => {
    const returnTo = req.query.returnTo as string;
    if (returnTo && req.session) {
      (req.session as any).returnTo = returnTo;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store code verifier and state in session for callback verification
    (req.session as any).codeVerifier = codeVerifier;
    (req.session as any).oauthState = state;

    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Session error");
      }

      const baseUrl = getBaseUrl(req);
      const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;
      
      const params = new URLSearchParams({
        response_type: "code",
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: callbackUrl,
        scope: "tweet.read users.read offline.access",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      res.redirect(`${TWITTER_AUTH_URL}?${params.toString()}`);
    });
  });

  // Twitter OAuth 2.0 callback endpoint
  app.get("/api/auth/twitter/callback", async (req, res) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error("Twitter OAuth error:", error, error_description);
        return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
      }

      const savedState = (req.session as any).oauthState;
      const codeVerifier = (req.session as any).codeVerifier;

      if (!code || state !== savedState) {
        console.error("Invalid OAuth state or missing code");
        return res.redirect("/?error=invalid_state");
      }

      const baseUrl = getBaseUrl(req);
      const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;

      // Exchange code for access token
      const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: callbackUrl,
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", tokenResponse.status, errorText);
        return res.redirect("/?error=token_exchange_failed");
      }

      const tokens: TwitterTokenResponse = await tokenResponse.json();

      // Fetch user info from Twitter
      const userResponse = await fetch(`${TWITTER_USER_URL}?user.fields=profile_image_url,name,username`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User fetch failed:", userResponse.status, errorText);
        return res.redirect("/?error=user_fetch_failed");
      }

      const userData = await userResponse.json();
      const twitterUser: TwitterUser = userData.data;

      // Upsert user in database
      const user = await authStorage.upsertUserByTwitter({
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterDisplayName: twitterUser.name,
        profileImageUrl: twitterUser.profile_image_url?.replace("_normal", "_400x400"),
      });

      // Clear OAuth data from session
      delete (req.session as any).codeVerifier;
      delete (req.session as any).oauthState;

      // Set user in session
      const sessionUser = {
        id: user.id,
        twitterId: user.twitterId,
        twitterUsername: user.twitterUsername,
        twitterDisplayName: user.twitterDisplayName,
        profileImageUrl: user.profileImageUrl,
        email: user.email,
        walletAddress: user.walletAddress,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect("/?error=login_failed");
        }

        // Redirect to saved URL or home
        const returnTo = (req.session as any).returnTo || "/";
        delete (req.session as any).returnTo;
        res.redirect(returnTo);
      });
    } catch (error) {
      console.error("Twitter callback error:", error);
      res.redirect("/?error=callback_failed");
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
