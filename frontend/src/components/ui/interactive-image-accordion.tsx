'use client';
import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';

// --- Data for the image accordion ---
const accordionItems = [
    {
        id: 1,
        title: 'Creators who want consistent thumbnails',
    },
    {
        id: 2,
        title: 'Editors who need identity-stable faces',
    },
    {
        id: 3,
        title: 'YouTubers who want higher CTR',
    },
    {
        id: 4,
        title: 'Instagram micro-creators',
    },
    {
        id: 5,
        title: 'Agencies needing scalable workflows',
    },
];

// --- Accordion Item Component ---
const AccordionItem = ({
    item,
    isActive,
    onMouseEnter,
}: {
    item: (typeof accordionItems)[0];
    isActive: boolean;
    onMouseEnter: () => void;
}) => {
    return (
        <div
            className={cn(
                'relative h-[450px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out bg-[#022312]',
                isActive ? 'w-[400px]' : 'w-[60px]'
            )}
            onMouseEnter={onMouseEnter}
        >
            {/* Background is now dark green */}
            
            {/* Caption Text */}
            <span
                className={cn(
                    'absolute text-[#9fb960] text-lg font-semibold whitespace-nowrap transition-all duration-300 ease-in-out',
                    isActive
                        ? 'bottom-6 left-1/2 -translate-x-1/2 rotate-0' // Active state: horizontal, bottom-center
                        : 'w-auto text-left bottom-24 left-1/2 -translate-x-1/2 rotate-90' // Inactive state: vertical
                )}
            >
                {item.title}
            </span>
        </div>
    );
};

// --- Main App Component ---
export function InteractiveImageAccordion() {
    const [activeIndex, setActiveIndex] = useState(2); // Start with middle item active

    const handleItemHover = (index: number) => {
        setActiveIndex(index);
    };

    return (
        <section
            className="w-full py-12 md:py-24"
            style={{ backgroundColor: '#bff1cc' }}
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Left Side: Text Content */}
                    <div className="w-full md:w-1/2 text-center md:text-left pl-6">
                        <h2
                            className="text-4xl md:text-6xl font-bold leading-tight tracking-tighter mb-6 font-silver"
                            style={{ color: '#07270e' }}
                        >
                            Who This Is For
                        </h2>
                        <p
                            className="text-lg max-w-xl mx-auto md:mx-0 mb-8"
                            style={{ color: '#07270e' }}
                        >
                            Whether you're a solo creator or a large agency, MugShot Studio is
                            designed to streamline your thumbnail creation process and boost your
                            content's performance.
                        </p>
                        <div className="flex flex-col gap-4">
                            {accordionItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#9fb960' }} />
                                    <span className="text-lg font-medium" style={{ color: '#07270e' }}>{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Image Accordion */}
                    <div className="w-full md:w-1/2">
                        <div className="flex flex-row items-center justify-center gap-4 overflow-x-auto p-4 no-scrollbar">
                            {accordionItems.map((item, index) => (
                                <AccordionItem
                                    key={item.id}
                                    item={item}
                                    isActive={index === activeIndex}
                                    onMouseEnter={() => handleItemHover(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
