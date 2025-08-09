
"use client";
import { Button } from "@/components/ui/button";
import { Bot, BrainCircuit, Rocket, ArrowRight, BadgePercent, Info, ChevronsRight } from "lucide-react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { PresaleCountdown } from "./presale-countdown";
import type { PresaleInfo } from "@/services/presale-info-service";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type LandingPageProps = {
  onConnect: () => void;
  isConnecting: boolean;
  presaleEndDate: Date;
  presaleInfo: PresaleInfo;
  isPresaleActive: boolean;
};

const SEASON_PRICES: { [key: string]: number } = {
    "Early Stage": 0.09,
    "Investors": 0.15,
    "Whale": 0.25,
};
const SEASON_ORDER = Object.keys(SEASON_PRICES);

export function LandingPage({ onConnect, isConnecting, presaleEndDate, presaleInfo, isPresaleActive }: LandingPageProps) {
    const { wallet } = useWallet();
    const [isClient, setIsClient] = useState(false);
    const [nextSeason, setNextSeason] = useState<{ name: string; price: number } | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
      const currentSeasonIndex = SEASON_ORDER.indexOf(presaleInfo.seasonName);
      if (currentSeasonIndex !== -1 && currentSeasonIndex < SEASON_ORDER.length - 1) {
        const nextSeasonName = SEASON_ORDER[currentSeasonIndex + 1];
        setNextSeason({
          name: nextSeasonName,
          price: SEASON_PRICES[nextSeasonName]
        });
      } else {
        setNextSeason(null); // It's the last season or not found
      }
    }, [presaleInfo.seasonName]);

  return (
    <main className="flex-grow flex flex-col">
      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center container mx-auto text-center py-20 lg:py-24 landing-hero">
        <div className="space-y-8">
            <div>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-4">
                   <Badge variant="secondary" className="text-sm py-1 px-3 border border-border">
                      <BadgePercent className="h-4 w-4 mr-2 text-primary" />
                      {presaleInfo.seasonName}
                   </Badge>
                    <p className="text-md text-foreground/80">
                        Current Price: <span className="font-bold text-primary">${presaleInfo.tokenPrice.toFixed(2)}</span>
                    </p>
                    {nextSeason && (
                       <div className="flex items-center gap-2 text-sm text-foreground/80">
                           <ChevronsRight className="h-4 w-4 text-primary/70" />
                           Next: <span className="font-semibold text-white/90">{nextSeason.name} at ${nextSeason.price.toFixed(2)}</span>
                       </div>
                    )}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                  Welcome to the Future of <span className="text-primary">Exnus</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                  Exnus is not just a token; it's a revolution in decentralized intelligence. We're building a new ecosystem where your ideas have value and your data remains your own.
                </p>
            </div>
    
            {!isPresaleActive && (
              <Alert variant="destructive" className="max-w-xl mx-auto text-left border-destructive/50 bg-destructive/10">
                <Info className="h-5 w-5" />
                <AlertTitle className="font-bold">Presale Currently Closed</AlertTitle>
                <AlertDescription>
                  Thank you for your interest. The presale is not active at this time. Details on when token claiming will begin will be announced here on our official website. Please follow our social channels for further announcements.
                </AlertDescription>
              </Alert>
            )}
            
            {isPresaleActive && <PresaleCountdown presaleEndDate={presaleEndDate} />}
            
            {isClient && (
                <Button size="lg" onClick={onConnect} disabled={isConnecting || !!wallet || !isPresaleActive}>
                    {isConnecting ? "Entering Ecosystem..." : "Enter the Ecosystem"}
                  <ArrowRight className="ml-2 h-5 w-5"/>
                </Button>
            )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card py-20 lg:py-24">
          <div className="container mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white">Why Exnus?</h2>
                  <p className="text-muted-foreground mt-2">Join us on a journey to redefine digital interaction.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="p-6">
                      <div className="flex justify-center mb-4">
                          <div className="p-4 bg-primary/20 rounded-full">
                            <Bot className="h-10 w-10 text-primary"/>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">AI-Powered</h3>
                      <p className="text-muted-foreground">Leverage the power of cutting-edge AI models to bring your ideas to life. Exnus provides the fuel for a new generation of intelligent applications.</p>
                  </div>
                    <div className="p-6">
                      <div className="flex justify-center mb-4">
                          <div className="p-4 bg-primary/20 rounded-full">
                            <BrainCircuit className="h-10 w-10 text-primary"/>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">Decentralized Core</h3>
                      <p className="text-muted-foreground">Built on a secure and transparent blockchain, ensuring that you are always in control. No central authorities, no hidden agendas.</p>
                  </div>
                    <div className="p-6">
                      <div className="flex justify-center mb-4">
                          <div className="p-4 bg-primary/20 rounded-full">
                            <Rocket className="h-10 w-10 text-primary"/>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">Community Driven</h3>
                      <p className="text-muted-foreground">Exnus is more than a project; it's a community. Your participation shapes the future of the ecosystem. Together, we build, we innovate, we succeed.</p>
                  </div>
              </div>
          </div>
      </section>
      
      {/* Image section */}
      <section className="py-20">
            <div className="container mx-auto">
                <Image src="https://placehold.co/1200x500.png" alt="Exnus Vision" width={1200} height={500} className="rounded-lg shadow-2xl mx-auto" data-ai-hint="futuristic digital landscape" />
            </div>
      </section>

    </main>
  );
}
