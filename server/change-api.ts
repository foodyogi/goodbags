import { z } from "zod";

const CHANGE_API_BASE = "https://api.getchange.io/api/v1";

const changeNonprofitSchema = z.object({
  id: z.string(),
  name: z.string(),
  ein: z.string().optional().nullable(),
  icon_url: z.string().optional().nullable(),
  mission: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  classification: z.string().optional().nullable(),
  socials: z.object({
    facebook: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
  }).optional().nullable(),
  crypto: z.object({
    solana_address: z.string().optional().nullable(),
    ethereum_address: z.string().optional().nullable(),
  }).optional().nullable(),
  display_impact: z.array(z.string()).optional().nullable(),
  stats: z.array(z.string()).optional().nullable(),
});

const searchResponseSchema = z.object({
  nonprofits: z.array(changeNonprofitSchema),
  page: z.number().optional(),
});

export type ChangeNonprofit = z.infer<typeof changeNonprofitSchema>;
export type ChangeSearchResponse = z.infer<typeof searchResponseSchema>;

function getAuthHeaders(): HeadersInit {
  const publicKey = process.env.CHANGE_API_PUBLIC_KEY;
  const secretKey = process.env.CHANGE_API_SECRET_KEY;
  
  if (!publicKey || !secretKey) {
    throw new Error("Change API credentials not configured");
  }
  
  const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
  
  return {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

export async function searchNonprofits(
  query: string,
  options: { page?: number; categories?: string[] } = {}
): Promise<ChangeSearchResponse> {
  const params = new URLSearchParams();
  params.set("search_term", query);
  
  if (options.page) {
    params.set("page", options.page.toString());
  }
  
  if (options.categories && options.categories.length > 0) {
    params.set("categories", options.categories.join(","));
  }
  
  const url = `${CHANGE_API_BASE}/nonprofits?${params.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Change API error:", response.status, errorText);
    throw new Error(`Change API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return searchResponseSchema.parse(data);
}

export async function getNonprofitById(id: string): Promise<ChangeNonprofit | null> {
  const url = `${CHANGE_API_BASE}/nonprofits/${id}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Change API error:", response.status, errorText);
    throw new Error(`Change API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return changeNonprofitSchema.parse(data);
}

export function mapChangeCategory(category: string | null | undefined): string {
  if (!category) return "other";
  
  const categoryMap: Record<string, string> = {
    "healthcare": "health",
    "health": "health",
    "education": "education",
    "environment": "environment",
    "animals": "animals",
    "animal_welfare": "animals",
    "hunger": "hunger",
    "food": "hunger",
    "poverty": "hunger",
    "disaster": "disaster",
    "disaster_relief": "disaster",
    "community": "community",
    "human_services": "community",
    "arts": "community",
    "religion": "community",
    "international": "community",
  };
  
  const lowerCategory = category.toLowerCase();
  return categoryMap[lowerCategory] || "other";
}

export function hasValidSolanaWallet(nonprofit: ChangeNonprofit): boolean {
  return !!(nonprofit.crypto?.solana_address && nonprofit.crypto.solana_address.length >= 32);
}
