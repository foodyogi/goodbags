import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import { FyiCoin } from "@/components/fyi-coin";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedProjectData {
  name: string;
  tokenMint: string;
  bagsUrl: string;
  description: string;
  category: string;
}

export function FeaturedProject() {
  const { data: project, isLoading, error } = useQuery<FeaturedProjectData>({
    queryKey: ["/api/config/featured-project"],
  });

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-muted/50 dark:bg-muted/20" data-testid="section-featured-project">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-8">
            <Skeleton className="h-6 w-40 mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto" />
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-6">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !project) {
    return null;
  }

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
                <h3 className="text-lg font-bold mb-1" data-testid="text-project-name">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-3" data-testid="text-project-description">
                  {project.description}
                </p>
                <Badge variant="outline" data-testid="badge-category">
                  {project.category === "hunger" ? "End Hunger" : project.category}
                </Badge>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  asChild
                  variant="default"
                  data-testid="button-trade-fyi-token"
                >
                  <a 
                    href={project.bagsUrl} 
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
