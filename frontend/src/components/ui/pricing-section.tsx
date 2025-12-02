"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { CheckIcon, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

const plans = [
    {
        title: "Free / Open Source",
        monthlyPrice: 0,
        annuallyPrice: 0,
        desc: "Self-hosted, BYOK, community-supported.",
        features: [
            "Open-source core",
            "Self-host infrastructure (BYOK GPU/APIs)",
            "Community support",
            "Unlimited local generations",
            "No hosted credits",
            "Public model presets",
            "Basic templates",
            "No Copy Mode",
            "No cloud queue",
            "No commercial license",
        ],
        buttonText: "Get Started",
    },
    {
        title: "Starter",
        monthlyPrice: 8,
        annuallyPrice: Math.round(8 * 12 * 0.8),
        desc: "For individuals who want hosted convenience without melting their GPU.",
        features: [
            "50 credits per month (rollover enabled during beta)",
            "Hosted identity system",
            "Design Mode",
            "Standard resolution (1080p)",
            "Public generations",
            "Basic commercial license",
            "Access to Gemini, FLUX, GPT-Image, seedream",
            "Editable templates",
            "Export PNG/JPG",
            "Priority over free-tier queues",
        ],
        buttonText: "Get Started",
    },
    {
        title: "Standard",
        monthlyPrice: 19,
        annuallyPrice: Math.round(19 * 12 * 0.8),
        desc: "For serious creators who need consistent, professional-looking thumbnails and stable face identity.",
        features: [
            "Everything in Starter, plus:",
            "150 credits per month",
            "Copy Mode (layout replication)",
            "High-consistency identity lock (InstantID integrated)",
            "4 custom brand kits",
            "Commercial license (royalty-free)",
            "Private generations",
            "Higher-resolution exports (1080p + 4K beta)",
            "Access to Seedream high-quality pipeline",
            "Model routing engine (auto-select model)",
            "Layered export (PNG + JSON spec)",
            "Queue priority upgrade",
        ],
        buttonText: "Get Started",
        highlight: true,
    },
    {
        title: "Pro",
        monthlyPrice: 49,
        annuallyPrice: Math.round(49 * 12 * 0.8),
        desc: "Built for editors, agencies, or anyone who pushes volume and can’t wait around for a queue.",
        features: [
            "Everything in Standard, plus:",
            "400 credits per month",
            "Full Copy Mode suite (font inference, layout matching, color extraction)",
            "4K stable generation",
            "Team-ready asset organization",
            "Private identity embeddings",
            "Unlimited brand kits",
            "Access to NanoBanana Pro (experimental)",
            "Private model routing",
            "Advanced typography engine",
            "Autocropping for multi-platform exports",
            "Priority queue (top-tier)",
        ],
        buttonText: "Get Started",
    },
    {
        title: "Mastermind",
        monthlyPrice: 98,
        annuallyPrice: Math.round(98 * 12 * 0.8),
        desc: "For agencies, studios, and creators doing serious volume or managing multiple channels.",
        features: [
            "Everything in Pro, plus:",
            "1000 credits per month",
            "[coming soon]",
            "Multi-user team seats (up to 5 editors)",
            "Shared workspaces",
            "API access (rate-limited)",
            "Full commercial + enterprise rights",
            "Private model instances (optional)",
            "Advanced color grading + LUT inference",
            "Priority support",
            "Audit logs and brand compliance tools",
        ],
        buttonText: "Get Started",
    },
];

const PlanCard = ({
    plan,
    billing,
    users,
}: {
    plan: (typeof plans)[0];
    billing: "monthly" | "annual";
    users: number;
}) => {
    const price = billing === "annual" ? plan.annuallyPrice : plan.monthlyPrice;

    return (
        <div
            className={cn(
                "flex flex-col relative rounded-2xl border transition-all bg-white overflow-hidden",
                plan.highlight
                    ? "border-[#0f7d70] ring-2 ring-[#0f7d70]/20 shadow-lg scale-[1.02] z-10"
                    : "border-gray-200 hover:border-[#0f7d70]/50 hover:shadow-md"
            )}
        >
            {plan.highlight && (
                <div className="absolute top-0 inset-x-0 h-1 bg-[#0f7d70]" />
            )}

            <div className="p-6 flex flex-col items-start w-full relative">
                <h2 className="font-semibold text-lg text-[#0f7d70]">{plan.title}</h2>
                <h3 className="mt-4 text-4xl font-bold text-gray-900">
                    ${price * users}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                        /{billing === "annual" ? "yr" : "mo"}
                    </span>
                </h3>
                <p className="text-sm text-gray-600 mt-4 min-h-[40px]">
                    {plan.desc}
                </p>
            </div>

            <div className="flex flex-col items-start w-full px-6 pb-6">
                <Button
                    size="lg"
                    className={cn(
                        "w-full font-semibold",
                        plan.highlight
                            ? "bg-[#0f7d70] hover:bg-[#0f7d70]/90 text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                    )}
                >
                    {plan.buttonText}
                </Button>
                <div className="h-6 overflow-hidden w-full mx-auto mt-3">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={billing}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="text-xs text-center text-gray-500 block"
                        >
                            {billing === "monthly"
                                ? "Billed monthly"
                                : "Billed annually"}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex flex-col items-start w-full px-6 pb-8 gap-y-3 border-t border-gray-100 pt-6">
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Includes:</span>
                {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <CheckIcon className="w-4 h-4 flex-shrink-0 text-[#9fb960] mt-0.5" />
                        <span className="text-left text-sm text-gray-600 leading-snug">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function PricingSection() {
    const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
    const [users, setUsers] = useState(1);

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#0f7d70] mb-4 font-silver">
                        MugShot Studio Pricing
                    </h2>
                    <p className="text-xl text-gray-600">
                        Choose the plan that fits your creative needs.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
                    <div className="flex bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                        <button
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                                billing === "annual"
                                    ? "bg-[#0f7d70] text-white shadow-md"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                            onClick={() => setBilling("annual")}
                        >
                            Annually <span className="text-xs opacity-90 ml-1">(Save 20%)</span>
                        </button>
                        <button
                            className={cn(
                                "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                                billing === "monthly"
                                    ? "bg-[#0f7d70] text-white shadow-md"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                            onClick={() => setBilling("monthly")}
                        >
                            Monthly
                        </button>
                    </div>

                    <div className="flex items-center gap-4 bg-white px-6 py-2.5 rounded-full border border-gray-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">Users:</span>
                        <div className="flex items-center gap-3">
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#0f7d70] hover:text-[#0f7d70] transition-colors"
                                onClick={() => setUsers(Math.max(1, users - 1))}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">{users}</span>
                            <button
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#0f7d70] hover:text-[#0f7d70] transition-colors"
                                onClick={() => setUsers(users + 1)}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">(team plans scale later)</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-5 items-start">
                    {plans.map((plan) => (
                        <PlanCard key={plan.title} plan={plan} billing={billing} users={users} />
                    ))}
                </div>
            </div>
        </section>
    );
}
