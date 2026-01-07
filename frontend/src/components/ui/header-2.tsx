'use client';
import React from 'react';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { MenuToggleIcon } from '@/src/components/ui/menu-toggle-icon';
import { useScroll } from '@/src/components/ui/use-scroll';
import { AuthModal } from '@/src/components/ui/auth-modal';

export function Header() {
    const [open, setOpen] = React.useState(false);
    const [authOpen, setAuthOpen] = React.useState(false);
    const scrolled = useScroll(10);

    const links = [
        {
            label: 'Features',
            href: '#',
        },
        {
            label: 'Pricing',
            href: '#',
        },
        {
            label: 'Download',
            href: '/download',
        },
        {
            label: 'About',
            href: '#',
        },
    ];

    React.useEffect(() => {
        if (open) {
            // Disable scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable scroll
            document.body.style.overflow = '';
        }

        // Cleanup when component unmounts (important for Next.js)
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent md:rounded-md md:transition-all md:ease-out',
                {
                    'bg-white/90 supports-[backdrop-filter]:bg-white/80 backdrop-blur-lg md:top-4 md:max-w-4xl md:shadow':
                        scrolled && !open,
                    'bg-white/95': open,
                },
            )}
        >
            <nav
                className={cn(
                    'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
                    {
                        'md:px-2': scrolled,
                    },
                )}
            >
                {/* Branding */}
                <span className="text-xl font-bold tracking-tight font-silver" style={{ color: '#0f7d70' }}>
                    Mugshot Studio
                </span>

                <div className="hidden items-center gap-2 md:flex">
                    {links.map((link, i) => (
                        <a key={i} className={cn(buttonVariants({ variant: 'ghost' }), "text-black hover:text-black/80")} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                    <Button
                        variant="outline"
                        className="text-black border-black bg-white hover:bg-[#0f7d70] hover:border-[#0f7d70] hover:text-white transition-colors duration-200"
                        onClick={() => setAuthOpen(true)}
                    >
                        Sign In
                    </Button>
                    <Button style={{ backgroundColor: '#0f7d70', color: 'white' }} onClick={() => setAuthOpen(true)}>Get Started</Button>
                </div>
                <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="md:hidden">
                    <MenuToggleIcon open={open} className="size-5" duration={300} />
                </Button>
            </nav>

            <div
                className={cn(
                    'bg-white/95 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
                    open ? 'block' : 'hidden',
                )}
            >
                <div
                    data-slot={open ? 'open' : 'closed'}
                    className={cn(
                        'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
                        'flex h-full w-full flex-col justify-between gap-y-2 p-4',
                    )}
                >
                    <div className="grid gap-y-2">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                className={buttonVariants({
                                    variant: 'ghost',
                                    className: 'justify-start text-black hover:text-black/80',
                                })}
                                href={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full text-black border-black bg-white hover:bg-[#0f7d70] hover:border-[#0f7d70] hover:text-white transition-colors duration-200"
                            onClick={() => setAuthOpen(true)}
                        >
                            Sign In
                        </Button>
                        <Button className="w-full" style={{ backgroundColor: '#0f7d70', color: 'white' }} onClick={() => setAuthOpen(true)}>Get Started</Button>
                    </div>
                </div>
            </div>
            <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
        </header>
    );
}
