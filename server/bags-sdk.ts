import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58Pkg from "bs58";
// Handle ESM/CommonJS interop for bs58
const bs58 = (bs58Pkg as any).default ?? bs58Pkg;
import { 
  PLATFORM_WALLET, 
  CHARITY_FEE_BPS, 
  BUYBACK_FEE_BPS,
  CREATOR_FEE_BPS,
  PARTNER_WALLET,
  TOTAL_FEE_BPS
} from "@shared/schema";

const BAGS_API_KEY = process.env.BAGS_API_KEY;

// Custom error class for Bags.fm API errors with user-friendly messages
export class BagsApiError extends Error {
  public readonly code: number;
  public readonly userMessage: string;
  public readonly originalError: unknown;
  public readonly retryable: boolean;

  constructor(code: number, message: string, userMessage: string, originalError: unknown, retryable = false) {
    super(message);
    this.name = "BagsApiError";
    this.code = code;
    this.userMessage = userMessage;
    this.originalError = originalError;
    this.retryable = retryable;
  }
}

// Parse and categorize Bags.fm API errors
function parseBagsApiError(error: unknown): BagsApiError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  let code = 0;
  let apiMessage = "";
  
  // Strategy 1: Check if error is a structured object with nested error.code (JSON-RPC style)
  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    
    // Check for JSON-RPC style: error.error.code and error.error.message
    if (errObj.error && typeof errObj.error === 'object') {
      const nestedError = errObj.error as Record<string, unknown>;
      if (typeof nestedError.code === 'number') {
        code = nestedError.code;
        apiMessage = typeof nestedError.message === 'string' ? nestedError.message : "";
      }
    }
    
    // Check for response-wrapped errors: error.response.status or error.response.data.error.code
    if (!code && errObj.response && typeof errObj.response === 'object') {
      const response = errObj.response as Record<string, unknown>;
      if (typeof response.status === 'number') {
        code = response.status;
      }
      // Also check response.data.error.code (axios-style)
      if (!code && response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (data.error && typeof data.error === 'object') {
          const dataError = data.error as Record<string, unknown>;
          if (typeof dataError.code === 'number') {
            code = dataError.code;
            apiMessage = typeof dataError.message === 'string' ? dataError.message : "";
          }
        }
      }
    }
    
    // Check direct properties: status, code, statusCode
    if (!code) {
      if (typeof errObj.status === 'number') {
        code = errObj.status;
      } else if (typeof errObj.code === 'number' && errObj.code >= 100 && errObj.code < 600) {
        // Only use code if it looks like an HTTP status (100-599)
        code = errObj.code;
      } else if (typeof errObj.statusCode === 'number') {
        code = errObj.statusCode;
      }
    }
  }
  
  // Strategy 2: Parse JSON from error message string (for stringified JSON-RPC responses)
  if (!code) {
    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*"error"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error && typeof parsed.error.code === 'number') {
          code = parsed.error.code;
          apiMessage = parsed.error.message || apiMessage;
        }
      }
    } catch {
      // JSON parsing failed
    }
  }
  
  // Strategy 3: Check for timeout/network errors (these are retryable)
  if (!code) {
    const errStr = errorMessage.toLowerCase();
    if (errStr.includes("etimedout") || errStr.includes("econnreset") || 
        errStr.includes("econnrefused") || errStr.includes("timeout") ||
        errStr.includes("network error")) {
      code = 408;
    }
  }
  
  // Generate user-friendly messages based on error code
  // Retry policy: only 408 (timeout), 429 (rate limit), and 5xx (server errors) are retryable
  // 401/403 are NOT retryable as they indicate auth/permission issues
  switch (code) {
    case 401:
      return new BagsApiError(
        code,
        `Bags.fm API authentication failed: ${apiMessage || errorMessage}`,
        "Token launch service is temporarily unavailable. Our team has been notified. Please try again later.",
        error,
        false // Auth errors are not retryable
      );
    case 403:
      return new BagsApiError(
        code,
        `Bags.fm API access forbidden: ${apiMessage || errorMessage}`,
        "Token launch service access denied. This may indicate an API key issue or account restriction. Please try again later or contact support if the issue persists.",
        error,
        false // 403 is not retryable - indicates permission/auth issue
      );
    case 408:
      return new BagsApiError(
        code,
        `Bags.fm API timeout: ${errorMessage}`,
        "Token launch request timed out. The Solana network may be congested. Please try again in a moment.",
        error,
        true
      );
    case 429:
      return new BagsApiError(
        code,
        `Bags.fm API rate limited: ${apiMessage || errorMessage}`,
        "Too many requests. Please wait a minute before trying again.",
        error,
        true
      );
    case 500:
    case 502:
    case 503:
      return new BagsApiError(
        code,
        `Bags.fm API server error (${code}): ${apiMessage || errorMessage}`,
        "Token launch service is experiencing issues. Please try again in a few minutes.",
        error,
        true
      );
    default:
      return new BagsApiError(
        code || 0,
        `Bags.fm API error: ${errorMessage}`,
        "An unexpected error occurred during token launch. Please try again. If the issue persists, contact support.",
        error,
        code >= 500 || code === 0
      );
  }
}

