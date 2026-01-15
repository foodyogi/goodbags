import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const BAGS_API_KEY = process.env.BAGS_API_KEY;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

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

export async function createFeeShareConfig(
  tokenMint: string,
  creatorWallet: string
): Promise<{ configKey: string; transactions: string[] }> {
  const sdk = getBagsSDK();
  
  const tokenMintPubkey = new PublicKey(tokenMint);
  const creatorPubkey = new PublicKey(creatorWallet);
  
  const configResult = await sdk.config.createBagsFeeShareConfig({
    payer: creatorPubkey,
    baseMint: tokenMintPubkey,
    feeClaimers: [{ user: creatorPubkey, userBps: 10000 }],
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
