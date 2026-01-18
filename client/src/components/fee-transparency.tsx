import { Card } from "@/components/ui/card";
import { Heart, Coins, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { 
  CHARITY_FEE_PERCENTAGE, 
  PLATFORM_FEE_PERCENTAGE,
  TOTAL_FEE_PERCENTAGE
} from "@shared/schema";

interface FeeRowProps {
  percentage: string;
  recipient: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

function FeeRow({ percentage, recipient, description, icon: Icon, color, testId }: FeeRowProps & { testId: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30" data-testid={testId}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold" data-testid={`${testId}-percentage`}>{percentage}</span>
          <span className="font-medium text-foreground" data-testid={`${testId}-recipient`}>{recipient}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function FeeTransparency() {
  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 mb-4" data-testid="badge-transparency">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400">Low 1% Fee</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="heading-fee-breakdown">
            Every Trade Supports Your Cause
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlike other platforms where creators keep trading fees, GoodBags sends 
            most of the royalty to your chosen charity.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-6">
          <div className="mb-6 p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
            <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
              <span className="font-semibold text-pink-600 dark:text-pink-400">{CHARITY_FEE_PERCENTAGE}% to charity</span>
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{PLATFORM_FEE_PERCENTAGE}% platform</span>
              <span className="text-muted-foreground">=</span>
              <span className="font-bold">{TOTAL_FEE_PERCENTAGE}% total per trade</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <FeeRow
              percentage={`${CHARITY_FEE_PERCENTAGE}%`}
              recipient="to Your Chosen Charity"
              description="The full trading royalty goes directly to verified charities you choose"
              icon={Heart}
              color="bg-pink-500 dark:bg-pink-600"
              testId="fee-row-charity"
            />
            <FeeRow
              percentage={`+${PLATFORM_FEE_PERCENTAGE}%`}
              recipient="to FYI Buyback"
              description="Additional platform fee auto-buys FYI tokens, supporting the ecosystem"
              icon={TrendingUp}
              color="bg-secondary"
              testId="fee-row-platform"
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border" data-testid="section-referral-credits">
            <div className="flex items-start gap-3 flex-wrap">
              <Coins className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Bags.fm Referral Credits</p>
                <p className="text-sm text-muted-foreground">
                  All token launches also earn Bags.fm referral credits, which automatically 
                  buy FYI tokens to support platform growth and sustainability.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