// Retry wrapper with exponential backoff for transient errors
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: BagsApiError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const bagsError = parseBagsApiError(error);
      lastError = bagsError;
      
      console.error(`Bags SDK ${operationName} attempt ${attempt}/${maxRetries} failed:`, {
        code: bagsError.code,
        message: bagsError.message,
        retryable: bagsError.retryable
      });
      
      // Don't retry non-retryable errors
      if (!bagsError.retryable) {
        throw bagsError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw bagsError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Bags SDK: Retrying ${operationName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("Unexpected retry failure");
}
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Allow platform wallet to be overridden via environment variable
const EFFECTIVE_PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || PLATFORM_WALLET;

// Bags.fm Fee Share V2 Program ID
const BAGS_FEE_SHARE_V2_PROGRAM_ID = new PublicKey("FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK");

// Validate platform wallet on startup
function validatePublicKey(address: string, name: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Invalid ${name} address: ${address}`);
  }
}

// Derive partner config PDA (same logic as SDK's deriveBagsFeeShareV2PartnerConfigPda)
function derivePartnerConfigPda(partner: PublicKey): PublicKey {
  const [partnerConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('partner_config'), partner.toBuffer()],
    BAGS_FEE_SHARE_V2_PROGRAM_ID
  );
  return partnerConfig;
}

// In production, require explicit platform wallet configuration
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.PLATFORM_WALLET_ADDRESS) {
  console.warn("Warning: PLATFORM_WALLET_ADDRESS not set in production. Using default platform wallet.");
}

// Validate platform wallet is a valid public key at startup
try {
  validatePublicKey(EFFECTIVE_PLATFORM_WALLET, "platform wallet");
} catch (e) {
  console.error("FATAL: Invalid platform wallet address:", EFFECTIVE_PLATFORM_WALLET);
  if (isProduction) {
    throw new Error("Invalid platform wallet address - cannot start in production");
  }
}

if (!BAGS_API_KEY) {
  console.warn("Warning: BAGS_API_KEY not set. Token launches will use mock data.");
}

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

let sdk: BagsSDK | null = null;

export function getBagsSDK(): BagsSDK {
  if (!sdk) {
    if (!BAGS_API_KEY) {
      throw new Error("BAGS_API_KEY is not configured");
    }
    sdk = new BagsSDK(BAGS_API_KEY, connection, "confirmed");
  }
  return sdk;
}

export function getConnection(): Connection {
  return connection;
}

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  initialBuyAmountSol?: number;
  creatorWallet: string;
}

export interface TokenInfoResult {
  tokenMint: string;
  metadataUrl: string;
}

export async function createTokenInfoAndMetadata(params: TokenLaunchParams): Promise<TokenInfoResult> {
  const sdk = getBagsSDK();
  
  console.log(`Bags SDK: Calling createTokenInfoAndMetadata for ${params.name} (${params.symbol})`);
  
  const result = await withRetry(
    () => sdk.tokenLaunch.createTokenInfoAndMetadata({
      name: params.name,
      symbol: params.symbol.toUpperCase().replace("$", ""),
      description: params.description || "",
      imageUrl: params.imageUrl || "",
      twitter: params.twitterUrl || "",
      website: params.websiteUrl || "",
    }),
    "createTokenInfoAndMetadata",
    3, // max retries
    2000 // 2 second base delay
  );

  console.log(`Bags SDK: createTokenInfoAndMetadata returned`);
  
  // Normalize tokenMint to base58 string - SDK may return PublicKey object, buffer, Keypair, or string
  let tokenMintString: string;
  const rawMint = result.tokenMint as any; // SDK typing may not match runtime type
  
  // Detailed logging for debugging
  try {
    const rawType = typeof rawMint;
    const constructorName = rawMint?.constructor?.name || 'unknown';
    const hasToBase58 = typeof rawMint?.toBase58 === 'function';
    const hasPublicKey = !!rawMint?.publicKey;
    const hasKeypair = !!rawMint?._keypair;
    const isUint8 = rawMint instanceof Uint8Array;
    const isBuffer = Buffer.isBuffer(rawMint);
    const isArray = Array.isArray(rawMint);
    const strValue = rawType === 'string' ? rawMint.slice(0, 50) : 'N/A';
    
    console.log(`Bags SDK raw tokenMint details:`);
    console.log(`  type=${rawType}, constructor=${constructorName}`);
    console.log(`  hasToBase58=${hasToBase58}, hasPublicKey=${hasPublicKey}, hasKeypair=${hasKeypair}`);
    console.log(`  isUint8=${isUint8}, isBuffer=${isBuffer}, isArray=${isArray}`);
    if (rawType === 'string') {
      console.log(`  stringValue="${strValue}..." (length=${rawMint.length})`);
    }
    if (hasPublicKey) {
      const pubKeyType = typeof rawMint.publicKey;
      const pubKeyConstructor = rawMint.publicKey?.constructor?.name || 'unknown';
      console.log(`  publicKey: type=${pubKeyType}, constructor=${pubKeyConstructor}`);
    }
  } catch (logError) {
    console.log(`Bags SDK raw tokenMint: logging failed`, logError);
  }
  
  // Helper to check if a string is a valid Solana address (matches routes.ts validation exactly)
  const isValidSolanaAddress = (address: string): boolean => {
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
  };

  // Helper to try decoding hex string to PublicKey
  const tryHexDecode = (hexStr: string): string | null => {
    try {
      // Remove 0x prefix if present
      const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
      // Hex should be 64 chars for 32 bytes
      if (cleanHex.length === 64 && /^[0-9a-fA-F]+$/.test(cleanHex)) {
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
        }
        return new PublicKey(bytes).toBase58();
      }
    } catch {}
    return null;
  };

  // Helper to try decoding base64 string to PublicKey
  const tryBase64Decode = (b64Str: string): string | null => {
    try {
      // Base64 for 32 bytes is ~44 chars
      const decoded = Buffer.from(b64Str, 'base64');
      if (decoded.length === 32) {
        return new PublicKey(decoded).toBase58();
      }
    } catch {}
    return null;
  };

  // Try multiple normalization strategies in order of likelihood
  try {
    if (typeof rawMint === 'string') {
      // Trim whitespace and remove any hidden characters that might be in the response
      const trimmedMint = rawMint.trim().replace(/[\r\n\t\x00-\x1F\x7F]/g, '');
      
      // Check if already valid Solana address (matches routes.ts validation)
      if (isValidSolanaAddress(trimmedMint)) {
        tokenMintString = trimmedMint;
      } else {
        // Try hex decoding
        const fromHex = tryHexDecode(trimmedMint);
        if (fromHex) {
          console.log(`Bags SDK: Decoded hex tokenMint to base58: ${fromHex}`);
          tokenMintString = fromHex;
        } else {
          // Try base64 decoding
          const fromBase64 = tryBase64Decode(trimmedMint);
          if (fromBase64) {
            console.log(`Bags SDK: Decoded base64 tokenMint to base58: ${fromBase64}`);
            tokenMintString = fromBase64;
          } else {
            // Try as-is via PublicKey constructor (handles some edge cases)
            console.log(`Bags SDK: Attempting PublicKey constructor for string: ${trimmedMint.slice(0, 20)}...`);
            tokenMintString = new PublicKey(trimmedMint).toBase58();
          }
        }
      }
    } else if (rawMint && typeof rawMint.toBase58 === 'function') {
      // PublicKey-like object with toBase58 method
      tokenMintString = rawMint.toBase58();
    } else if (rawMint && rawMint.publicKey && typeof rawMint.publicKey.toBase58 === 'function') {
      // Keypair-like object - extract the publicKey
      tokenMintString = rawMint.publicKey.toBase58();
    } else if (rawMint && rawMint._keypair && rawMint._keypair.publicKey) {
      // Internal keypair structure (Uint8Array)
      tokenMintString = new PublicKey(rawMint._keypair.publicKey).toBase58();
    } else if (rawMint instanceof Uint8Array || Buffer.isBuffer(rawMint)) {
      // Raw bytes - convert via PublicKey
      tokenMintString = new PublicKey(rawMint).toBase58();
    } else if (Array.isArray(rawMint) && rawMint.length === 32) {
      // Array of 32 bytes
      tokenMintString = new PublicKey(new Uint8Array(rawMint)).toBase58();
    } else {
      // Last resort - try PublicKey constructor
      tokenMintString = new PublicKey(rawMint).toBase58();
    }
  } catch (e) {
    const rawType = typeof rawMint;
    const constructorName = rawMint?.constructor?.name || 'unknown';
    console.error(`Failed to normalize tokenMint: type=${rawType}, constructor=${constructorName}`, e);
    throw new Error(`Invalid token mint returned from Bags SDK (type: ${rawType}, constructor: ${constructorName})`);
  }

  // Final validation: ensure the normalized tokenMint passes the same validation as routes.ts
  if (!isValidSolanaAddress(tokenMintString)) {
    console.error(`Bags SDK: Final tokenMint validation failed: "${tokenMintString}"`);
    console.error(`  tokenMintString length: ${tokenMintString.length}`);
    console.error(`  Raw mint type: ${typeof rawMint}, Raw value (first 100 chars): ${String(rawMint).slice(0, 100)}`);
    // Log additional debug info
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const regexPass = base58Regex.test(tokenMintString);
    let decodeLength = -1;
    let decodeError = '';
    try {
      decodeLength = bs58.decode(tokenMintString).length;
    } catch (e: any) {
      decodeError = e.message || 'unknown decode error';
    }
    console.error(`  Regex pass: ${regexPass}, Decoded length: ${decodeLength} (need 32), Decode error: ${decodeError}`);
    
    // Try one more fallback: use PublicKey constructor which is more lenient
    try {
      const fallbackPubkey = new PublicKey(tokenMintString);
      const fallbackAddress = fallbackPubkey.toBase58();
      console.log(`Bags SDK: PublicKey fallback succeeded: ${fallbackAddress}`);
      if (isValidSolanaAddress(fallbackAddress)) {
        tokenMintString = fallbackAddress;
      } else {
        throw new Error(`Token mint normalization produced invalid address: ${tokenMintString.slice(0, 20)}... (len=${tokenMintString.length}, regex=${regexPass}, bytes=${decodeLength}, err=${decodeError})`);
      }
    } catch (fallbackError: any) {
      console.error(`Bags SDK: PublicKey fallback also failed:`, fallbackError.message);
      throw new Error(`Token mint normalization produced invalid address: ${tokenMintString.slice(0, 20)}... (len=${tokenMintString.length}, regex=${regexPass}, bytes=${decodeLength}, err=${decodeError})`);
    }
  }

  console.log(`Bags SDK createTokenInfoAndMetadata: tokenMint=${tokenMintString}`);

  return {
    tokenMint: tokenMintString,
    metadataUrl: result.tokenMetadata,
  };
}

export interface FeeShareConfigParams {
  tokenMint: string;
  creatorWallet: string;
  charityWallet?: string;        // Direct wallet payout (optional)
  charityTwitterHandle?: string; // X account for Bags.fm claim system (optional)
  payoutMethod: "wallet" | "twitter";
  // Creator can donate 0-100% of their 20% share to charity (presets: 0, 25, 50, 75, 100)
  donateCreatorPercent?: number;
  // Legacy field for backward compat (true = 100% donation)
  donateCreatorShare?: boolean;
}

export interface FeeShareResult {
  configKey: string;
  transactions: string[];
  charityBps: number;
  buybackBps: number;
  creatorBps: number;
}

export async function createFeeShareConfig(
  params: FeeShareConfigParams
): Promise<FeeShareResult> {
  const sdk = getBagsSDK();
  
  // Calculate BPS split based on creator donation percentage
  // Support both new donateCreatorPercent (0-100) and legacy donateCreatorShare (boolean)
  let donateCreatorPercent = params.donateCreatorPercent ?? 0;
  if (params.donateCreatorShare === true && donateCreatorPercent === 0) {
    donateCreatorPercent = 100; // Legacy toggle was ON = 100% donation
  }
  
  // Calculate BPS split: creator can donate 0-100% of their 20% (2000 BPS) share
  // donated_creator_bps = round(CREATOR_FEE_BPS * donate_pct / 100)
  const donatedCreatorBps = Math.round(CREATOR_FEE_BPS * donateCreatorPercent / 100);
  const charityBps = CHARITY_FEE_BPS + donatedCreatorBps;
  const buybackBps = BUYBACK_FEE_BPS; // Always 500 BPS (5%)
  const creatorBps = CREATOR_FEE_BPS - donatedCreatorBps;
  
  // Validate BPS sum equals 10000
  const totalBps = charityBps + buybackBps + creatorBps;
  if (totalBps !== TOTAL_FEE_BPS) {
    throw new Error(`Invalid fee split: ${charityBps} + ${buybackBps} + ${creatorBps} = ${totalBps}, expected ${TOTAL_FEE_BPS}`);
  }
  
  console.log(`Bags SDK: Fee split - charity=${charityBps}, buyback=${buybackBps}, creator=${creatorBps}, donateCreatorPercent=${donateCreatorPercent}`);
  
  // Validate required public keys
  const tokenMintPubkey = validatePublicKey(params.tokenMint, "token mint");
  const creatorPubkey = validatePublicKey(params.creatorWallet, "creator wallet");
  const platformPubkey = validatePublicKey(EFFECTIVE_PLATFORM_WALLET, "platform wallet");
  
  // Partner is optional - only include if ENABLE_PARTNER_REFERRAL is set
  // Partner config must exist on-chain for this to work (created via dev.bags.fm)
  const enablePartner = process.env.ENABLE_PARTNER_REFERRAL === "true";
  let partnerPubkey: PublicKey | null = null;
  let partnerConfigPda: PublicKey | null = null;
  
  if (enablePartner) {
    try {
      partnerPubkey = validatePublicKey(PARTNER_WALLET, "partner wallet");
      partnerConfigPda = derivePartnerConfigPda(partnerPubkey);
      console.log("Partner referral enabled with wallet:", PARTNER_WALLET);
    } catch (e) {
      console.warn("Partner referral disabled - invalid partner wallet:", e);
      partnerPubkey = null;
      partnerConfigPda = null;
    }
  }
  
  // Build fee claimers array - only include recipients with BPS > 0
  let feeClaimers: any[] = [];
  
  // Helper to add claimer if BPS > 0
  const addClaimer = (user: PublicKey, bps: number) => {
    if (bps > 0) {
      feeClaimers.push({ user, userBps: bps });
    }
  };
  
  if (params.payoutMethod === "twitter" && params.charityTwitterHandle) {
    // Sanitize twitter handle: remove @ prefix and trim whitespace
    // Allow any valid X handle format - admin will verify legitimacy manually
    const rawHandle = params.charityTwitterHandle;
    const sanitizedHandle = rawHandle
      .replace(/^@/, "") // Remove leading @
      .trim();
    
    if (!sanitizedHandle || sanitizedHandle.length === 0) {
      throw new Error("X handle cannot be empty");
    }
    
    // Use Bags.fm X account claim system
    // First, resolve the X/Twitter handle to a wallet address using Bags API
    console.log("Bags SDK: Resolving X handle to wallet:", sanitizedHandle);
    let charityWalletFromTwitter: PublicKey;
    try {
      charityWalletFromTwitter = await sdk.state.getLaunchWalletForTwitterUsername(sanitizedHandle);
      console.log("Bags SDK: Resolved X handle", sanitizedHandle, "to wallet:", charityWalletFromTwitter.toBase58());
    } catch (error) {
      console.error("Bags SDK: Failed to resolve X handle to wallet:", error);
      throw new Error(`Failed to resolve X handle @${sanitizedHandle} to wallet. The charity may need to register with Bags.fm first. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Build fee claimers - only add creator if they have BPS allocation
    addClaimer(creatorPubkey, creatorBps);
    addClaimer(charityWalletFromTwitter, charityBps);
    addClaimer(platformPubkey, buybackBps);
  } else if (params.charityWallet) {
    // Direct wallet payout
    const charityPubkey = validatePublicKey(params.charityWallet, "charity wallet");
    
    // Build fee claimers - only add creator if they have BPS allocation
    addClaimer(creatorPubkey, creatorBps);
    addClaimer(charityPubkey, charityBps);
    addClaimer(platformPubkey, buybackBps);
  } else {
    throw new Error("Either charityWallet or charityTwitterHandle is required");
  }
  
  // Build config options - partner is optional
  const configOptions: any = {
    payer: creatorPubkey,
    baseMint: tokenMintPubkey,
    feeClaimers,
  };
  
  // Only include partner if properly configured
  if (partnerPubkey && partnerConfigPda) {
    configOptions.partner = partnerPubkey;
    configOptions.partnerConfig = partnerConfigPda;
  }
  
  console.log("Bags SDK: Creating fee share config with options:", JSON.stringify({
    payer: creatorPubkey.toBase58(),
    baseMint: tokenMintPubkey.toBase58(),
    feeClaimersCount: feeClaimers.length,
    hasPartner: !!partnerPubkey
  }));
  
  const configResult = await withRetry(
    () => sdk.config.createBagsFeeShareConfig(configOptions),
    "createBagsFeeShareConfig",
    3,
    2000
  );
  
  // Log the full response structure for debugging
  console.log("Bags SDK: Config result received:", JSON.stringify({
    hasTransactions: !!configResult.transactions,
    transactionsCount: configResult.transactions?.length || 0,
    hasBundles: !!configResult.bundles,
    bundlesCount: configResult.bundles?.length || 0,
    hasMeteorConfigKey: !!configResult.meteoraConfigKey,
    meteoraConfigKeyType: typeof configResult.meteoraConfigKey
  }));

  // Validate that meteoraConfigKey exists and has toBase58 method - it's optional in the SDK types but required for our flow
  const meteoraKey = configResult.meteoraConfigKey;
  if (!meteoraKey || typeof meteoraKey.toBase58 !== 'function') {
    console.error("Bags SDK: createBagsFeeShareConfig returned invalid meteoraConfigKey. Full result:", 
      JSON.stringify(configResult, (key, value) => {
        // Handle PublicKey and other complex objects
        if (value && typeof value === 'object' && typeof value.toBase58 === 'function') {
          return value.toBase58();
        }
        if (value instanceof Uint8Array) {
          return `[Uint8Array: ${value.length} bytes]`;
        }
        return value;
      }, 2)
    );
    console.error("meteoraConfigKey value:", meteoraKey, "type:", typeof meteoraKey);
    throw new Error("Failed to create fee share config: Bags API did not return a valid config key (missing toBase58 method). This may indicate an API version mismatch or the config already exists.");
  }

  const serializedTxs = configResult.transactions?.map(tx => 
    Buffer.from(tx.serialize()).toString("base64")
  ) || [];
  
  const configKey = meteoraKey.toBase58();
  console.log("Bags SDK: Fee share config created successfully. Config key:", configKey);

  return {
    configKey,
    transactions: serializedTxs,
    charityBps,
    buybackBps,
    creatorBps,
  };
}

