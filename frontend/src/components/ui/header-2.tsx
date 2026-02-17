'use client';
import React from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { MenuToggleIcon } from '@/src/components/ui/menu-toggle-icon';
import { useScroll } from '@/src/components/ui/use-scroll';
import { useAuth } from '@/src/context/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const links = [
        { label: 'Blogspace', href: '/blogspace' },
        { label: 'Download', href: '/download' },
        { label: 'About', href: '#' },
    ];

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const handleActionClick = () => {
        if (isAuthenticated) {
            router.push('/dashboard');
        } else {
            router.push('/auth/signin');
        }
    };

    return (
        <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
            <nav className="hidden md:flex w-full items-center justify-between px-8 py-4 max-w-[1440px] mx-auto">
                {/* Branding */}
                <div className="flex-shrink-0">
                    <span className="text-xl font-bold tracking-tight font-sans" style={{ color: '#0f7d70' }}>
                        MugShot Studio
                    </span>
                </div>

                {/* Centered Links */}
                <div className="flex-1 flex items-center justify-center gap-8">
                    {links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.href}
                            className={cn(buttonVariants({ variant: 'ghost' }), "text-black hover:text-black/80 font-medium")}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Side: Action Button */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <Button
                        style={{ backgroundColor: '#0f7d70', color: 'white' }}
                        className="rounded-full px-8 py-2.5 hover:bg-[#0c6a61] transition-opacity"
                        onClick={handleActionClick}
                    >
                        {isAuthenticated ? 'Dashboard' : 'Get Started'}
                    </Button>
                </div>
            </nav>

            {/* Mobile Nav */}
            <div className="flex md:hidden items-center justify-between px-4 py-3">
                <span className="text-xl font-bold tracking-tight font-sans" style={{ color: '#0f7d70' }}>
                    MugShot Studio
                </span>
                <Button size="icon" variant="ghost" onClick={() => setOpen(!open)}>
                    <MenuToggleIcon open={open} className="size-6 text-black" />
                </Button>
            </div>

            {/* Mobile Menu Content */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-white pt-20 px-6 transition-transform duration-300 ease-in-out md:hidden',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                <div className="flex flex-col gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-lg font-semibold text-gray-900"
                            onClick={() => setOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <hr className="border-gray-100" />
                    <Button
                        className="w-full rounded-full py-6 text-lg"
                        style={{ backgroundColor: '#0f7d70', color: 'white' }}
                        onClick={() => {
                            handleActionClick();
                            setOpen(false);
                        }}
                    >
                        {isAuthenticated ? 'Dashboard' : 'Get Started'}
                    </Button>
                </div>
            </div>
        </header>
    );
}
