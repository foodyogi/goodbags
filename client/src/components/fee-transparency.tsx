import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { NEW_LAUNCH_SPLITS, formatPercent } from "@shared/feeSplit";

export function FeeTransparency() {
  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 mb-4" data-testid="badge-transparency">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400">Fee split for new launches</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3" data-testid="heading-fee-breakdown">
            Where a coin's shared trading fees go
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Bags.fm pays 25% of a coin's shared fees to the wallet that deploys it, which on GoodBags is the
            creator. The GoodBags split covers the other 75%. This is the effective split a new coin gets
            on-chain for each creator donation choice.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-new-launch-split">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Creator donates</th>
                  <th className="text-center py-2 px-3 font-medium">Charity</th>
                  <th className="text-center py-2 px-3 font-medium">Creator</th>
                  <th className="text-center py-2 px-3 font-medium">FYI buyback</th>
                </tr>
              </thead>
              <tbody>
                {NEW_LAUNCH_SPLITS.map((split) => (
                  <tr key={split.tier} className="border-b last:border-0" data-testid={`fee-row-tier-${split.tier}`}>
                    <td className="py-2 px-3">{split.tier}% of their share</td>
                    <td className="py-2 px-3 text-center font-semibold text-pink-600 dark:text-pink-400">
                      {formatPercent(split.charityPercent)}
                    </td>
                    <td className="py-2 px-3 text-center">{formatPercent(split.creatorPercent)}</td>
                    <td className="py-2 px-3 text-center">{formatPercent(split.buybackPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
            <p>
              The creator column includes the 25% deployer share. The buyback share is reserved for FYI token
              buybacks. None have been executed yet.
            </p>
            <p>
              Coins launched before September 2026 keep their original on-chain split, shown on each coin's page.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
