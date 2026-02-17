'use client';

import Image from "next/image";
import backgroundImg from "./assets/background.webp";
import CardNav from "@/src/components/ui/card-nav";
import { HeroPill } from "@/src/components/ui/hero-pill";
import { AI_Prompt } from "@/src/components/ui/animated-ai-input";
import StickyFooter from "@/src/components/ui/footer";
import { StatsBar, BentoFeatures } from "@/src/components/ui/bento-features";
import { HowItWorks, GalleryShowcase, LandingPricing, FAQSection, FinalCTABanner } from "@/src/components/ui/landing-sections";

export default function Home() {

  const navItems = [
    {
      label: "Product",
      bgColor: "#0f7d70",
      textColor: "#fff",
      links: [
        { label: "Download", ariaLabel: "Download", href: "/download" }
      ]
    },
    {
      label: "Resources",
      bgColor: "#022312",
      textColor: "#fff",
      links: [
        { label: "Blogspace", ariaLabel: "Blogspace", href: "/blogspace" },
        { label: "Community", ariaLabel: "Community", href: "/community" }
      ]
    },
    {
      label: "Company",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "About", ariaLabel: "About", href: "#" },
        { label: "Contact", ariaLabel: "Contact", href: "#" }
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-white overflow-x-hidden">
      <CardNav
        items={navItems}
        baseColor="#ffffff"
        menuColor="#000000"
        buttonBgColor="#0f7d70"
        buttonTextColor="#fff"
      />
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {/* Hero Section with Shader */}
        <section className="relative w-full flex flex-col items-center min-h-screen justify-center overflow-hidden">
          {/* New Hero Background Image - Full Width */}
          <div className="absolute inset-4 overflow-hidden rounded-[2.5rem] border border-white/50 pointer-events-none z-0">
            <Image
              src={backgroundImg}
              alt="Hero background"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay removed as per user request */}
          </div>


          <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-5xl px-4 pt-32">
            <HeroPill
              href="#"
              label="Powered by Nano Banana Pro 🍌"
              announcement="✨ New AI styles"
              className="bg-black/5 ring-black/10 text-black backdrop-blur-md [&_div]:bg-black/10 [&_div]:text-black [&_p]:text-black [&_svg_path]:text-black"
            />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0f7d70] font-sans text-center drop-shadow-sm">
              MugShot Studio
            </h1>
            <p className="text-lg md:text-xl font-light text-center text-gray-800 max-w-2xl leading-relaxed">
              Turn your photos into HD, AI-crafted Thumbnails in seconds.
            </p>

            <div className="relative z-10 w-full flex justify-center mt-8">
              <div className="md:hidden w-full flex justify-center">
                <button
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{ backgroundColor: '#0f7d70', color: 'white' }}
                  onClick={() => window.location.href = '/auth/signin'}
                >
                  Get Started
                </button>
              </div>
              <div className="hidden md:block w-full max-w-2xl mx-auto">
                <AI_Prompt />
              </div>
            </div>
          </div>
        </section>

        <StatsBar />
        <BentoFeatures />
        <HowItWorks />
        <GalleryShowcase />
        <LandingPricing />
        <FAQSection />
        <FinalCTABanner />

        <StickyFooter />
      </main>
    </div>
  );
}