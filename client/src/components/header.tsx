import { Link, useLocation } from "wouter";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { LayoutDashboard, Heart, Menu, X, Award, Shield, TrendingUp, Info, Trophy, Sparkles, Rocket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ThemedLogo } from "@/components/themed-logo";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  const twitterUsername = (user as any)?.twitterUsername;

  const navItems = [
    { href: "/", label: "Launch", icon: Rocket },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/my-impact", label: "My Impact", icon: Trophy },
    { href: "/charities", label: "Charities", icon: Heart },
    { href: "/buyback", label: "Buyback", icon: TrendingUp },
    { href: "/features", label: "Features", icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
          <ThemedLogo className="h-10 w-10 rounded-lg object-contain" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight">GoodBags</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              {isAuthenticated && twitterUsername ? (
                <>
                  <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">@{twitterUsername}</span>
                </>
              ) : (
                <>
                  <Heart className="h-2.5 w-2.5 text-pink-500" />
                  Launch tokens for good
                </>
              )}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="gap-2"
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block" data-testid="user-menu-container">
            <UserMenu />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="pt-2 sm:hidden" data-testid="user-menu-mobile">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
