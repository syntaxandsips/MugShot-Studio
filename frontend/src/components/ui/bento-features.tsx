'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Layout, Zap } from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Active Users' },
  { value: '5M+', label: 'Images Generated' },
  { value: '99%', label: 'Satisfaction Rate' },
];

const features = [
  {
    title: "AI Studio",
    description: "Generate studio-quality images from text prompts with our advanced neural engine.",
    className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-teal-50/50 to-white",
    icon: <Sparkles className="w-6 h-6 text-teal-600" />,
    visual: (
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none overflow-hidden">
        <div className="w-64 h-64 bg-teal-500 rounded-full blur-3xl animate-pulse" />
      </div>
    )
  },
  {
    title: "Smart Editing",
    description: "One-click background removal, upscaling, and face enhancement.",
    className: "md:col-span-1 md:row-span-1 bg-white",
    icon: <Wand2 className="w-5 h-5 text-teal-600" />
  },
  {
    title: "Templates",
    description: "Start from professional templates to save time.",
    className: "md:col-span-1 md:row-span-1 bg-white",
    icon: <Layout className="w-5 h-5 text-teal-600" />
  },
  {
    title: "API Access",
    description: "Integrate our high-performance engine directly into your enterprise workflow.",
    className: "md:col-span-2 md:row-span-1 bg-white",
    icon: <Zap className="w-5 h-5 text-teal-600" />
  },
];

export function StatsBar() {
  return (
    <section className="w-full py-12 border-y border-gray-100 bg-gray-50/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-[#0f7d70] mb-2">{stat.value}</h2>
              <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BentoFeatures() {
  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Everything you need to create professional thumbnails at scale.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }}
              className={`relative overflow-hidden rounded-3xl border border-gray-100 p-8 transition-all flex flex-col justify-between group ${feature.className}`}
            >
              {feature.visual}
              <div className="relative z-10">
                <div className="mb-4 inline-flex p-3 rounded-2xl bg-teal-50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed max-w-[280px]">
                  {feature.description}
                </p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full border border-teal-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
