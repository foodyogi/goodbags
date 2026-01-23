import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { Connection, Keypair, VersionedTransaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58Pkg from "bs58";
// Handle ESM/CommonJS interop for bs58
const bs58 = (bs58Pkg as any).default ?? bs58Pkg;
import { storage } from "./storage";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

const SOL_MINT = "So11111111111111111111111111111111111111112";

// Validate and get FYI token mint from environment
function getFyiMint(): string {
  const mint = process.env.FEATURED_TOKEN_MINT;
  if (!mint) {
    console.warn("FEATURED_TOKEN_MINT not configured - buyback disabled");
    return "";
  }
  // Basic Solana address validation (base58, 32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    console.error("Invalid FEATURED_TOKEN_MINT format - buyback disabled");
    return "";
  }
  return mint;
}

const FYI_MINT = getFyiMint();

const MIN_BUYBACK_SOL = 0.01;
const SLIPPAGE_BPS = 100;

const jupiterApi = createJupiterApiClient();

let buybackKeypair: Keypair | null = null;

function getBuybackKeypair(): Keypair {
  if (buybackKeypair) return buybackKeypair;
  
  const privateKey = process.env.BUYBACK_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("BUYBACK_WALLET_PRIVATE_KEY not configured");
  }
  
  try {
    const decoded = bs58.decode(privateKey);
    buybackKeypair = Keypair.fromSecretKey(decoded);
    return buybackKeypair;
  } catch (e) {
    throw new Error("Invalid BUYBACK_WALLET_PRIVATE_KEY format");
  }
}

export function getBuybackWalletAddress(): string {
  try {
    return getBuybackKeypair().publicKey.toString();
  } catch {
    return "Not configured";
  }
}

export async function getBuybackWalletBalance(): Promise<number> {
  try {
    const keypair = getBuybackKeypair();
    const balance = await connection.getBalance(keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

export async function getQuote(solAmount: number): Promise<QuoteResponse | null> {
  try {
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
    
    const quote = await jupiterApi.quoteGet({
      inputMint: SOL_MINT,
      outputMint: FYI_MINT,
      amount: lamports,
      slippageBps: SLIPPAGE_BPS,
    });
    
    return quote;
  } catch (error) {
    console.error("Failed to get Jupiter quote:", error);
    return null;
  }
}

export async function executeBuyback(solAmount?: number): Promise<{
  success: boolean;
  txSignature?: string;
  solSpent?: number;
  fyiReceived?: number;
  error?: string;
}> {
  // Fail fast if token mint not configured
  if (!FYI_MINT) {
    return {
      success: false,
      error: "FEATURED_TOKEN_MINT not configured - buyback disabled",
    };
  }

  try {
    const keypair = getBuybackKeypair();
    
    const balance = await getBuybackWalletBalance();
    const amountToSwap = solAmount || balance - 0.005;
    
    if (amountToSwap < MIN_BUYBACK_SOL) {
      return {
        success: false,
        error: `Insufficient balance. Need at least ${MIN_BUYBACK_SOL} SOL, have ${balance.toFixed(4)} SOL`,
      };
    }
    
    console.log(`Executing buyback: ${amountToSwap.toFixed(4)} SOL -> FYI`);
    
    const quote = await getQuote(amountToSwap);
    if (!quote) {
      return { success: false, error: "Failed to get swap quote" };
    }
    
    const fyiAmount = Number(quote.outAmount) / Math.pow(10, 9);
    console.log(`Quote: ${amountToSwap} SOL -> ${fyiAmount} FYI`);
    
    const swapResult = await jupiterApi.swapPost({
      swapRequest: {
        quoteResponse: quote,
        userPublicKey: keypair.publicKey.toString(),
        wrapAndUnwrapSol: true,
      },
    });
    
    const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    
    transaction.sign([keypair]);
    
    const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    
    console.log(`Buyback transaction sent: ${txSignature}`);
    
    const confirmation = await connection.confirmTransaction(txSignature, "confirmed");
    
    if (confirmation.value.err) {
      await storage.createBuyback({
        solAmount: amountToSwap.toString(),
        fyiAmount: fyiAmount.toString(),
        transactionSignature: txSignature,
        status: "failed",
        errorMessage: JSON.stringify(confirmation.value.err),
      });
      
      return {
        success: false,
        txSignature,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      };
    }
    
    await storage.createBuyback({
      solAmount: amountToSwap.toString(),
      fyiAmount: fyiAmount.toString(),
      transactionSignature: txSignature,
      status: "completed",
    });
    
    console.log(`Buyback completed: ${amountToSwap} SOL -> ${fyiAmount} FYI`);
    
    return {
      success: true,
      txSignature,
      solSpent: amountToSwap,
      fyiReceived: fyiAmount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Buyback failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function getBuybackStats(): Promise<{
  totalBuybacks: number;
  totalSolSpent: number;
  totalFyiBought: number;
  walletBalance: number;
  walletAddress: string;
}> {
  const buybacksList = await storage.getAllBuybacks();
  const completed = buybacksList.filter(b => b.status === "completed");
  
  const totalSolSpent = completed.reduce((sum, b) => sum + Number(b.solAmount), 0);
  const totalFyiBought = completed.reduce((sum, b) => sum + Number(b.fyiAmount), 0);
  
  return {
    totalBuybacks: completed.length,
    totalSolSpent,
    totalFyiBought,
    walletBalance: await getBuybackWalletBalance(),
    walletAddress: getBuybackWalletAddress(),
  };
}

let buybackInterval: NodeJS.Timeout | null = null;

export function startAutoBuyback(intervalMs: number = 3600000): void {
  if (buybackInterval) {
    console.log("Auto-buyback already running");
    return;
  }
  
  console.log(`Starting auto-buyback every ${intervalMs / 1000 / 60} minutes`);
  
  buybackInterval = setInterval(async () => {
    try {
      const balance = await getBuybackWalletBalance();
      if (balance >= MIN_BUYBACK_SOL + 0.005) {
        console.log(`Auto-buyback triggered: ${balance.toFixed(4)} SOL available`);
        await executeBuyback();
      } else {
        console.log(`Auto-buyback skipped: ${balance.toFixed(4)} SOL (need ${MIN_BUYBACK_SOL + 0.005})`);
      }
    } catch (error) {
      console.error("Auto-buyback error:", error);
    }
  }, intervalMs);
}

export function stopAutoBuyback(): void {
  if (buybackInterval) {
    clearInterval(buybackInterval);
    buybackInterval = null;
    console.log("Auto-buyback stopped");
  }
}

export function initBuybackService(): void {
  const privateKey = process.env.BUYBACK_WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log("Buyback service: BUYBACK_WALLET_PRIVATE_KEY not set - auto-buyback disabled");
    return;
  }
  
  try {
    const keypair = getBuybackKeypair();
    console.log(`Buyback service initialized. Wallet: ${keypair.publicKey.toString()}`);
    
    startAutoBuyback();
  } catch (error) {
    console.error("Failed to initialize buyback service:", error);
  }
}
