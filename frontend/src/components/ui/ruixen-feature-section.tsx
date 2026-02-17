"use client"

import { cn } from "@/src/lib/utils"
// import { CardContent } from "@/src/components/ui/card"; // Removing this import as the original component might expect CardContent from this folder, but since I use only CardContent, I will just import it or create a minimal one inside if needed or use the created card.tsx one.
// Actually, I just created src/components/ui/card.tsx so importing from there is correct.
import { CardContent } from "@/src/components/ui/card";
import { TbHeartPlus } from "react-icons/tb";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const Highlight = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <span
            className={cn(
                "font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-700/[0.2] dark:text-emerald-500 px-1 py-0.5",
                className
            )}
        >
            {children}
        </span>
    );
};


const CARDS = [
    {
        id: 0,
        name: "Sarah Chen",
        designation: "Frontend Developer",
        content: (
            <p>
                <Highlight>MugShot Studio</Highlight> has completely transformed our development workflow. The components are beautifully crafted and{" "}
                <Highlight>incredibly easy to integrate</Highlight> into any modern React application.
            </p>
        ),
    },
    {
        id: 1,
        name: "Alex Rodriguez",
        designation: "UI/UX Designer",
        content: (
            <p>
                The <Highlight>design system</Highlight> behind MugShot Studio is both elegant and consistent. From layout to interactivity, every detail is thoughtfully built with{" "}
                <Highlight>accessibility and usability</Highlight> in mind.
            </p>
        ),
    },
    {
        id: 2,
        name: "David Kim",
        designation: "Product Manager",
        content: (
            <p>
                After adopting <Highlight>MugShot Studio</Highlight>, our team shipped features 40% faster. The rich component library and{" "}
                <Highlight>clear documentation</Highlight> have made it an essential tool in our product development.
            </p>
        ),
    },
];


const integrations = [
    {
        name: "Figma",
        desc: "Design collaboratively in real-time with intuitive UI tools",
        icon: "🎨", // Replace with Figma logo or relevant icon
    },
    {
        name: "Vercel",
        desc: "Deploy your projects seamlessly with global scale",
        icon: "🚀", // Replace with Vercel logo or relevant icon
    }
];


export default function RuixenSection() {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 backdrop-blur-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 relative gap-8">
                {/* Left Block */}
                <div className="flex flex-col items-start justify-center border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-md">
                    {/* Card */}
                    <div className="relative w-full mb-4 sm:mb-6 h-[250px]">
                        {/* Adjusted height to fit CardStack */}
                        <div className="absolute inset-x-0 -bottom-2 h-16 sm:h-20 lg:h-24 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
                        <CardStack items={CARDS} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-normal text-gray-900 dark:text-white leading-relaxed mt-4">
                        Intuitive Dashboard Experience <span className="text-primary font-bold">MugShot Studio</span>{" "}
                        <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-lg block mt-2"> Simplify your development workflow with our beautifully designed components that provide actionable insights out of the box.</span>
                    </h3>
                </div>

                {/* Right Block */}
                <div className="flex flex-col items-center justify-start border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-md">
                    {/* Content */}
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-normal text-gray-900 dark:text-white mb-4 sm:mb-6 leading-relaxed w-full text-left">
                        Seamless Integration Ecosystem <span className="text-primary font-bold">MugShot Studio</span>{" "}
                        <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-lg block mt-2"> Integrate effortlessly with your favorite tools using MugShot's smart API-ready architecture and eliminate silos in seconds.</span>
                    </h3>
                    <div
                        className={cn(
                            "group relative mt-auto w-full inline-flex animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-white dark:bg-black px-4 sm:px-6 lg:px-8 py-2 font-medium text-primary-foreground transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",

                            // before styles
                            "before:absolute before:bottom-[8%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
                        )}
                    >
                        {/* Integration List */}
                        <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl z-10 w-full relative overflow-hidden">
                            {integrations.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:bg-muted/50 transition cursor-default"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center text-sm sm:text-lg flex-shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button className="rounded-full border border-gray-200 dark:border-gray-700 p-1.5 sm:p-2 text-xs font-semibold flex-shrink-0 ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><TbHeartPlus className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                                </div>
                            ))}
                        </CardContent>
                    </div>
                </div>
            </div>

            {/* Stats and Testimonial Section */}
            <div className="mt-12 sm:mt-16 lg:mt-20 grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                <div className="flex justify-center items-center p-4 sm:p-6 bg-white/30 dark:bg-black/30 rounded-2xl backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:gap-6 xl:gap-8 w-full text-center sm:text-left">
                        <div className="space-y-2 sm:space-y-3">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">+1200</div>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 font-medium">Stars on GitHub</p>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">22M</div>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 font-medium">Active Users</p>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">+500</div>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 font-medium">Powered Apps</p>
                        </div>
                    </div>
                </div>
                <div className="relative p-6 bg-white/30 dark:bg-black/30 rounded-2xl backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                    <blockquote className="border-l-4 border-primary pl-4 sm:pl-6 lg:pl-8 text-gray-700 dark:text-gray-400 italic">
                        <p className="text-sm sm:text-base lg:text-lg leading-relaxed">"Using MugShot Studio has been like unlocking a new level of productivity. It's the perfect fusion of simplicity and versatility, enabling us to create stunning thumbnails in record time."</p>
                        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                            <cite className="block font-bold text-sm sm:text-base text-gray-900 dark:text-white not-italic">— Saurabh, CEO</cite>
                            {/* Using a generic placeholder or existing asset if available, but staying generic as requested */}
                        </div>
                    </blockquote>
                </div>
            </div>
        </section>
    )
}

