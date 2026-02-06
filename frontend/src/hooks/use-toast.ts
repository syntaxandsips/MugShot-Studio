import { useState, useCallback } from 'react';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

interface Toast extends ToastOptions {
    id: string;
    open: boolean;
}

let toastCount = 0;
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function addToast(options: ToastOptions) {
    const id = `toast-${toastCount++}`;
    const toast: Toast = {
        id,
        open: true,
        ...options,
    };

    toasts = [...toasts, toast];
    toastListeners.forEach((listener) => listener(toasts));

    // Auto-remove after duration
    setTimeout(() => {
        dismissToast(id);
    }, options.duration || 5000);

    return id;
}

function dismissToast(id: string) {
    toasts = toasts.map((t) =>
        t.id === id ? { ...t, open: false } : t
    );
    toastListeners.forEach((listener) => listener(toasts));

    // Remove from array after animation
    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        toastListeners.forEach((listener) => listener(toasts));
    }, 300);
}

export function toast(options: ToastOptions) {
    return addToast(options);
}

export function useToast() {
    const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

    const subscribe = useCallback((callback: (toasts: Toast[]) => void) => {
        toastListeners.push(callback);
        return () => {
            toastListeners = toastListeners.filter((l) => l !== callback);
        };
    }, []);

    useState(() => {
        const unsubscribe = subscribe(setCurrentToasts);
        return () => unsubscribe();
    });

    return {
        toasts: currentToasts,
        toast: addToast,
        dismiss: dismissToast,
    };
}
