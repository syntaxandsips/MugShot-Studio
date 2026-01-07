'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

type ToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
};

export function Toast({ message, isVisible, onClose, type = 'success' }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'error' ? 'bg-red-500 border-red-500' : 'bg-[#0f7d70] border-[#0f7d70]';

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-[100] p-4 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out",
        bgColor,
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-center">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}