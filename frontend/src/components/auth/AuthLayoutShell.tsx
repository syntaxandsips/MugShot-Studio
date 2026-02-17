
import React from 'react';

import Image from 'next/image';
import backgroundImg from '@/app/assets/background.webp';

const AUTH_QUOTES = [
    {
        text: "Get access to your personal hub for clarity and productivity",
        subtitle: "You can easily"
    },
    {
        text: "Create stunning thumbnails that captivate your audience instantly",
        subtitle: "Start your creative journey"
    },
    {
        text: "Join thousands of creators who trust MugShot Studio",
        subtitle: "The smart choice"
    }
];

interface AuthLayoutShellProps {
    children: React.ReactNode;
    quoteIndex?: number;
}

export function AuthLayoutShell({ children, quoteIndex = 0 }: AuthLayoutShellProps) {
    const quote = AUTH_QUOTES[quoteIndex % AUTH_QUOTES.length];

    return (
        <div className="min-h-screen w-full flex bg-gray-50">
            {/* Left Side - Hero/Visual */}
            <div className="hidden lg:flex w-1/2 p-4 relative">
                <div className="w-full h-full rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between p-12 text-white">
                    {/* Full Sized Background Image */}
                    <Image
                        src={backgroundImg}
                        alt="Auth background"
                        fill
                        className="object-cover"
                        priority
                    />
                    
                    {/* Darker Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-black/30 z-0" />

                    {/* Branding on the left */}
                    <div className="relative z-10 text-3xl font-bold tracking-tight">
                        MugShot Studio
                    </div>

                    <div className="relative z-10 mb-10">
                        <p className="text-lg opacity-80 mb-2 font-medium">{quote.subtitle}</p>
                        <h1 className="text-5xl font-bold leading-tight drop-shadow-lg">
                            {quote.text}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
