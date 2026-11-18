import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "wouter";
import { ThemedLogo } from "@/components/themed-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          <ThemedLogo className="h-20 w-20 rounded-xl object-contain" />
          <h1 className="text-2xl font-bold" data-testid="heading-not-found">404: Page not found</h1>
          <p className="text-sm text-muted-foreground">
            This page doesn't exist or has moved.
          </p>
          <Link href="/">
            <Button className="gap-2" data-testid="button-go-home">
              <Home className="h-4 w-4" />
              Back to GoodBags home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
