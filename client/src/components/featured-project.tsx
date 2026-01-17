import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import { FEATURED_IMPACT_PROJECT } from "@shared/schema";
import { FyiCoin } from "@/components/fyi-coin";

export function FeaturedProject() {
  return (
    <section className="py-16 md:py-24 bg-muted/50 dark:bg-muted/20" data-testid="section-featured-project">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4" data-testid="badge-featured">
            <Heart className="w-3 h-3 mr-1" />
            Featured Impact Project
          </Badge>
          <h2 className="text-2xl font-bold" data-testid="text-featured-heading">Already Making a Difference</h2>
        </div>
        
        <Card className="max-w-2xl mx-auto" data-testid="card-featured-project">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-6">
              <div className="flex-shrink-0">
                <FyiCoin size="lg" />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold mb-1" data-testid="text-project-name">{FEATURED_IMPACT_PROJECT.name}</h3>
                <p className="text-sm text-muted-foreground mb-3" data-testid="text-project-description">
                  {FEATURED_IMPACT_PROJECT.description}
                </p>
                <Badge variant="outline" data-testid="badge-category">
                  {FEATURED_IMPACT_PROJECT.category === "hunger" ? "End Hunger" : FEATURED_IMPACT_PROJECT.category}
                </Badge>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  asChild
                  variant="default"
                  data-testid="button-trade-fyi-token"
                >
                  <a 
                    href={FEATURED_IMPACT_PROJECT.bagsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Trade Token
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground" data-testid="text-featured-footer">
                This impact token is already live on Bags.fm. Trade it to support the cause!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
