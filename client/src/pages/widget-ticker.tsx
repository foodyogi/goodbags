import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Heart } from "lucide-react";

interface CreatorImpactData {
  totalDonated: string;
  certified: boolean;
}

export default function WidgetTicker() {
  const params = useParams<{ wallet: string }>();
  const wallet = params.wallet;

  const { data: impactData, isLoading } = useQuery<CreatorImpactData>({
    queryKey: ["/api/creator", wallet, "impact"],
    enabled: !!wallet,
  });

  const formatSol = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return "0";
    return num < 0.001 ? "<0.001" : num.toFixed(4);
  };

  if (isLoading) {
    return (
      <div className="p-1 bg-gray-900 h-[40px] flex items-center justify-center">
        <div className="animate-pulse text-white/50 text-xs">...</div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gradient-to-r from-pink-900/80 to-purple-900/80 h-[40px] flex items-center justify-center">
      <div className="flex items-center gap-2 text-white">
        <Heart className="h-4 w-4 text-pink-400" />
        <span className="text-sm font-medium">
          {formatSol(impactData?.totalDonated || "0")} SOL donated
        </span>
        {impactData?.certified && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 font-medium">
            Certified
          </span>
        )}
      </div>
    </div>
  );
}
