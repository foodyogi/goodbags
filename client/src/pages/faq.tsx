import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Rocket, 
  Heart, 
  Coins, 
  Shield, 
  Wallet,
  TrendingUp,
  Building2,
  ArrowRight
} from "lucide-react";
import { ThemedLogo } from "@/components/themed-logo";
import { buildFaqJsonLd, jsonLdScriptContent } from "@/lib/faq-jsonld";
import {
  NEW_LAUNCH_MAX_CHARITY_PERCENT,
  NEW_LAUNCH_MIN_CHARITY_PERCENT,
  NEW_LAUNCH_SPLITS,
  formatPercent,
} from "@shared/feeSplit";

const BUYBACK_PERCENT = formatPercent(NEW_LAUNCH_SPLITS[0].buybackPercent);
const CREATOR_MAX = formatPercent(NEW_LAUNCH_SPLITS[0].creatorPercent);
const CREATOR_MIN = formatPercent(NEW_LAUNCH_SPLITS[NEW_LAUNCH_SPLITS.length - 1].creatorPercent);

const faqCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    questions: [
      {
        question: "What is GoodBags?",
        answer: `GoodBags is charity fundraising infrastructure on Solana, built on Bags.fm. You launch a coin with a charity's share written into its on-chain fee split. On a new coin, at least ${NEW_LAUNCH_MIN_CHARITY_PERCENT}% of the coin's shared trading fees go to the charity, which claims them on-chain.`
      },
      {
        question: "How do I get started?",
        answer: "To get started, you'll need a Solana wallet (like Phantom or Solflare) with some SOL for transaction fees. Connect your wallet, choose an onboarded charity you want to support, fill in your token details, and launch. Your token will be live on Solana within minutes."
      },
      {
        question: "Do I need to know how to code?",
        answer: "No! GoodBags handles all the technical blockchain work for you. You just need to choose your charity, provide a name, symbol, and optional image for your token, and we take care of the rest."
      },
      {
        question: "How much SOL do I need to launch a token?",
        answer: "You'll need approximately 0.05-0.1 SOL to cover the token creation costs and initial transaction fees. The exact amount depends on current Solana network conditions."
      },
      {
        question: "Can I try a launch without spending SOL?",
        answer: "Yes. Turn on \"Test launch\" in the launch form. GoodBags checks your coin details, charity and donation choice and shows the fee split your coin would get, without logging in, connecting a wallet, signing anything or spending SOL. Nothing is created on-chain and the test isn't saved or shown anywhere on the site."
      },
      {
        question: "Can AI Agents launch coins?",
        answer: "Yes. Bags supports agentic authentication flows. Creators can use AI Agents to launch coins and claim fees (where applicable). Impact settings are stored at launch and enforced on-chain. GoodBags works seamlessly with agent-assisted launches."
      }
    ]
  },
  {
    id: "fees-donations",
    title: "Fees & Charity Share",
    icon: Coins,
    questions: [
      {
        question: "What is the fee split?",
        answer: `On a new coin, Bags.fm pays 25% of the coin's shared trading fees to the wallet that deploys it, which on GoodBags is the creator. The GoodBags split covers the other 75%. The effective split is: at least ${NEW_LAUNCH_MIN_CHARITY_PERCENT}% to the charity (up to ${NEW_LAUNCH_MAX_CHARITY_PERCENT}% if the creator donates their full share), ${BUYBACK_PERCENT} reserved for FYI token buybacks, and ${CREATOR_MAX} down to ${CREATOR_MIN} to the creator, including the deployer share. The split is written into the coin's on-chain fee config at launch.`
      },
      {
        question: "Why do coins launched before September 2026 show a different split?",
        answer: `In September 2026 Bags.fm started paying 25% of a coin's shared fees to the wallet that deploys it, for newly created fee configs. Coins launched before that, such as LEMONAID and CHDOGE, keep their original split of 75% charity, 5% buyback and 20% creator, with no deployer share. New coins get the effective split shown in the launch form, with at least ${NEW_LAUNCH_MIN_CHARITY_PERCENT}% to the charity. Each coin's page shows its own split.`,
      },
      {
        question: "How do charities receive their share?",
        answer: "The charity's share builds up in the coin's Bags.fm fee config. The charity claims it on Bags.fm, either with its verified Solana wallet or with its X account, which Bags.fm links to a wallet. Every claim is an on-chain transaction anyone can check on Solscan."
      },
      {
        question: "When do charities get their share?",
        answer: "Whenever they choose to claim. The charity's share keeps building up in the coin's fee config until the charity claims it on Bags.fm."
      },
      {
        question: "Can I see what charities have claimed?",
        answer: "Yes. Each coin's page shows its on-chain fee config and lists the charity's verified on-chain fee claims, each with a Solscan link."
      }
    ]
  },
  {
    id: "charities",
    title: "Charities",
    icon: Heart,
    questions: [
      {
        question: "How do charities onboard?",
        answer: "Self-serve registration is for US nonprofits. The charity enters its EIN, which we check against Every.org, verifies its email, signs with its Solana wallet or connects its X account, and then our team reviews the application. The charity directory also lists nonprofits from public records. They have not joined GoodBags or endorsed it, and a coin can't be launched for them until they complete onboarding."
      },
      {
        question: "Can I launch a token for any charity?",
        answer: "You can launch coins only for charities that have completed onboarding, or for nonprofits with a Solana wallet found through our charity search. If your preferred charity hasn't onboarded and is a US nonprofit, invite it to register."
      },
      {
        question: "I represent a charity. How do we onboard?",
        answer: "Visit our 'Register Your Charity' page. Registration currently supports US nonprofits: you'll enter your EIN (checked against Every.org), verify your email, then sign with your Solana wallet or connect your X account. Our team reviews every application."
      },
      {
        question: "What types of charities are supported?",
        answer: "We support charities across many categories including hunger relief, environmental causes, education, health, animal welfare, disaster relief, and more. All charities must be legitimate nonprofit organizations."
      },
      {
        question: "Can charities approve or deny tokens launched in their name?",
        answer: "Yes. When a coin is launched for a charity, the charity can review it and endorse or deny it through our Charity Approval Portal. Charities verify their identity by signing in with their official X account. Approval doesn't stop a coin from trading, but only endorsed coins show the endorsement badge."
      },
      {
        question: "How does the Charity Approval Portal work?",
        answer: "When a coin is launched, the charity receives a notification by email or X with a link to the Charity Approval Portal for that coin. The charity opens the link, signs in with its official X account, reviews the coin, and endorses or denies it. The X-verified portal is the only way a charity can approve or deny a coin. Endorsed coins display an endorsement badge, while denied coins are marked as not endorsed."
      },
      {
        question: "What if a charity doesn't respond to an approval request?",
        answer: "Tokens remain in 'pending' status until the charity responds. The token is still tradeable, but won't display an endorsement badge. Token creators can reach out to charities via X using the pre-written message template we provide on the token detail page."
      }
    ]
  },
  {
    id: "tokens-trading",
    title: "Tokens & Trading",
    icon: TrendingUp,
    questions: [
      {
        question: "Where can I trade tokens created on GoodBags?",
        answer: "Tokens are launched on Bags.fm, a Solana-based trading platform. Once live, they can be traded by anyone with a Solana wallet. Links to trade each token are available on the token detail pages."
      },
      {
        question: "Can I create multiple tokens?",
        answer: "Yes, you can create as many tokens as you'd like. Each token can support a different charity, allowing you to create a portfolio of impact tokens."
      },
      {
        question: "What happens to my token after I create it?",
        answer: "After creation, your coin is live on the Solana blockchain. Anyone can trade it, and every trade adds to the coin's shared fees, so the charity's share keeps building up for it to claim. You can track your coin's charity share and fee claims on your dashboard."
      },
      {
        question: "Can I update my token after launching?",
        answer: "Token details like name and symbol are immutable once created on the blockchain. Over time a coin builds up charity share and fee claim history, which is displayed on the platform."
      }
    ]
  },
  {
    id: "security",
    title: "Security & Trust",
    icon: Shield,
    questions: [
      {
        question: "Do you custody funds?",
        answer: "No. GoodBags does not custody funds. Users control their own wallets and permissions. Fees are split by each coin's on-chain fee config and claimed through Bags.fm. We never have access to your private keys or the ability to move your funds."
      },
      {
        question: "Is GoodBags safe to use?",
        answer: "Yes. We use server-side wallet lookups for charities (preventing fund diversion), implement multi-step charity verification, and all transactions are recorded on the Solana blockchain for transparency. Fee settings are stored at launch and enforced on-chain."
      },
      {
        question: "How do I know the charity figures are real?",
        answer: "Every charity fee claim is an on-chain transaction, and we link each one to Solscan. Each coin's fee split is in its on-chain fee config, also linked from the coin's page."
      },
      {
        question: "What if I lose access to my wallet?",
        answer: "Your wallet security is your responsibility. We never have access to your private keys. If you lose access to your wallet, you'll lose access to any tokens or funds in it. Always backup your seed phrase securely."
      },
      {
        question: "Is my personal information protected?",
        answer: "We collect minimal personal information. Your wallet address is public on the blockchain, but we don't require email registration or other personal details to use the platform. See our Privacy Policy for full details."
      },
      {
        question: "How does charity approval work?",
        answer: "Charities must verify their identity via X OAuth to approve coins. Only charity representatives with matching X handles can endorse or deny a coin, so no one can falsely claim a charity's endorsement. Coins without approval can still trade, but show no endorsement badge."
      }
    ]
  },
  {
    id: "fyi-token",
    title: "FYI Token & Buyback",
    icon: Building2,
    questions: [
      {
        question: "What is the FYI token?",
        answer: `FYI is Food Yoga International's token on Bags.fm. On new coins, ${BUYBACK_PERCENT} of shared trading fees is reserved for FYI token buybacks. None have been executed yet.`
      },
      {
        question: "How does the buyback work?",
        answer: "GoodBags has a buyback service that swaps SOL held in the buyback wallet for FYI through Jupiter once the wallet holds at least 0.015 SOL. The buyback share has not yet been claimed from the coins' fee configs, so the wallet is empty and no buybacks have been executed."
      },
      {
        question: "Can I buy FYI tokens?",
        answer: "FYI tokens can be traded on Bags.fm and Solana DEXs. The Buyback page shows the token's mint address."
      }
    ]
  }
];

