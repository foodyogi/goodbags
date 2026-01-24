import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaProvider } from "@/lib/solana";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VerificationNotice } from "@/components/verification-notice";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ImpactPage from "@/pages/impact";
import MyImpactPage from "@/pages/my-impact";
import PublicProfilePage from "@/pages/public-profile";
import CharityApply from "@/pages/charity-apply";
import AdminCharities from "@/pages/admin-charities";
import CharityTokenApproval from "@/pages/charity-token-approval";
import CharitiesPage from "@/pages/charities";
import BuybackPage from "@/pages/buyback";
import HowItWorksPage from "@/pages/how-it-works";
import FeaturesPage from "@/pages/features";
import FoodYogaInternational from "@/pages/food-yoga-international";
import WidgetBadge from "@/pages/widget-badge";
import WidgetTicker from "@/pages/widget-ticker";
import TokenDetailPage from "@/pages/token-detail";
import NotFound from "@/pages/not-found";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/launch" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/my-impact" component={MyImpactPage} />
      <Route path="/profile/:wallet" component={PublicProfilePage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/charities" component={CharitiesPage} />
      <Route path="/charities/apply" component={CharityApply} />
      <Route path="/buyback" component={BuybackPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/ffl" component={FoodYogaInternational} />
      <Route path="/food-yoga-international" component={FoodYogaInternational} />
      <Route path="/admin/charities" component={AdminCharities} />
      <Route path="/charity/tokens" component={CharityTokenApproval} />
      <Route path="/token/:mint" component={TokenDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WidgetRouter() {
  return (
    <Switch>
      <Route path="/widget/badge/:wallet" component={WidgetBadge} />
      <Route path="/widget/ticker/:wallet" component={WidgetTicker} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isWidget = location.startsWith('/widget/');

  if (isWidget) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WidgetRouter />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SolanaProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <VerificationNotice />
            <main className="flex-1">
              <MainRouter />
            </main>
            <Footer />
          </div>
        </SolanaProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
