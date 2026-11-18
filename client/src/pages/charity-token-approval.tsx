import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { SiX } from "react-icons/si";

// Approving coins by email address was retired; the X-verified charity portal is the only way
export default function CharityTokenApproval() {
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card data-testid="card-charity-approval-moved">
        <CardContent className="p-8 text-center space-y-4">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Charities approve coins through the X-verified portal</h1>
          <p className="text-muted-foreground">
            Approving or denying a coin by email address is no longer possible. When a coin is launched for your
            charity, GoodBags sends you a link to the charity portal for that coin. Open it and sign in with your
            charity's official X account to endorse or deny the coin.
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <SiX className="h-4 w-4" />
            Only the X account on file for your charity can approve or deny its coins.
          </p>
          <Link href="/faq">
            <Button variant="outline" data-testid="button-charity-approval-faq">How charity approval works</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
