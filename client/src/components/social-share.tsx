import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, ExternalLink, MessageCircle, Search } from "lucide-react";
import { SiX } from "react-icons/si";

interface SocialShareProps {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  charityName: string | null;
  totalDonated?: string;
  isApproved?: boolean;
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
  totalDonated,
  isApproved 
}: SocialShareProps) {
  const goodbagsUrl = `https://goodbags.tech/token/${mintAddress}`;
  const bagsUrl = `https://bags.fm/${mintAddress}`;
  
  const getShareText = (type: 'launch' | 'milestone' | 'endorsed') => {
    const donated = formatSol(totalDonated);
    
    switch (type) {
      case 'endorsed':
        return `$${tokenSymbol} is now OFFICIALLY ENDORSED by ${charityName}! 

This memecoin is legit - the charity approved it.

Every trade donates to ${charityName}. Already donated: ${donated} SOL

View on GoodBags: ${goodbagsUrl}
Trade on Bags: ${bagsUrl}

#GoodBags #Solana #CharityMeme`;
      
      case 'milestone':
        return `The $${tokenSymbol} community just hit ${donated} SOL donated to ${charityName}! 

Memecoins making real impact. Join us:
${goodbagsUrl}

#GoodBags #Solana #CryptoForGood`;
      
      default:
        return `Check out $${tokenSymbol} on @GoodBagsIO!

Every trade automatically donates to ${charityName || 'charity'}.

View impact: ${goodbagsUrl}
Trade: ${bagsUrl}

#GoodBags #Solana #Memecoin`;
    }
  };
  
  const shareOnTwitter = (type: 'launch' | 'milestone' | 'endorsed' = 'launch') => {
    const text = encodeURIComponent(getShareText(type));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420');
  };

  const searchOnTwitter = () => {
    const query = encodeURIComponent(`$${tokenSymbol} OR ${tokenName}`);
    window.open(`https://twitter.com/search?q=${query}&f=live`, '_blank');
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

        {parseFloat(totalDonated || "0") > 0 && (
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
            Community growth drives trading volume, which means more donations!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
