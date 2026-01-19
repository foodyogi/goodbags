import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  PLATFORM_WALLET, 
  CHARITY_FEE_BPS, 
  PLATFORM_FEE_BPS, 
  CREATOR_FEE_BPS,
  PARTNER_WALLET
} from "@shared/schema";

const BAGS_API_KEY = process.env.BAGS_API_KEY;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Allow platform wallet to be overridden via environment variable
const EFFECTIVE_PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || PLATFORM_WALLET;

// Validate platform wallet on startup
function validatePublicKey(address: string, name: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Invalid ${name} address: ${address}`);
  }
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
  
  const result = await sdk.tokenLaunch.createTokenInfoAndMetadata({
    name: params.name,
    symbol: params.symbol.toUpperCase().replace("$", ""),
    description: params.description || "",
    imageUrl: params.imageUrl || "",
    twitter: params.twitterUrl || "",
    website: params.websiteUrl || "",
  });

  // Normalize tokenMint to base58 string - SDK may return PublicKey object, buffer, or string
  let tokenMintString: string;
  const rawMint = result.tokenMint as any; // SDK typing may not match runtime type
  
  if (typeof rawMint === 'string') {
    tokenMintString = rawMint;
  } else if (rawMint && typeof rawMint.toBase58 === 'function') {
    // PublicKey-like object
    tokenMintString = rawMint.toBase58();
  } else {
    // Try to convert via PublicKey constructor (handles buffer/array/Uint8Array)
    try {
      tokenMintString = new PublicKey(rawMint).toBase58();
    } catch (e) {
      console.error("Failed to normalize tokenMint:", rawMint, e);
      throw new Error("Invalid token mint returned from Bags SDK");
    }
  }

  console.log(`Bags SDK createTokenInfoAndMetadata: tokenMint=${tokenMintString}, originalType=${typeof rawMint}`);

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
}

export async function createFeeShareConfig(
  params: FeeShareConfigParams
): Promise<{ configKey: string; transactions: string[] }> {
  const sdk = getBagsSDK();
  
  // Validate required public keys
  const tokenMintPubkey = validatePublicKey(params.tokenMint, "token mint");
  const creatorPubkey = validatePublicKey(params.creatorWallet, "creator wallet");
  const platformPubkey = validatePublicKey(EFFECTIVE_PLATFORM_WALLET, "platform wallet");
  
  // Include partner wallet to earn Bags.fm referral credits
  const partnerPubkey = validatePublicKey(PARTNER_WALLET, "partner wallet");
  
  let feeClaimers: any[];
  
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
    // Charity will claim via Bags app by connecting their wallet
    feeClaimers = [
      { user: creatorPubkey, userBps: CREATOR_FEE_BPS },
      { 
        platform: "twitter", 
        handle: sanitizedHandle,
        percentage: CHARITY_FEE_BPS / 100 // Convert bps to percentage (75 bps = 0.75%)
      },
      { user: platformPubkey, userBps: PLATFORM_FEE_BPS },
    ];
  } else if (params.charityWallet) {
    // Direct wallet payout
    const charityPubkey = validatePublicKey(params.charityWallet, "charity wallet");
    feeClaimers = [
      { user: creatorPubkey, userBps: CREATOR_FEE_BPS },
      { user: charityPubkey, userBps: CHARITY_FEE_BPS },
      { user: platformPubkey, userBps: PLATFORM_FEE_BPS },
    ];
  } else {
    throw new Error("Either charityWallet or charityTwitterHandle is required");
  }
  
  const configResult = await sdk.config.createBagsFeeShareConfig({
    payer: creatorPubkey,
    baseMint: tokenMintPubkey,
    feeClaimers,
    partner: partnerPubkey,
  });

  const serializedTxs = configResult.transactions?.map(tx => 
    Buffer.from(tx.serialize()).toString("base64")
  ) || [];

  return {
    configKey: configResult.meteoraConfigKey.toBase58(),
    transactions: serializedTxs,
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
  
  const launchTx = await sdk.tokenLaunch.createLaunchTransaction({
    tokenMint: new PublicKey(tokenMint),
    metadataUrl,
    configKey: new PublicKey(configKey),
    launchWallet: new PublicKey(creatorWallet),
    initialBuyLamports,
  });

  const serializedTx = Buffer.from(launchTx.serialize()).toString("base64");
  
  return { transaction: serializedTx };
}

export function isConfigured(): boolean {
  return !!BAGS_API_KEY;
}

export function lamportsFromSol(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL);
}
