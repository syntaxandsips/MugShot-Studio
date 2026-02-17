'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Wand2, Download, ArrowRight, ExternalLink, Plus, Minus, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { projectsApi, Project } from '@/src/lib/api';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { AnimatePresence } from 'framer-motion';

// ... (previous components: HowItWorks, GalleryShowcase, LandingPricing)

// ==================== FAQ ====================
const faqs = [
  {
    question: "How are credits calculated?",
    answer: "Each generation costs a certain number of credits depending on the model and quality chosen. Typically, one standard headshot costs 1 credit. Higher resolution or advanced AI models may cost more."
  },
  {
    question: "Can I use images for commercial purposes?",
    answer: "Yes! Once you generate an image with a paid plan, you own the full commercial rights to that image. Free tier users can use images for personal, non-commercial projects."
  },
  {
    question: "What file formats are supported?",
    answer: "We support common formats including JPG, PNG, and WebP for uploads. Generations are typically delivered in high-resolution PNG or JPG format."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your account settings. You will continue to have access to your plan features until the end of your current billing period."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600">Got questions? We've got answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:border-teal-100"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <div className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="p-6 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== FINAL CTA BANNER ====================
export function FinalCTABanner() {
  return (
    <section className="w-full py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-gray-50 border border-gray-100 py-20 px-8 text-center"
        >
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
              Ready to create your perfect headshot?
            </h2>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed">
              Join thousands of professionals using MugShot Studio to level up their online presence.
            </p>
            <Button
              size="lg"
              className="h-16 px-10 text-lg font-bold rounded-2xl bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-xl shadow-teal-900/10 transition-all hover:scale-105"
              onClick={() => window.location.href = '/auth/signin'}
            >
              Get Started for Free
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


// ==================== HOW IT WORKS ====================
const steps = [
  {
    id: '01',
    title: 'Upload',
    description: 'Start by uploading your photo or entering a descriptive prompt.',
    icon: <Upload className="w-6 h-6" />,
  },
  {
    id: '02',
    title: 'Generate',
    description: 'Let our AI process and create your professional headshot.',
    icon: <Wand2 className="w-6 h-6" />,
  },
  {
    id: '03',
    title: 'Download',
    description: 'Download high-resolution images ready for use everywhere.',
    icon: <Download className="w-6 h-6" />,
  },
];

export function HowItWorks() {
  return (
    <section className="w-full py-24 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600">Three simple steps to your perfect thumbnail.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/4 left-0 w-full h-0.5 border-t border-dashed border-gray-200 -z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <span className="text-5xl font-bold text-gray-100 mb-4 group-hover:text-teal-50 transition-colors">
                {step.id}
              </span>
              <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm group-hover:border-teal-200 transition-colors">
                <div className="text-teal-600">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">
                {step.description}
              </p>

              {/* Arrow for mobile or between steps */}
              {index < 2 && (
                <div className="md:hidden mt-8 text-gray-200">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== GALLERY / SHOWCASE ====================
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
];

export function GalleryShowcase() {
  const [projects, setProjects] = useState<Partial<Project>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const data = await projectsApi.getFeaturedGallery(1, 6);
        if (data && data.items && data.items.length > 0) {
          setProjects(data.items);
        } else {
          // Fallback to placeholders
          setProjects(PLACEHOLDER_IMAGES.map((url, i) => ({
            id: `placeholder-${i}`,
            thumbnail_url: url,
            name: `Project ${i + 1}`,
            description: "AI-generated professional headshot"
          })));
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
        setProjects(PLACEHOLDER_IMAGES.map((url, i) => ({
          id: `placeholder-${i}`,
          thumbnail_url: url,
          name: `Sample Creation ${i + 1}`,
          description: "Example AI Generation"
        })));
      } finally {
        setIsLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Community Creations</h2>
            <p className="text-gray-600">See what others are creating with MugShot Studio.</p>
          </div>
          <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" asChild>
            <a href="/community">
              View All <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => console.log("Project ID:", project.id)}
              className="group relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <img
                src={project.thumbnail_url}
                alt={project.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                <h4 className="text-white font-bold text-lg mb-1">{project.name}</h4>
                <p className="text-white/80 text-sm line-clamp-2">{project.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== PRICING ====================
const pricingPlans = [
  {
    name: 'Free',
    price: '0',
    description: 'For hobbyists exploring AI.',
    features: ['10 credits', 'Basic models', 'Community support'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '19',
    description: 'Best for professionals & creators.',
    features: ['100 credits', 'Advanced models', 'No watermark', 'Priority support'],
    cta: 'Go Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Scalable solution for teams.',
    features: ['Unlimited credits', 'API access', 'Dedicated support', 'Custom models'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function LandingPricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="w-full py-24 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Simple Pricing</h2>

          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="pricing-toggle" className={!isYearly ? "font-bold" : "text-gray-500"}>Monthly</Label>
            <Switch
              id="pricing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="pricing-toggle" className={isYearly ? "font-bold" : "text-gray-500"}>
              Yearly <span className="text-teal-600 text-xs ml-1">(Save 20%)</span>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-3xl p-8 flex flex-col h-full border transition-all duration-300 ${plan.highlighted
                  ? "bg-white border-teal-500 shadow-2xl scale-105 z-10"
                  : "bg-white/50 border-gray-100 hover:border-gray-200"
                }`}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price === 'Custom' ? plan.price : `$${isYearly && plan.price !== '0' ? Math.round(Number(plan.price) * 0.8) : plan.price}`}
                </span>
                {plan.price !== 'Custom' && <span className="text-gray-500 ml-2">/mo</span>}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 rounded-xl font-bold transition-all ${plan.highlighted
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20"
                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900"
                  }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
