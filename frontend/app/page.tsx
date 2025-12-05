'use client';

import { DotScreenShader } from "@/src/components/ui/dot-shader-background";
import { Header } from "@/src/components/ui/header-2";
import { HeroPill } from "@/src/components/ui/hero-pill";
import { AI_Prompt } from "@/src/components/ui/animated-ai-input";
import { LogoCarousel, allLogos } from "@/src/components/ui/logo-carousel";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { GridFeatureCards } from "@/src/components/ui/grid-feature-cards";
import { InteractiveImageAccordion } from "@/src/components/ui/interactive-image-accordion";
import { PricingSection } from "@/src/components/ui/pricing-section";
import { FAQSection } from "@/src/components/ui/faq-tabs";
import StickyFooter from "@/src/components/ui/footer";
import { AuthModal } from "@/src/components/ui/auth-modal";
import React from "react";

export default function Home() {
  const [authOpen, setAuthOpen] = React.useState(false);
  
  return (
    <div className="min-h-screen w-full flex flex-col relative bg-white overflow-x-hidden">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="w-full max-w-5xl mx-auto px-4 pt-20 pb-20 flex flex-col items-center">
          {/* Hero Section with Shader */}
          <section className="relative w-full flex flex-col items-center min-h-[80vh] justify-center mb-32">
            <div className="absolute inset-0 -mx-[50vw] left-1/2 w-screen h-[120%] -top-32 pointer-events-none">
              <DotScreenShader />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6 mb-12 w-full">
              <HeroPill
                href="#"
                label="Powered by Nano Banana Pro 🍌"
                announcement="✨ New AI styles"
                className="bg-[#0f7d70]/10 ring-[#0f7d70]/20 [&_div]:bg-[#0f7d70]/10 [&_div]:text-[#0f7d70] [&_div]:text-[#0f7d70] [&_svg_path]:fill-[#0f7d70]"
              />
              <h1 className="text-5xl md:text-7xl font-light tracking-tight mix-blend-exclusion whitespace-nowrap pointer-events-none font-silver text-center" style={{ color: '#0f7d70' }}>
                MugShot Studio
              </h1>
              <p className="text-lg md:text-xl font-light text-center text-black mix-blend-exclusion max-w-2xl leading-relaxed pointer-events-none">
                Transform your photos into high-definition, AI-crafted Thumbnails in seconds.
              </p>
            </div>

            <div className="relative z-10 w-full flex justify-center">
              <div className="md:hidden w-full flex justify-center">
                <button
                  className="px-6 py-3 rounded-lg"
                  style={{ backgroundColor: '#0f7d70', color: 'white' }}
                  onClick={() => setAuthOpen(true)}
                >
                  Get Started
                </button>
              </div>
              <div className="hidden md:block w-full max-w-2xl mx-auto">
                <AI_Prompt />
              </div>
            </div>
          </section>

          <div className="w-full space-y-8 z-10">
            <div className="text-center space-y-4">
              <GradientHeading variant="black" size="sm" weight="base">
                Powered by leading AI models
              </GradientHeading>
            </div>
            <div className="flex justify-center">
              <LogoCarousel columnCount={4} logos={allLogos} />
            </div>
          </div>

          <div className="w-full mt-24 z-10">
            <div className="text-center mb-10">
              <h2 className="text-5xl md:text-8xl font-silver mb-4" style={{ color: '#022312' }}>
                How It Works
              </h2>
              <p className="text-lg mt-4" style={{ color: '#022312' }}>
                How we turn your prompts/images into high-quality Thumbnails.
              </p>
            </div>
            <GridFeatureCards />
          </div>
        </div>

        <div className="w-full mt-24 z-10">
          <InteractiveImageAccordion />
        </div>

        <div className="w-full z-10">
          <PricingSection />
        </div>

        <div className="w-full z-10">
          <FAQSection />
        </div>
        <StickyFooter />
      </main>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}