let interval: any;

type Card = {
    id: number;
    name: string;
    designation: string;
    content: React.ReactNode;
};

export const CardStack = ({
    items,
    offset,
    scaleFactor,
}: {
    items: Card[];
    offset?: number;
    scaleFactor?: number;
}) => {
    const CARD_OFFSET = offset || 10;
    const SCALE_FACTOR = scaleFactor || 0.06;
    const [cards, setCards] = useState<Card[]>(items);

    useEffect(() => {
        startFlipping();

        return () => clearInterval(interval);
    }, []);
    const startFlipping = () => {
        interval = setInterval(() => {
            setCards((prevCards: Card[]) => {
                const newArray = [...prevCards]; // create a copy of the array
                newArray.unshift(newArray.pop()!); // move the last element to the front
                return newArray;
            });
        }, 5000); // Slower flip for readability
    };

    return (
        <div className="relative h-48 w-full md:h-48 md:w-full max-w-[350px] mx-auto my-4 perspective-1000">
            {/* Added perspective and constrained width */}

            {cards.map((card, index) => {
                return (
                    <motion.div
                        key={card.id}
                        className="absolute dark:bg-neutral-900 bg-white h-full w-full rounded-3xl p-6 shadow-xl border border-neutral-200 dark:border-white/[0.1] flex flex-col justify-between transition-colors duration-200"
                        style={{
                            transformOrigin: "top center",
                        }}
                        animate={{
                            top: index * -CARD_OFFSET,
                            scale: 1 - index * SCALE_FACTOR, // decrease scale for cards that are behind
                            zIndex: cards.length - index, //  decrease z-index for the cards that are behind
                            opacity: 1 - index * 0.1 // optional fade for back cards
                        }}
                        transition={{
                            duration: 0.5
                        }}
                    >
                        <div className="font-normal text-neutral-700 dark:text-neutral-200 text-sm leading-relaxed">
                            {card.content}
                        </div>
                        <div className="mt-2">
                            <p className="text-neutral-800 font-bold dark:text-white text-sm">
                                {card.name}
                            </p>
                            <p className="text-neutral-400 font-normal dark:text-neutral-300 text-xs uppercase tracking-wide">
                                {card.designation}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
