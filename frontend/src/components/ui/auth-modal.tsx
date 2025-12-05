'use client';
import React from 'react';
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from '@/src/components/ui/modal';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { AtSignIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthModalProps = Omit<React.ComponentProps<typeof Modal>, 'children'>;

export function AuthModal(props: AuthModalProps) {
    const router = useRouter();
    return (
        <Modal {...props}>
            <ModalContent
                popoverProps={{
                    className: "bg-white border border-[#0f7d70] shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:slide-in-from-left-1/2 duration-300 rounded-xl"
                }}
                drawerProps={{
                    className: "bg-white border border-[#0f7d70] shadow-xl rounded-t-xl"
                }}
            >
                <ModalHeader 
                    className="rounded-t-xl"
                    drawerProps={{
                        className: "rounded-t-xl border-b border-[#0f7d70]"
                    }}
                >
                    <ModalTitle 
                        className="text-center text-2xl font-semibold text-[#0f7d70] py-4"
                        drawerProps={{
                            className: "text-center text-2xl font-semibold text-[#0f7d70] py-4"
                        }}
                    >
                        Sign In or Join Now!
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full duration-300 border-2 border-[#0f7d70] hover:bg-[#0f7d70] group h-12 rounded-lg"
                    >
                        <GoogleIcon className="w-5 h-5 me-2 group-hover:text-white" />
                        <span className="group-hover:text-white font-medium">Continue With Google</span>
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[#0f7d70]/30" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white text-[#0f7d70] px-4 font-bold">
                                OR
                            </span>
                        </div>
                    </div>
                    <p className="text-[#0f7d70] mb-3 text-start text-sm font-medium">
                        Enter your email address to sign in or create an account
                    </p>
                    <div className="relative h-max mb-4">
                        <Input
                            placeholder="your.email@example.com"
                            className="peer ps-9 h-12 border-2 border-[#0f7d70]/30 focus:border-[#0f7d70] focus:ring-2 focus:ring-[#0f7d70]/20 rounded-lg text-[#0f7d70] bg-white"
                            type="email"
                        />
                        <div className="text-[#0f7d70] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                            <AtSignIcon className="size-5" aria-hidden="true" />
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="w-full duration-300 bg-[#0f7d70] hover:bg-[#0c6a61] text-white h-12 rounded-lg font-medium"
                        onClick={() => router.push('/chat')}
                    >
                        <span>Continue With Email</span>
                    </Button>
                </ModalBody>
                <ModalFooter
                    className="p-4 rounded-b-xl"
                    drawerProps={{
                        className: "p-4 rounded-b-xl border-t border-[#0f7d70]"
                    }}
                >
                    <p className="text-[#0f7d70] text-center text-xs">
                        By clicking Continue, you agree to our{' '}
                        <Link className="text-[#0f7d70] hover:underline font-bold" href="/policy">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <g>
            <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
        </g>
    </svg>
);