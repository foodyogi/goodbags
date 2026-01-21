import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Heart, 
  Globe, 
  Users, 
  Leaf, 
  Utensils,
  GraduationCap,
  TreePine,
  Shield,
  Target,
  Award,
  HandHeart,
  CheckCircle2,
  Wallet,
  Copy,
  Mail,
  Info
} from "lucide-react";
import fyiLogo from "@assets/FYIlogo250x250_1768951459327.png";
import fyiHeroImage from "@assets/IMG_1071_1768954416987.jpeg";

const PARTNER_WALLET = "3psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr";

export default function FoodYogaInternational() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fyiHeroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <Badge className="mb-4 bg-amber-500/80 text-white border-amber-400/50" data-testid="badge-partner">
                <Award className="h-3 w-3 mr-1" />
                GoodBags Partner Charity
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg" data-testid="heading-fyi">
                Food Yoga International
              </h1>
              <p className="text-xl text-white/90 mb-2 drop-shadow-md">
                Formerly Food For Life Global
              </p>
              <p className="text-lg text-white/90 mb-6 max-w-2xl drop-shadow-md">
                The world's largest plant-based food relief organization, serving over 1 million free meals daily across 65+ countries.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a href="https://ffl.org" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-600 border-amber-400" data-testid="button-visit-ffl">
                    <Globe className="h-4 w-4 mr-2" />
                    Visit FFL.org
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <a 
                  href={`https://solscan.io/account/${PARTNER_WALLET}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 backdrop-blur-sm" data-testid="button-verify-wallet">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Wallet on Solscan
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 text-center border border-white/10">
                <div className="text-5xl font-bold mb-2 text-amber-400">8B+</div>
                <div className="text-white/90">Meals Served</div>
                <div className="text-sm text-white/70 mt-1">Since 1974</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="grid gap-6 md:grid-cols-4 mb-12" data-testid="section-stats">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-1">1M+</div>
              <div className="text-sm text-muted-foreground">Daily Meals</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-1">65+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-1">250+</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Plant-Based</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Mission</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg text-muted-foreground">
                To address the root cause of hunger and social issues through teaching the equality of all life 
                by the liberal distribution of pure plant-based meals prepared with loving intention.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12" data-testid="section-programs">
          <h2 className="text-2xl font-bold mb-6">Programs & Activities</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Utensils className="h-5 w-5 text-green-600" />
                  Daily Feeding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>School lunch programs (1.3M+ daily in India)</li>
                  <li>Mobile food vans for homeless outreach</li>
                  <li>Budget restaurants</li>
                  <li>Emergency shelters</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Disaster Relief
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>COVID-19 pandemic relief worldwide</li>
                  <li>Hurricane and earthquake response</li>
                  <li>Coordinated emergency vegan relief</li>
                  <li>Rapid deployment teams</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>School meal programs encourage attendance</li>
                  <li>Plant-based nutrition education</li>
                  <li>Volunteer training and development</li>
                  <li>Food Yoga philosophy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TreePine className="h-5 w-5 text-green-600" />
                  Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Trees for Life program</li>
                  <li>Eco-farming initiatives</li>
                  <li>Sustainable food practices</li>
                  <li>Environmental education</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Leaf className="h-5 w-5 text-emerald-500" />
                  Animal Welfare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Animal rescue programs</li>
                  <li>Reducing animal slaughter through vegan meals</li>
                  <li>"Karma-free" food philosophy</li>
                  <li>Non-violence advocacy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Cultural festival feeding</li>
                  <li>College feeding programs</li>
                  <li>Healthcare services</li>
                  <li>Spiritual hospitality</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-12" data-testid="section-values">
          <h2 className="text-2xl font-bold mb-6">Core Values</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Welfare", desc: "Provide plant-based meals to anyone disadvantaged or in need" },
              { title: "Hospitality", desc: "Revive the ancient culture of spiritual hospitality" },
              { title: "Non-Violence", desc: "Reduce animal suffering through plant-based alternatives" },
              { title: "Health", desc: "Teach the value of plant-based meals for wellbeing" },
              { title: "Education", desc: "Teach food yoga as a path to spiritual development" },
              { title: "Non-Discrimination", desc: "Serve all regardless of race, creed, color, or religion" },
            ].map((value) => (
              <Card key={value.title} className="bg-muted/30">
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Financial Transparency</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Food Yoga International is 100% voluntarily funded. Here's how every dollar is used:
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">70%</div>
                  <div className="text-sm text-muted-foreground">Direct Food Relief</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">10%</div>
                  <div className="text-sm text-muted-foreground">Operations & Training</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">20%</div>
                  <div className="text-sm text-muted-foreground">Fundraising</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12" data-testid="section-wallet">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" />
            Official Solana Wallet
          </h2>
          <Card className="border-amber-500/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Food Yoga International Donation Wallet</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <code className="flex-1 bg-muted px-4 py-3 rounded-lg font-mono text-sm break-all">
                      {PARTNER_WALLET}
                    </code>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(PARTNER_WALLET);
                        }}
                        data-testid="button-copy-wallet"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <a 
                        href={`https://solscan.io/account/${PARTNER_WALLET}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" data-testid="button-view-solscan">
                          View on Solscan
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Verified Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      This wallet address has been verified as the official Food Yoga International donation wallet. 
                      All GoodBags token royalties are sent directly to this address.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-2">Want to Label This Wallet on Solscan?</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Solscan can add an official label like "Food Yoga International" to this wallet address, 
                        making it easily recognizable to anyone viewing transactions. To request a label:
                      </p>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-3">
                        <li>Visit <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Solscan.io</a></li>
                        <li>Click on "Feedback" or contact them via their support channels</li>
                        <li>Request an account label for your organization's wallet</li>
                        <li>Provide verification of wallet ownership (sign a message from the wallet)</li>
                      </ol>
                      <a 
                        href="mailto:contact@solscan.io?subject=Account%20Label%20Request%20-%20Food%20Yoga%20International&body=Hello%20Solscan%20Team%2C%0A%0AI%20would%20like%20to%20request%20an%20account%20label%20for%20the%20following%20wallet%3A%0A%0AWallet%20Address%3A%203psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr%0AOrganization%3A%20Food%20Yoga%20International%0AWebsite%3A%20https%3A%2F%2Fffl.org%0A%0APlease%20let%20me%20know%20what%20verification%20is%20required.%0A%0AThank%20you!"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" data-testid="button-contact-solscan">
                          <Mail className="h-4 w-4 mr-2" />
                          Draft Email to Solscan
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20" data-testid="section-partnership">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <img 
                  src={fyiLogo} 
                  alt="Food Yoga International Logo" 
                  className="h-32 w-32 object-contain"
                  data-testid="img-fyi-logo"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-center lg:text-left">GoodBags Partnership</h3>
                <p className="text-muted-foreground mb-4">
                  Food Yoga International (formerly Food For Life Global) is a <strong>founding partner</strong> and verified charity on GoodBags. 
                  As one of the world's largest plant-based food relief organizations, FYI has been serving humanity since 1974, 
                  distributing over 8 billion free meals across 65+ countries.
                </p>
                
                <div className="mb-4 space-y-2">
                  <h4 className="font-semibold text-sm">How GoodBags Supports FYI:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Token creators can select FYI to receive <strong>0.75%</strong> of all trading royalties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Donations are sent directly to FYI's verified Solana wallet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>100% transparent and verifiable on-chain through Solscan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Every SOL donated helps provide plant-based meals to those in need</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                  <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30">
                    <Target className="h-3 w-3 mr-1" />
                    Founding Partner
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Charity
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30">
                    <Wallet className="h-3 w-3 mr-1" />
                    Solana Wallet Active
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <a 
                    href={`https://solscan.io/account/${PARTNER_WALLET}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" data-testid="button-verify-partnership">
                      Verify on Solscan
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                  <a href="https://ffl.org" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" data-testid="button-fyi-website">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit FFL.org
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
