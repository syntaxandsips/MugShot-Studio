"use client";

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// --- Types ---
type FAQItemProps = {
    question: string;
    answer: string;
};

type FAQData = {
    [key: string]: FAQItemProps[];
};

type FAQProps = {
    title?: string;
    subtitle?: string;
    categories: { [key: string]: string };
    faqData: FAQData;
    className?: string;
};

// --- Main Component ---
export const FAQ = ({
    title = "FAQs",
    subtitle = "Frequently Asked Questions",
    categories,
    faqData,
    className,
    ...props
}: FAQProps) => {
    const categoryKeys = Object.keys(categories);
    const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0]);

    return (
        <section
            className={cn(
                "relative overflow-hidden bg-white px-4 py-24 text-gray-900",
                className
            )}
            {...props}
        >
            <FAQHeader title={title} subtitle={subtitle} />
            <FAQTabs
                categories={categories}
                selected={selectedCategory}
                setSelected={setSelectedCategory}
            />
            <FAQList
                faqData={faqData}
                selected={selectedCategory}
            />
        </section>
    );
};

const FAQHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span className="mb-4 font-medium text-[#0f7d70] uppercase tracking-wider text-sm">
            {subtitle}
        </span>
        <h2 className="mb-12 text-4xl md:text-5xl font-bold font-silver text-[#0f7d70]">{title}</h2>
        {/* Decorative gradient blob */}
        <div className="absolute -top-[350px] left-[50%] z-0 h-[500px] w-[600px] -translate-x-[50%] rounded-full bg-[#0f7d70]/5 blur-3xl pointer-events-none" />
    </div>
);

const FAQTabs = ({
    categories,
    selected,
    setSelected
}: {
    categories: { [key: string]: string };
    selected: string;
    setSelected: (key: string) => void;
}) => (
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mb-12">
        {Object.entries(categories).map(([key, label]) => (
            <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                    "relative overflow-hidden whitespace-nowrap rounded-full border px-6 py-2 text-sm font-medium transition-colors duration-300",
                    selected === key
                        ? "border-[#0f7d70] text-white"
                        : "border-gray-200 bg-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
            >
                <span className="relative z-10">{label}</span>
                <AnimatePresence>
                    {selected === key && (
                        <motion.span
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            exit={{ y: "100%" }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 z-0 bg-[#0f7d70]"
                        />
                    )}
                </AnimatePresence>
            </button>
        ))}
    </div>
);

const FAQList = ({ faqData, selected }: { faqData: FAQData; selected: string }) => (
    <div className="mx-auto max-w-3xl">
        <AnimatePresence mode="wait">
            {Object.entries(faqData).map(([category, questions]) => {
                if (selected === category) {
                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            {questions.map((faq, index) => (
                                <FAQItem key={index} {...faq} />
                            ))}
                        </motion.div>
                    );
                }
                return null;
            })}
        </AnimatePresence>
    </div>
);

const FAQItem = ({ question, answer }: FAQItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            animate={isOpen ? "open" : "closed"}
            className={cn(
                "rounded-2xl border transition-all duration-200 overflow-hidden",
                isOpen ? "bg-gray-50 border-[#0f7d70]/30" : "bg-white border-gray-200 hover:border-gray-300"
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
                <span
                    className={cn(
                        "text-lg font-medium transition-colors",
                        isOpen ? "text-[#0f7d70]" : "text-gray-900"
                    )}
                >
                    {question}
                </span>
                <motion.span
                    variants={{
                        open: { rotate: 45 },
                        closed: { rotate: 0 },
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus
                        className={cn(
                            "h-5 w-5 transition-colors",
                            isOpen ? "text-[#0f7d70]" : "text-gray-400"
                        )}
                    />
                </motion.span>
            </button>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="px-5 pb-5 pt-0">
                    <p className="text-gray-600 leading-relaxed">{answer}</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Demo / Wrapper Component ---
export function FAQSection() {
    const categories = {
        "general": "General",
        "pricing": "Pricing & Credits",
        "technical": "Technical & Privacy",
        "opensource": "Open Source"
    };

    const faqData = {
        "general": [
            {
                question: "Does it keep my face consistent?",
                answer: "Yes. The system uses advanced identity embeddings from your reference photos to ensure your face remains consistent across all generated thumbnails."
            },
            {
                question: "Can I recreate any thumbnail I upload?",
                answer: "Yes, as long as it’s your own content. You can use Copy Mode to replicate layouts and styles. However, the system has safety measures to block celebrity misuse and non-consensual deepfakes."
            },
            {
                question: "Do I need design skills?",
                answer: "No. MugShot Studio handles composition, color grading, typography, and layout automatically. You just provide the idea and your face."
            },
            {
                question: "What formats do I get?",
                answer: "You can export in high-quality PNG and JPG. Pro and Mastermind plans also offer layered exports (JSON spec) for further editing."
            }
        ],
        "pricing": [
            {
                question: "How do credits work?",
                answer: "One credit equals one standard generation. Higher resolution or complex workflows (like Copy Mode) may consume more credits. Unused credits rollover on paid plans during the beta period."
            },
            {
                question: "Can I upgrade or downgrade anytime?",
                answer: "Yes, you can switch plans at any time. Upgrades take effect immediately with prorated charges, while downgrades apply at the end of your current billing cycle."
            },
            {
                question: "Is there a free trial?",
                answer: "We offer a Free / Open Source tier that you can self-host forever. For the hosted cloud version, you can start with the Starter plan to test the waters."
            }
        ],
        "technical": [
            {
                question: "What AI models do you use?",
                answer: "We utilize a blend of state-of-the-art models including FLUX, Gemini, and custom-tuned versions of Stable Diffusion, orchestrated by our proprietary NanoBanana routing engine."
            },
            {
                question: "Is my data private?",
                answer: "Yes. On the Pro and Mastermind plans, your identity embeddings and generations are private. On the Free and Starter tiers, generations are public by default but can be made private with an upgrade."
            }
        ],
        "opensource": [
            {
                question: "How do I self-host?",
                answer: "You can clone our repository from GitHub and follow the setup instructions. You'll need your own GPU or API keys for the underlying models."
            },
            {
                question: "Can I contribute to the project?",
                answer: "Absolutely! We welcome contributions from the community. Check out our contribution guidelines on GitHub to get started."
            }
        ]
    };

    return (
        <FAQ
            title="Frequently Asked Questions"
            subtitle="Got Questions?"
            categories={categories}
            faqData={faqData}
            className="bg-white"
        />
    );
}
