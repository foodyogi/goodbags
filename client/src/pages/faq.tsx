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

const faqCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    questions: [
      {
        question: "What is GoodBags?",
        answer: "GoodBags is a platform that allows you to create Solana-based tokens (memecoins) with built-in charitable donations. Every trade of your token automatically generates donations to your chosen charity through our transparent fee system."
      },
      {
        question: "How do I get started?",
        answer: "To get started, you'll need a Solana wallet (like Phantom or Solflare) with some SOL for transaction fees. Connect your wallet, choose a verified charity you want to support, fill in your token details, and launch. Your token will be live on Solana within minutes."
      },
      {
        question: "Do I need to know how to code?",
        answer: "No! GoodBags handles all the technical blockchain work for you. You just need to choose your charity, provide a name, symbol, and optional image for your token, and we take care of the rest."
      },
      {
        question: "How much SOL do I need to launch a token?",
        answer: "You'll need approximately 0.05-0.1 SOL to cover the token creation costs and initial transaction fees. The exact amount depends on current Solana network conditions."
      }
    ]
  },
  {
    id: "fees-donations",
    title: "Fees & Donations",
    icon: Coins,
    questions: [
      {
        question: "What fees does GoodBags charge?",
        answer: "GoodBags applies a 1% trading royalty on all token trades. Of this 1%: 0.75% goes directly to your chosen charity, and 0.25% goes to FYI token buybacks to support platform sustainability. This is one of the lowest fee structures in the memecoin space."
      },
      {
        question: "How do charities receive donations?",
        answer: "Charities receive donations through their verified Solana wallet address or via X (Twitter) Tips if they have a verified handle. Donations are tracked on-chain and can be verified by anyone on Solscan."
      },
      {
        question: "When do charities get their donations?",
        answer: "Donations accumulate from trading activity and are available to charities based on their verification status. Charities with verified wallet addresses receive SOL directly. Those using X Tips receive payments when they claim them from their X account."
      },
      {
        question: "Can I see where the donations go?",
        answer: "Yes! All donations are tracked on the Solana blockchain. You can view donation history for any token on its detail page, and click through to Solscan to verify transactions independently."
      }
    ]
  },
  {
    id: "charities",
    title: "Charities",
    icon: Heart,
    questions: [
      {
        question: "How are charities verified?",
        answer: "Charities go through a 3-step verification process: (1) Email verification, (2) Wallet signature verification, and (3) Manual review by our team. We also integrate with Every.org to verify nonprofit status for US-based charities."
      },
      {
        question: "Can I launch a token for any charity?",
        answer: "You can only launch tokens for charities that are in our verified list. This ensures donations reach legitimate organizations. If your preferred charity isn't listed, you can suggest they apply for verification."
      },
      {
        question: "I represent a charity. How do I get verified?",
        answer: "Visit our 'Register Your Charity' page and complete the application process. You'll need to provide your organization's details, verify your email, and sign with a Solana wallet. Our team reviews all applications to ensure legitimacy."
      },
      {
        question: "What types of charities are supported?",
        answer: "We support charities across many categories including hunger relief, environmental causes, education, health, animal welfare, disaster relief, and more. All charities must be legitimate nonprofit organizations."
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
        answer: "After creation, your token is live on the Solana blockchain. It can be traded by anyone, and every trade generates donations automatically. You can track your token's performance and impact on your dashboard."
      },
      {
        question: "Can I update my token after launching?",
        answer: "Token details like name and symbol are immutable once created on the blockchain. However, tokens can accumulate trading history and donation statistics over time, which are displayed on the platform."
      }
    ]
  },
  {
    id: "security",
    title: "Security & Trust",
    icon: Shield,
    questions: [
      {
        question: "Is GoodBags safe to use?",
        answer: "Yes. We use server-side wallet lookups for charities (preventing fund diversion), implement multi-step charity verification, and all transactions are recorded on the Solana blockchain for transparency. We never have access to your wallet's private keys."
      },
      {
        question: "How do I know donations are real?",
        answer: "Every donation is recorded on the Solana blockchain and can be verified on Solscan. We provide direct links to transaction records so you can independently verify all charitable contributions."
      },
      {
        question: "What if I lose access to my wallet?",
        answer: "Your wallet security is your responsibility. We never have access to your private keys. If you lose access to your wallet, you'll lose access to any tokens or funds in it. Always backup your seed phrase securely."
      },
      {
        question: "Is my personal information protected?",
        answer: "We collect minimal personal information. Your wallet address is public on the blockchain, but we don't require email registration or other personal details to use the platform. See our Privacy Policy for full details."
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
        answer: "FYI is the GoodBags platform token. A portion of platform fees (0.25% of trades) automatically buys FYI tokens, creating constant buy pressure and supporting platform sustainability."
      },
      {
        question: "How does the buyback work?",
        answer: "The buyback system runs automatically. When accumulated fees reach the threshold (0.015 SOL), the system swaps SOL for FYI tokens via Jupiter. All buybacks are visible on our Buyback Dashboard with links to verify on Solscan."
      },
      {
        question: "Can I buy FYI tokens?",
        answer: "FYI tokens can be traded on Solana DEXs. Check our Buyback Dashboard for the token mint address and trading information."
      }
    ]
  }
];

export default function FAQPage() {
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
            Find answers to the most common questions about GoodBags, token creation, 
            charitable donations, and our platform.
          </p>
        </div>

        <div className="space-y-8">
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
            Launch your impact token today and start generating donations for your chosen cause.
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
