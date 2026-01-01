'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'error' | 'success';
}

export default function Toast({ message, isVisible, onClose, type = 'error' }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    error: 'bg-red-200 text-red-900',
    success: 'bg-green-200 text-green-900',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 border-4 border-black shadow-neo ${bgColors[type]} transition-transform animate-in slide-in-from-right`}>
      <span className="font-bold text-lg">
        {type === 'error' ? '!' : '✓'}
      </span>
      <p className="font-base font-bold uppercase tracking-wide text-sm">{message}</p>
      <button 
        onClick={onClose} 
        className="ml-4 font-bold border-2 border-black px-2 hover:bg-white hover:text-black transition-colors"
      >
        X
      </button>
    </div>
  );
}