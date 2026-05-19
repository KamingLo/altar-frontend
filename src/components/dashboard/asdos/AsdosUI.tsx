'use client';

import React from 'react';
import { X } from 'lucide-react';

type AsdosPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AsdosPageShell({ children, className = '' }: AsdosPageShellProps) {
  return (
    <div className={`relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans ${className}`}>
      {children}
    </div>
  );
}

type AsdosPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function AsdosPageHeader({ eyebrow, title, description, action, className = '' }: AsdosPageHeaderProps) {
  return (
    <div className={`mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 ${className}`}>
      <div>
        <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">{eyebrow}</p>
        <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1 md:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

type AsdosStateProps = {
  icon?: React.ReactNode;
  title?: string;
  message: string;
  variant?: 'loading' | 'empty' | 'error';
  className?: string;
};

export function AsdosState({ icon, title, message, variant = 'empty', className = '' }: AsdosStateProps) {
  const isError = variant === 'error';
  return (
    <div className={`${isError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-200 text-center'} rounded-2xl border border-dashed p-6 md:p-12 shadow-sm ${className}`}>
      {icon && <div className="mx-auto mb-3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">{icon}</div>}
      {title && <p className="text-sm md:text-base font-semibold text-slate-700">{title}</p>}
      <p className={`${isError ? 'text-sm font-semibold' : 'text-xs md:text-sm text-slate-500 mt-1'}`}>{message}</p>
    </div>
  );
}

export function AsdosLoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-9 h-9 border-4 border-[#941C2F]/20 border-t-[#941C2F] rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

type AsdosPrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
};

export function AsdosPrimaryButton({ icon, children, className = '', ...props }: AsdosPrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`bg-[#941C2F] text-white font-bold rounded-xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

type AsdosBottomSheetProps = {
  open: boolean;
  visible: boolean;
  closing: boolean;
  dragY: number;
  onClose: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
};

export function AsdosBottomSheet({
  open,
  visible,
  closing,
  dragY,
  onClose,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
  footer,
  maxWidthClass = 'max-w-md md:max-w-xl',
}: AsdosBottomSheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
        <div
          className={`w-full ${maxWidthClass} bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[85vh] overflow-hidden pointer-events-auto`}
          style={{
            transform: (!visible || closing) ? 'translateY(100%)' : `translateY(${dragY}px)`,
            transition: (!visible || closing || dragY === 0) ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          }}
        >
          <div
            className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>
          <div className="px-5 pt-2 md:pt-6 pb-6 overflow-y-auto">{children}</div>
          {footer}
        </div>
      </div>
    </>
  );
}

export function AsdosSheetCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="hidden md:flex shrink-0 w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
      <X size={18} />
    </button>
  );
}
