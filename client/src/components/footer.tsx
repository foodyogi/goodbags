import { Link } from "wouter";
import { Heart, ExternalLink, Building2, Shield, TrendingUp, Info, Utensils, Sparkles, Mail } from "lucide-react";
import { SiSolana, SiX } from "react-icons/si";
import { ThemedLogo } from "@/components/themed-logo";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ThemedLogo className="h-16 w-16 rounded-xl object-contain" />
              <span className="font-semibold text-foreground">GoodBags</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Launch memecoins that make a difference. Every trade supports verified charities.
            </p>
            <div className="flex flex-col gap-1.5">
              <a
                href="mailto:contact@master22solutions.com"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-email"
              >
                <Mail className="h-3 w-3" />
                contact@master22solutions.com
              </a>
              <a
                href="https://x.com/goodbagstech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-x"
              >
                <SiX className="h-3 w-3" />
                @goodbagstech
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Transparency</p>
            <div className="flex flex-col gap-2">
              <Link
                href="/ffl"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-ffl"
              >
                <Utensils className="h-3 w-3" />
                Food Yoga International
              </Link>
              <Link
                href="/charities"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-charities"
              >
                <Heart className="h-3 w-3" />
                Verified Charities
              </Link>
              <Link
                href="/buyback"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-buyback"
              >
                <TrendingUp className="h-3 w-3" />
                FYI Buyback Dashboard
              </Link>
              <Link
                href="/how-it-works"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-how-it-works"
              >
                <Info className="h-3 w-3" />
                How It Works
              </Link>
              <Link
                href="/features"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-features"
              >
                <Sparkles className="h-3 w-3" />
                All Features
              </Link>
              <Link
                href="/charities/apply"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-register-charity"
              >
                <Building2 className="h-3 w-3" />
                Register Your Charity
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Powered By</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://bags.fm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-bags"
              >
                Bags.fm
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-solana"
              >
                <SiSolana className="h-3 w-3" />
                Solana Blockchain
              </a>
              <a
                href="https://jup.ag"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-jupiter"
              >
                Jupiter (Buyback Swaps)
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Master 22 Solutions. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Built with</span>
              <Heart className="h-3 w-3 text-pink-500" />
              <span>for social impact</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-green-500" />
              <span>On-chain verified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
