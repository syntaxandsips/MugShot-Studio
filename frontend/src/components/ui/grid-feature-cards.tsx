'use client';
import { cn } from '@/src/lib/utils';
import React from 'react';
import { Upload, Layers, Palette, Sparkles, Download, Share2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

type FeatureType = {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    description: string;
};

type FeatureCardPorps = React.ComponentProps<'div'> & {
    feature: FeatureType;
};

export function FeatureCard({ feature, className, ...props }: FeatureCardPorps) {
    const p = genRandomPattern();

    return (
        <div className={cn('relative overflow-hidden p-6 bg-[#0b3327] border-[#a0bb61]/20', className)} {...props}>
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
                <div className="from-[#a0bb61]/10 to-[#a0bb61]/5 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100">
                    <GridPattern
                        width={20}
                        height={20}
                        x="-12"
                        y="4"
                        squares={p}
                        className="fill-[#a0bb61]/10 stroke-[#a0bb61]/20 absolute inset-0 h-full w-full mix-blend-overlay"
                    />
                </div>
            </div>
            <feature.icon className="text-[#a0bb61] size-6" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-10 text-sm md:text-base font-medium text-[#a0bb61]">{feature.title}</h3>
            <p className="text-[#a0bb61]/80 relative z-20 mt-2 text-xs font-light leading-relaxed">{feature.description}</p>
        </div>
    );
}

function GridPattern({
    width,
    height,
    x,
    y,
    squares,
    ...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
    const patternId = React.useId();

    return (
        <svg aria-hidden="true" {...props}>
            <defs>
                <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
                    <path d={`M.5 ${height}V.5H${width}`} fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
            {squares && (
                <svg x={x} y={y} className="overflow-visible">
                    {squares.map(([x, y], index) => (
                        <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
                    ))}
                </svg>
            )}
        </svg>
    );
}

function genRandomPattern(length?: number): number[][] {
    length = length ?? 5;
    return Array.from({ length }, () => [
        Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
        Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
    ]);
}

const features = [
    {
        title: 'Step 1 — Upload Your Photos',
        icon: Upload,
        description: 'Drop 1–10 selfies. The system analyzes your face identity once.',
    },
    {
        title: 'Step 2 — Choose Your Mode',
        icon: Layers,
        description: 'Design Mode for fresh concepts. Copy Mode to recreate any existing thumbnail with your face.',
    },
    {
        title: 'Step 3 — Choose the Style & Layout',
        icon: Palette,
        description: 'Select platform, size, mood, text placement, colors.',
    },
    {
        title: 'Step 4 — Generate & Edit',
        icon: Sparkles,
        description: 'AI produces multiple variants. Adjust text, crop, and export instantly.',
    },
    {
        title: 'Step 5 — Download in All Sizes',
        icon: Download,
        description: 'You get optimized exports for YouTube, Reels, Instagram, X headers, and more.',
    },
    {
        title: 'Step 6 — Share & Viral',
        icon: Share2,
        description: 'Publish your content directly to your favorite platforms and watch your engagement grow.',
    },
];

export function GridFeatureCards() {
    return (
        <section className="w-full">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                <AnimatedContainer
                    delay={0.2}
                    className="grid grid-cols-1 divide-x divide-y divide-[#a0bb61]/20 border border-[#a0bb61]/20 sm:grid-cols-2 md:grid-cols-3 bg-[#0b3327] rounded-xl overflow-hidden shadow-xl"
                >
                    {features.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} />
                    ))}
                </AnimatedContainer>
            </div>
        </section>
    );
}

type ViewAnimationProps = {
    delay?: number;
    className?: React.ComponentProps<typeof motion.div>['className'];
    children: React.ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return children;
    }

    return (
        <motion.div
            initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.8 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
