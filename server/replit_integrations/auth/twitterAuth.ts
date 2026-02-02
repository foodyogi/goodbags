import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import crypto from "crypto";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
// Use x.com instead of twitter.com - some developers report this helps with account switching
const TWITTER_AUTH_URL = "https://x.com/i/oauth2/authorize";
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
  
  // Always use secure cookies in production (Replit/custom domains use HTTPS)
  const isProduction = process.env.NODE_ENV === "production" || 
                       !!process.env.REPLIT_DOMAINS || 
                       !!process.env.REPL_ID;
  
  console.log(`[Session] Initializing session - isProduction: ${isProduction}`);
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true, // Force save on each request for cross-redirect persistence
    saveUninitialized: true, // Create session before OAuth redirect
    rolling: true, // Extend session on each request
    name: "goodbags.sid", // Custom session name
    proxy: true, // Trust first proxy (Replit's load balancer)
    cookie: {
      httpOnly: true,
      secure: isProduction, // Always secure on Replit/production
      sameSite: "lax", // Lax allows OAuth redirects
      maxAge: sessionTtl,
      path: "/",
    },
  });
}

function getBaseUrl(req: any): string {
  // Always use the request host header - this correctly handles:
  // 1. Custom domains (goodbags.tech)
  // 2. Replit dev domains
  // 3. Local development
  const host = req.get("host") || req.hostname;
  // In production/Replit, always use HTTPS
  const isSecure = req.secure || req.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
  const protocol = isSecure ? "https" : "http";
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
    console.log(`[Twitter Auth] Login initiated, returnTo: ${returnTo || '/'}`);
    
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
        console.error("[Twitter Auth] Session save error:", err);
        return res.status(500).send("Session error");
      }

      const baseUrl = getBaseUrl(req);
      const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;
      console.log(`[Twitter Auth] Redirecting to Twitter, callback URL: ${callbackUrl}`);
      
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
      console.log(`[Twitter Auth] Callback received, has code: ${!!code}, state: ${state?.toString().substring(0, 8)}...`);

      if (error) {
        console.error("[Twitter Auth] OAuth error:", error, error_description);
        return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
      }

      const savedState = (req.session as any).oauthState;
      const codeVerifier = (req.session as any).codeVerifier;
      const returnTo = (req.session as any).returnTo;
      console.log(`[Twitter Auth] Session data - has savedState: ${!!savedState}, has codeVerifier: ${!!codeVerifier}, returnTo: ${returnTo || '/'}`);

      if (!code || state !== savedState) {
        console.error(`[Twitter Auth] State mismatch - received: ${state}, saved: ${savedState}`);
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
    const returnTo = req.query.returnTo as string;
    req.logout(() => {
      req.session.destroy(() => {
        // Redirect to returnTo if provided and is a valid path (security check)
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          res.redirect(returnTo);
        } else {
          res.redirect("/");
        }
      });
    });
  });

  // Debug endpoint to check session state (useful for troubleshooting)
  app.get("/api/auth/debug", (req, res) => {
    const sessionId = req.sessionID;
    const hasSession = !!req.session;
    const isAuth = req.isAuthenticated();
    const user = req.user;
    const cookies = req.headers.cookie || "none";
    
    console.log(`[Auth Debug] sessionId: ${sessionId?.substring(0, 8)}..., hasSession: ${hasSession}, isAuth: ${isAuth}, user: ${user ? (user as any).username : 'none'}`);
    console.log(`[Auth Debug] Cookies received: ${cookies.substring(0, 100)}...`);
    
    res.json({
      hasSession,
      isAuthenticated: isAuth,
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
      user: user ? { id: (user as any).id, username: (user as any).username } : null,
      hasCookies: cookies !== "none",
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
