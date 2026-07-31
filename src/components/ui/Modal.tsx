'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  zIndex?: number;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', zIndex = 50 }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`w-full ${sizeClasses[size]} glass-card rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/80 animate-in fade-in zoom-in-95`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
