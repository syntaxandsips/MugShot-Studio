'use client';

import Image from "next/image";
import backgroundImg from "./assets/background.webp";
import CardNav from "@/src/components/ui/card-nav";
import { HeroPill } from "@/src/components/ui/hero-pill";
import { AI_Prompt } from "@/src/components/ui/animated-ai-input";
import { Marquee } from "@/src/components/ui/marquee";
import { allLogos } from "@/src/components/ui/logo-carousel";
import RuixenSection from "@/src/components/ui/ruixen-feature-section";
import { PricingSection } from "@/src/components/ui/pricing";
import { FAQSection } from "@/src/components/ui/faq-tabs";
import StickyFooter from "@/src/components/ui/footer";
import { useState, useEffect } from "react";
import { billingApi, SubscriptionPlan } from "@/src/lib/api";
import { Plan } from "@/src/components/ui/pricing";

export default function Home() {

  const navItems = [
    {
      label: "Product",
      bgColor: "#0f7d70",
      textColor: "#fff",
      links: [
        { label: "Features", ariaLabel: "Features", href: "#" },
        { label: "Pricing", ariaLabel: "Pricing", href: "#pricing" },
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

  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiPlans = await billingApi.getPlans();
        if (apiPlans && apiPlans.length > 0) {
          const transformed = transformPlans(apiPlans);
          setPlans(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-white overflow-x-hidden">
      <CardNav
        items={navItems}
        baseColor="#000"
        menuColor="#fff"
        buttonBgColor="#0f7d70"
        buttonTextColor="#fff"
      />
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {/* Hero Section with Shader */}
        <section className="relative w-full flex flex-col items-center min-h-screen justify-center overflow-hidden">
          {/* New Hero Background Image - Full Width */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <Image
              src={backgroundImg}
              alt="Hero background"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>


          <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-5xl px-4 pt-32">
            <HeroPill
              href="#"
              label="Powered by Nano Banana Pro 🍌"
              announcement="✨ New AI styles"
              className="bg-white/10 ring-white/20 text-white backdrop-blur-md [&_div]:bg-white/10 [&_div]:text-white [&_svg_path]:fill-white"
            />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white font-sans text-center drop-shadow-md">
              MugShot Studio
            </h1>
            <p className="text-lg md:text-xl font-light text-center text-white/90 max-w-2xl leading-relaxed drop-shadow-sm">
              Transform your photos into high-definition, AI-crafted Thumbnails in seconds.
            </p>

            <div className="relative z-10 w-full flex justify-center mt-8">
              <div className="md:hidden w-full flex justify-center">
                <button
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{ backgroundColor: '#0f7d70', color: 'white' }}
                  onClick={() => window.location.href = '/login'}
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

        <div className="w-full max-w-5xl mx-auto px-4 pt-20 pb-20 flex flex-col items-center">
          <div className="w-full space-y-8 z-10">
            <div className="flex justify-center w-full">
              <Marquee pauseOnHover className="[--duration:20s]">
                {allLogos.map((logo) => (
                  <div key={logo.id} className="mx-8 flex items-center justify-center">
                    <logo.img className="h-24 w-auto opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0" />
                  </div>
                ))}
              </Marquee>
            </div>
          </div>

          <div className="w-full mt-24 z-10">
            <RuixenSection />
          </div>
        </div>

        <div className="w-full z-10">
          <PricingSection
            plans={plans}
            heading="Plans that Scale with You"
            description="Whether you're just starting out or growing fast, our flexible pricing has you covered — with no hidden costs."
            id="pricing"
          />
        </div>

        <div className="w-full z-10">
          <FAQSection />
        </div>
        <StickyFooter />
      </main>
    </div>
  );
}

function transformPlans(apiPlans: SubscriptionPlan[]): Plan[] {
  return apiPlans.map(plan => {
    // Assuming features is just a generic string array from API, we verify if it needs parsing or if it's already compatible
    return {
      id: plan.id,
      name: plan.name,
      info: getPlanInfo(plan.name) || plan.description,
      price: {
        monthly: plan.price_monthly,
        yearly: plan.price_yearly
      },
      features: plan.features.map(f => ({ text: f })),
      btn: {
        text: 'Get Started',
        href: `/login?plan=${plan.id}`
      },
      highlighted: plan.is_popular
    } as Plan;
  }).sort((a, b) => {
    // Optional: sort logic if needed, otherwise rely on API order
    const order = ['Basic', 'Pro', 'Business'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });
}

function getPlanInfo(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('basic') || lower.includes('starter')) return 'For most individuals';
  if (lower.includes('pro') || lower.includes('professional')) return 'For small businesses';
  if (lower.includes('business') || lower.includes('enterprise')) return 'For large organizations';
  return 'Flexible plan';
}

const DEFAULT_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    info: 'For most individuals',
    price: {
      monthly: 7,
      yearly: Math.round(7 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Up to 3 Blog posts', limit: '100 tags' },
      { text: 'Up to 3 Transcriptions' },
      { text: 'Up to 3 Posts stored' },
      {
        text: 'Markdown support',
        tooltip: 'Export content in Markdown format',
      },
      {
        text: 'Community support',
        tooltip: 'Get answers your questions on discord',
      },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 100 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Start Your Free Trial',
      href: '/login?plan=basic',
    },
  },
  {
    highlighted: true,
    id: 'pro',
    name: 'Pro',
    info: 'For small businesses',
    price: {
      monthly: 17.99,
      yearly: Math.round(17.99 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Up to 500 Blog Posts', limit: '500 tags' },
      { text: 'Up to 500 Transcriptions' },
      { text: 'Up to 500 Posts stored' },
      {
        text: 'Unlimited Markdown support',
        tooltip: 'Export content in Markdown format',
      },
      { text: 'SEO optimization tools' },
      { text: 'Priority support', tooltip: 'Get 24/7 chat support' },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 500 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Get started',
      href: '/login?plan=pro',
    },
  },
  {
    name: 'Business',
    info: 'For large organizations',
    price: {
      monthly: 69.99,
      yearly: Math.round(49.99 * 12 * (1 - 0.12)),
    },
    features: [
      { text: 'Unlimited Blog Posts' },
      { text: 'Unlimited Transcriptions' },
      { text: 'Unlimited Posts stored' },
      { text: 'Unlimited Markdown support' },
      {
        text: 'SEO optimization tools',
        tooltip: 'Advanced SEO optimization tools',
        limit: 'Unlimited'
      },
      { text: 'Priority support', tooltip: 'Get 24/7 chat support' },
      {
        text: 'AI powered suggestions',
        tooltip: 'Get up to 500 AI powered suggestions',
      },
    ],
    btn: {
      text: 'Contact team',
      href: '/login?plan=business',
    },
  },
];