export async function createLaunchTransaction(
  tokenMint: string,
  metadataUrl: string,
  configKey: string,
  creatorWallet: string,
  initialBuyLamports: number
): Promise<{ transaction: string }> {
  const sdk = getBagsSDK();
  
  console.log("Bags SDK: Creating launch transaction:", JSON.stringify({
    tokenMint,
    metadataUrl,
    configKey,
    creatorWallet,
    initialBuyLamports
  }));
  
  const launchTx = await withRetry(
    () => sdk.tokenLaunch.createLaunchTransaction({
      tokenMint: new PublicKey(tokenMint),
      metadataUrl,
      configKey: new PublicKey(configKey),
      launchWallet: new PublicKey(creatorWallet),
      initialBuyLamports,
    }),
    "createLaunchTransaction",
    3,
    2000
  );

  if (!launchTx) {
    throw new BagsApiError(
      0,
      "Failed to create launch transaction: Bags API returned empty response",
      "Token launch failed - the service returned an empty response. Please try again.",
      null,
      true
    );
  }

  const serializedTx = Buffer.from(launchTx.serialize()).toString("base64");
  console.log("Bags SDK: Launch transaction created successfully");
  
  return { transaction: serializedTx };
}

export function isConfigured(): boolean {
  return !!BAGS_API_KEY;
}

export function lamportsFromSol(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
