import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaProvider } from "@/lib/solana";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import ImpactPage from "@/pages/impact";
import WidgetBadge from "@/pages/widget-badge";
import WidgetTicker from "@/pages/widget-ticker";
import NotFound from "@/pages/not-found";

function MainRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/launch" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/impact" component={ImpactPage} />
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
