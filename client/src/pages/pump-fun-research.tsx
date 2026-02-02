import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PumpFunResearch() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden sticky top-0 bg-background/95 backdrop-blur border-b p-4 flex items-center justify-between z-50">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to GoodBags
          </Button>
        </Link>
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="space-y-8">
          <header className="text-center border-b pb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">GoodPump</h1>
            <p className="text-xl text-muted-foreground">Pump.fun Clone for Charitable Token Launches</p>
            <p className="text-sm text-muted-foreground mt-4">Research & Implementation Plan</p>
            <p className="text-sm text-muted-foreground">Prepared: February 2026</p>
          </header>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">Executive Summary</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  GoodPump (goodpump.live) is a proposed charitable memecoin launchpad built on the pump.fun model, 
                  enabling users to create tokens with automatic charity fee allocation. Unlike the existing GoodBags 
                  platform (built on Bags.fm), GoodPump would leverage pump.fun's native creator fee-sharing mechanism 
                  to automatically route trading fees to verified charity wallets.
                </p>
                <div className="bg-accent/50 p-4 rounded-md">
                  <p className="font-semibold">Key Advantage:</p>
                  <p>Pump.fun's built-in fee-sharing supports up to 10 wallets with customizable percentages, 
                  making it ideal for transparent charity allocation without custom smart contracts.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">Platform Research: Pump.fun</h2>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Fee Type</th>
                      <th className="text-left py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Token Creation</td>
                      <td className="py-2">0.02 SOL (approximately $3-4 USD)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Trading Fee</td>
                      <td className="py-2">1% per transaction</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Creator Fee Share</td>
                      <td className="py-2">0.30% - 0.95% of trading volume (configurable)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Migration Fee</td>
                      <td className="py-2">Zero (free graduation to PumpSwap/Raydium)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Graduation Threshold</td>
                      <td className="py-2">~$69,000 market cap (85 SOL bonding curve)</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Creator Fee Sharing Mechanism</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Supports up to <strong>10 wallet addresses</strong> per token</li>
                  <li>Fully customizable percentage split between wallets</li>
                  <li>Fees accumulate in creator dashboard and can be claimed anytime</li>
                  <li>Perfect for: Creator (20%), Charity (75%), Platform (5%) split</li>
                  <li>Fees paid in SOL directly to specified wallets</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API & Integration Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">PumpPortal API</h4>
                    <p className="text-muted-foreground mb-2">Third-party API for programmatic token creation and trading</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Create tokens programmatically with custom metadata</li>
                      <li>Execute trades via API</li>
                      <li>WebSocket support for real-time price updates</li>
                      <li>Documentation: pumpportal.fun/api-docs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pump.fun Direct Integration</h4>
                    <p className="text-muted-foreground mb-2">Native pump.fun integration options</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Embed pump.fun trading widget on your site</li>
                      <li>Deep links to pump.fun token pages</li>
                      <li>Referral program for additional revenue</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="page-break-before">
            <h2 className="text-2xl font-bold mb-4 text-primary">Technical Implementation Plan</h2>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                    Token Creation Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>User selects charity from verified list (75+ charities)</li>
                    <li>User configures token name, symbol, image, and description</li>
                    <li>System pre-configures fee split: 75% charity, 20% creator, 5% platform</li>
                    <li>Create token via PumpPortal API with fee-sharing wallets</li>
                    <li>Store token metadata and charity association in database</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                    Charity Wallet Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Maintain database of verified charity Solana wallet addresses</li>
                    <li>Charities can claim/update their wallet via X/Twitter verification</li>
                    <li>Automatic fee routing to charity wallets via pump.fun's native system</li>
                    <li>No custom smart contracts needed - uses pump.fun's infrastructure</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                    Real-Time Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>WebSocket connection to pump.fun for live trade updates</li>
                    <li>Track accumulated fees per token and per charity</li>
                    <li>Public dashboard showing total donations per charity</li>
                    <li>Alert system when tokens reach graduation threshold</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                    SOL to USDC Conversion (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Integrate Jupiter aggregator for automatic SOL→USDC swaps</li>
                    <li>Charities receive stable USDC instead of volatile SOL</li>
                    <li>Batch conversions to minimize transaction costs</li>
                    <li>Optional: Let charities choose SOL or USDC preference</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
                    Charity Approval System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Port existing X/Twitter verification system from GoodBags</li>
                    <li>Charities approve/deny tokens launched in their name</li>
                    <li>Anti-rug pull protection through charity endorsement</li>
                    <li>Email notifications when new tokens are launched</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="page-break-before">
            <h2 className="text-2xl font-bold mb-4 text-primary">10-Task Implementation Roadmap</h2>
            
            <Card>
              <CardContent className="pt-6">
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                    <div>
                      <p className="font-semibold">Set Up PumpPortal API Integration</p>
                      <p className="text-sm text-muted-foreground">Register for API access, implement authentication, test token creation in devnet</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                    <div>
                      <p className="font-semibold">Database Schema Updates</p>
                      <p className="text-sm text-muted-foreground">Add pump.fun token tracking, fee accumulation tables, platform type field</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                    <div>
                      <p className="font-semibold">Token Creation UI</p>
                      <p className="text-sm text-muted-foreground">Build form for pump.fun token launches with charity selection and fee configuration</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                    <div>
                      <p className="font-semibold">Fee-Sharing Wallet Configuration</p>
                      <p className="text-sm text-muted-foreground">Implement logic to split fees between charity, creator, and platform wallets</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">5</span>
                    <div>
                      <p className="font-semibold">WebSocket Trade Monitoring</p>
                      <p className="text-sm text-muted-foreground">Real-time tracking of trades, volume, and fee accumulation per token</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">6</span>
                    <div>
                      <p className="font-semibold">Charity Dashboard</p>
                      <p className="text-sm text-muted-foreground">Show accumulated fees, pending claims, and donation history per charity</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">7</span>
                    <div>
                      <p className="font-semibold">Jupiter Integration for SOL→USDC</p>
                      <p className="text-sm text-muted-foreground">Automated conversion system for charity payouts in stablecoins</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">8</span>
                    <div>
                      <p className="font-semibold">Port Charity Approval System</p>
                      <p className="text-sm text-muted-foreground">Migrate X/Twitter verification and token approval flow from GoodBags</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">9</span>
                    <div>
                      <p className="font-semibold">Public Impact Dashboard</p>
                      <p className="text-sm text-muted-foreground">Transparent view of all donations, top charities, and platform statistics</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">10</span>
                    <div>
                      <p className="font-semibold">Mobile Optimization & Launch</p>
                      <p className="text-sm text-muted-foreground">Ensure full mobile compatibility, buy buttons, and deploy to goodpump.live</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <section className="page-break-before">
            <h2 className="text-2xl font-bold mb-4 text-primary">Key Differences: GoodBags vs GoodPump</h2>
            
            <Card>
              <CardContent className="pt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Feature</th>
                      <th className="text-left py-2 pr-4">GoodBags (Bags.fm)</th>
                      <th className="text-left py-2">GoodPump (Pump.fun)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Token Creation Cost</td>
                      <td className="py-2 pr-4">~0.01 SOL</td>
                      <td className="py-2">0.02 SOL</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Trading Fee</td>
                      <td className="py-2 pr-4">1%</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Creator Fee Share</td>
                      <td className="py-2 pr-4">Custom (via SDK)</td>
                      <td className="py-2">0.30-0.95% (native)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Fee Wallets</td>
                      <td className="py-2 pr-4">1 wallet</td>
                      <td className="py-2">Up to 10 wallets</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Graduation</td>
                      <td className="py-2 pr-4">Raydium migration</td>
                      <td className="py-2">PumpSwap (free)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-medium">Market Reach</td>
                      <td className="py-2 pr-4">Bags.fm users</td>
                      <td className="py-2">Massive pump.fun audience</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Token Migration</td>
                      <td className="py-2 pr-4" colSpan={2}>Cannot migrate between platforms - different on-chain mechanisms</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">Recommended Charity Fee Split</h2>
            
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <p className="text-3xl font-bold text-secondary">75%</p>
                    <p className="text-sm text-muted-foreground">Charity</p>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <p className="text-3xl font-bold text-primary">20%</p>
                    <p className="text-sm text-muted-foreground">Token Creator</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-3xl font-bold text-accent-foreground">5%</p>
                    <p className="text-sm text-muted-foreground">Platform</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Based on pump.fun's 0.95% maximum creator fee, this split would allocate approximately 
                  0.71% to charity, 0.19% to creator, and 0.05% to platform per trade.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-primary">Next Steps</h2>
            
            <Card>
              <CardContent className="pt-6">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Secure goodpump.live domain</li>
                  <li>Apply for PumpPortal API access</li>
                  <li>Set up development environment with pump.fun devnet</li>
                  <li>Begin Task 1: API integration and testing</li>
                  <li>Parallel: Design GoodPump branding and UI mockups</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          <footer className="text-center border-t pt-8 mt-8 text-muted-foreground text-sm">
            <p>GoodPump Research Document</p>
            <p>Prepared for GoodBags Team</p>
            <p className="mt-2">goodpump.live | goodbags.app</p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
