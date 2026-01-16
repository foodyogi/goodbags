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

  return {
    tokenMint: result.tokenMint,
    metadataUrl: result.tokenMetadata,
  };
}

export interface FeeShareConfigParams {
  tokenMint: string;
  creatorWallet: string;
  charityWallet: string;
}

export async function createFeeShareConfig(
  params: FeeShareConfigParams
): Promise<{ configKey: string; transactions: string[] }> {
  const sdk = getBagsSDK();
  
  // Validate all public keys before creating config
  const tokenMintPubkey = validatePublicKey(params.tokenMint, "token mint");
  const creatorPubkey = validatePublicKey(params.creatorWallet, "creator wallet");
  const charityPubkey = validatePublicKey(params.charityWallet, "charity wallet");
  const platformPubkey = validatePublicKey(EFFECTIVE_PLATFORM_WALLET, "platform wallet");
  
  // Set up fee claimers with proper splits:
  // - Creator gets remainder (98.75%)
  // - Charity gets 1%
  // - Platform gets 0.25%
  const feeClaimers = [
    { user: creatorPubkey, userBps: CREATOR_FEE_BPS },
    { user: charityPubkey, userBps: CHARITY_FEE_BPS },
    { user: platformPubkey, userBps: PLATFORM_FEE_BPS },
  ];
  
  // Include partner wallet to earn Bags.fm referral credits
  const partnerPubkey = validatePublicKey(PARTNER_WALLET, "partner wallet");
  
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