export default function FAQPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ThemedLogo className="h-28 w-28 md:h-40 md:w-40 rounded-2xl object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4" data-testid="badge-faq">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">FAQ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-faq">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to the most common questions about GoodBags, launching a charity coin,
            how charities are paid, and our platform.
          </p>
        </div>

        <div className="space-y-8">
          {/* FAQPage structured data, generated from the same questions and answers rendered below */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(buildFaqJsonLd(faqCategories)) }}
          />
          {faqCategories.map(({ id, title, icon: Icon, questions }) => (
            <Card key={id} data-testid={`faq-category-${id}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{title}</h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {questions.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${id}-${index}`}
                      data-testid={`faq-item-${id}-${index}`}
                    >
                      <AccordionTrigger className="text-left hover:no-underline" data-testid={`button-faq-trigger-${id}-${index}`}>
                        <span className="font-medium" data-testid={`text-faq-question-${id}-${index}`}>{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground" data-testid={`text-faq-answer-${id}-${index}`}>{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" data-testid="section-still-have-questions">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/help">
                <Button variant="outline" data-testid="button-visit-help-center">
                  Visit Help Center
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <a href="mailto:contact@master22solutions.com">
                <Button data-testid="button-contact-support">
                  Contact Support
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <section className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Launch a charity coin today and its fee split starts earning for your chosen cause.
          </p>
          <Link href="/launch">
            <Button size="lg" className="gap-2" data-testid="button-launch-cta">
              <Rocket className="h-5 w-5" />
              Launch Your Token
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
