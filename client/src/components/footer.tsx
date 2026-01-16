import { Heart, ExternalLink } from "lucide-react";
import { SiSolana } from "react-icons/si";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-pink-500" />
            <span>by</span>
            <span className="font-medium text-foreground">GoodBags</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://bags.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-bags"
            >
              Powered by Bags.fm
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-footer-solana"
            >
              <SiSolana className="h-4 w-4" />
              Solana
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
