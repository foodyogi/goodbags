import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, ExternalLink, MessageCircle, Search } from "lucide-react";
import { SiX } from "react-icons/si";

interface SocialShareProps {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  charityName: string | null;
  claimedSol?: string | null; // Verified on-chain fee claims
  isApproved?: boolean;
  endorsedBy?: "charity" | "goodbags_team" | null;
}

function formatSol(value: string | null | undefined): string {
  if (!value) return "0";
  const num = parseFloat(value);
  if (num === 0) return "0";
  if (num < 0.001) return "< 0.001";
  if (num < 1) return num.toFixed(4);
  return num.toFixed(2);
}

export function SocialShare({ 
  tokenName, 
  tokenSymbol, 
  mintAddress, 
  charityName, 
  claimedSol,
  isApproved,
  endorsedBy
}: SocialShareProps) {
  const goodbagsUrl = `https://goodbags.tech/tokens/${mintAddress}`;
  const bagsUrl = `https://bags.fm/${mintAddress}`;
  
  const getShareText = (type: 'launch' | 'milestone' | 'endorsed') => {
    const claimed = formatSol(claimedSol);
    
    switch (type) {
      case 'endorsed':
        return `${endorsedBy === "goodbags_team"
          ? `$${tokenSymbol} is endorsed by the GoodBags team on behalf of ${charityName}.`
          : `$${tokenSymbol} is endorsed by ${charityName}.`}

An endorsement is not financial advice. Trading tokens carries risk.

Every trade earns ${charityName} a share of the fees. Verified on-chain fee claims so far: ${claimed} SOL

View on GoodBags: ${goodbagsUrl}
Trade on Bags: ${bagsUrl}

#GoodBags #Solana #CharityMeme`;
      
      case 'milestone':
        return `The $${tokenSymbol} community just hit ${claimed} SOL in verified on-chain fee claims by ${charityName}! 

Charity fundraising, built into the token. Join us:
${goodbagsUrl}

#GoodBags #Solana #CryptoForGood`;
      
      default:
        return `Check out $${tokenSymbol} on @goodbagstech!

Every trade earns ${charityName || 'charity'} a share of the fees.

View impact: ${goodbagsUrl}
Trade: ${bagsUrl}

#GoodBags #Solana #CharityCoin`;
    }
  };
  
  const shareOnTwitter = (type: 'launch' | 'milestone' | 'endorsed' = 'launch') => {
    const text = encodeURIComponent(getShareText(type));
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    // Use window.location for mobile to avoid popup blockers
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = twitterUrl;
    } else {
      window.open(twitterUrl, '_blank', 'width=550,height=420');
    }
  };

  const searchOnTwitter = () => {
    const query = encodeURIComponent(`$${tokenSymbol} OR ${tokenName}`);
    const searchUrl = `https://twitter.com/search?q=${query}&f=live`;
    // Use window.location for mobile to avoid popup blockers
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = searchUrl;
    } else {
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <Card data-testid="card-social-share">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" data-testid="title-social-share">
          <Share2 className="h-5 w-5 text-blue-500" />
          Spread the Word
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground" data-testid="text-share-intro">
          Help grow the ${tokenSymbol} community by sharing on social media.
        </p>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => shareOnTwitter('launch')}
            data-testid="button-share-twitter"
          >
            <SiX className="h-4 w-4" />
            Share Token
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={searchOnTwitter}
            data-testid="button-search-twitter"
          >
            <Search className="h-4 w-4" />
            See Mentions
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {isApproved && (
          <Button 
            className="w-full gap-2"
            onClick={() => shareOnTwitter('endorsed')}
            data-testid="button-share-endorsed"
          >
            <SiX className="h-4 w-4" />
            Share Endorsement
          </Button>
        )}

        {parseFloat(claimedSol || "0") > 0 && (
          <Button 
            variant="secondary"
            className="w-full gap-2"
            onClick={() => shareOnTwitter('milestone')}
            data-testid="button-share-milestone"
          >
            <MessageCircle className="h-4 w-4" />
            Share Impact Milestone
          </Button>
        )}

        <div className="pt-3 border-t" data-testid="section-share-footer">
          <p className="text-xs text-muted-foreground text-center" data-testid="text-share-footer">
            Community growth drives trading volume, which grows the charity's share of fees.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
