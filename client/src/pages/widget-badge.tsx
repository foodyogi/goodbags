import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Award, Heart } from "lucide-react";

interface CreatorImpactData {
  creatorWallet: string;
  totalTokens: number;
  totalDonated: string;
  totalDonationCount: number;
  certified: boolean;
}

export default function WidgetBadge() {
  const params = useParams<{ wallet: string }>();
  const wallet = params.wallet;

  const { data: impactData, isLoading } = useQuery<CreatorImpactData>({
    queryKey: ["/api/creator", wallet, "impact"],
    enabled: !!wallet,
  });

  const formatSol = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return "0 SOL";
    return num < 0.001 ? "< 0.001 SOL" : `${num.toFixed(4)} SOL`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="p-2 bg-gradient-to-br from-gray-900 to-gray-800 h-[120px] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gradient-to-br from-gray-900 to-gray-800 h-[120px] flex items-center justify-center">
      <div className={`p-4 rounded-lg border-2 ${impactData?.certified ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-600 bg-gray-800/50'} max-w-[280px]`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${impactData?.certified ? 'bg-yellow-500/20' : 'bg-gray-700'}`}>
            <Award className={`h-5 w-5 ${impactData?.certified ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">
              {truncateAddress(wallet || "")} is a GoodBags {impactData?.certified ? 'certified creator' : 'supporter'}.
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {impactData?.certified 
                ? `Donated ${formatSol(impactData.totalDonated)} through ${impactData.totalDonationCount} transactions.`
                : "Supporting charity through Solana tokens."}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-pink-400">
            <Heart className="h-3 w-3" />
            <span>Verified Impact</span>
          </div>
          <span className="text-gray-500">GoodBags</span>
        </div>
      </div>
    </div>
  );
}
