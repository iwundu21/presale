
"use client";
import { Button } from "@/components/ui/button";
import { Bot, BrainCircuit, Rocket, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

type LandingPageProps = {
  onConnect: () => void;
  isConnecting: boolean;
};

export function LandingPage({ onConnect, isConnecting }: LandingPageProps) {
    const { wallet } = useWallet();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="container mx-auto text-center py-20 lg:py-32">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
          Welcome to the Future of <span className="text-primary">Exnus</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Exnus is not just a token; it's a revolution in decentralized intelligence. We're building a new ecosystem where your ideas have value and your data remains your own.
        </p>
        {isClient && (
            <Button size="lg" onClick={onConnect} disabled={isConnecting || !!wallet}>
                {isConnecting ? "Entering Ecosystem..." : "Enter the Ecosystem"}
              <ArrowRight className="ml-2 h-5 w-5"/>
            </Button>
        )}
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
