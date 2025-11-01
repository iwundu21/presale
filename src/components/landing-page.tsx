
"use client";
import { Button } from "@/components/ui/button";
import { Bot, BrainCircuit, Rocket, ArrowRight, Info } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { PresaleCountdown } from "./presale-countdown";
import type { PresaleInfo } from "@/services/presale-info-service";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";


type LandingPageProps = {
  presaleEndDate: Date;
  presaleInfo: PresaleInfo;
  isPresaleActive: boolean;
};

const LISTING_PRICE = 0.12;

export function LandingPage({ presaleEndDate, presaleInfo, isPresaleActive }: LandingPageProps) {
    const { wallet, connected, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
        document.title = "Exnus Presale";
    }, []);

    const handleConnect = () => {
        setVisible(true);
    };

    useEffect(() => {
        if (connected && !connecting) {
            router.push('/dashboard');
        }
    }, [connected, connecting, router]);

  return (
    <main className="flex-grow flex flex-col">
      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center container mx-auto text-center py-20 lg:py-24 landing-hero">
        <div className="space-y-8">
            <div>
                 <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-4">
                    <p className="text-md text-foreground/80">
                        Price: <span className="font-bold text-primary">${presaleInfo.tokenPrice}</span>
                    </p>
                    <p className="text-md text-foreground/80">
                        Expected Listing Price: <span className="font-bold text-green-400">${LISTING_PRICE}</span>
                    </p>
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
            
            {isPresaleActive && <PresaleCountdown presaleEndDate={presaleEndDate} seasonName={presaleInfo.seasonName} />}
            
            {isClient && (
                <Button size="lg" onClick={handleConnect} disabled={connecting || !!wallet || !isPresaleActive} className="mt-8">
                    {connecting ? "Entering Ecosystem..." : "Enter the Ecosystem"}
                  <ArrowRight className="ml-2 h-5 w-5"/>
                </Button>
            )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-20 lg:py-24">
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
      
      {/* Video section */}
      <section className="py-20">
        <div className="container mx-auto">
          <video 
              src="/bum.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline
              className="rounded-lg shadow-2xl mx-auto w-full max-w-[1200px]"
          >
              Your browser does not support the video tag.
          </video>
        </div>
      </section>

    </main>
  );
}
