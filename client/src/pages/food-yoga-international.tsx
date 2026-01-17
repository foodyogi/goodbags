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
  HandHeart
} from "lucide-react";

const PARTNER_WALLET = "3psK7Pga1yoEhiMVdEjHrpNvEZiLvHwytrntFqRwwsUr";

export default function FoodYogaInternational() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <Badge className="mb-4 bg-white/20 text-white border-white/30" data-testid="badge-partner">
                <Award className="h-3 w-3 mr-1" />
                GoodBags Partner Charity
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="heading-fyi">
                Food Yoga International
              </h1>
              <p className="text-xl text-white/90 mb-2">
                Formerly Food For Life Global
              </p>
              <p className="text-lg text-white/80 mb-6 max-w-2xl">
                The world's largest plant-based food relief organization, serving over 1 million free meals daily across 65+ countries.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <a href="https://ffl.org" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-green-900 hover:bg-white/90" data-testid="button-visit-ffl">
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
                  <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" data-testid="button-verify-wallet">
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Wallet on Solscan
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold mb-2">8B+</div>
                <div className="text-white/80">Meals Served</div>
                <div className="text-sm text-white/60 mt-1">Since 1974</div>
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

        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20" data-testid="section-partnership">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <HandHeart className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">GoodBags Partnership</h3>
                <p className="text-muted-foreground mb-4">
                  Food Yoga International is a founding partner and verified charity on GoodBags. 
                  Token creators can select FYI to receive 0.75% of all trading royalties from their tokens.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="outline" className="bg-background">
                    <Target className="h-3 w-3 mr-1" />
                    Founding Partner
                  </Badge>
                  <Badge variant="outline" className="bg-background">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Charity
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
