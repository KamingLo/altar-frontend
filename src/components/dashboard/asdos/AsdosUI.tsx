'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowUp } from 'lucide-react';

type AsdosPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AsdosPageShell({ children, className = '' }: AsdosPageShellProps) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const container = document.getElementById('dashboard-children-container');
    if (!container) return;
    const onScroll = () => setShowTop(container.scrollTop > 300);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const container = document.getElementById('dashboard-children-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans ${className}`}>
      {children}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="lg:hidden fixed bottom-7 right-4 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 active:scale-90 transition-all z-30"
          aria-label="Kembali ke atas"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      )}
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
        <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">{eyebrow}</p>
        <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">{title}</h2>
        {description && <p className="text-sm mt-1 md:text-base text-slate-500">{description}</p>}
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
  noBg?: boolean;
};

export function AsdosState({ icon, title, message, variant = 'empty', className = '', noBg = false }: AsdosStateProps) {
  const isError = variant === 'error';
  const bgClass = noBg ? '' : (isError ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200');
  return (
    <div className={`${bgClass} ${isError ? 'text-red-600' : 'text-center'} rounded-2xl border border-dashed p-6 md:p-12 shadow-sm ${className}`}>
      {icon && <div className="mx-auto mb-3 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">{icon}</div>}
      {title && <p className="text-sm md:text-base font-semibold text-slate-700">{title}</p>}
      <p className={`${isError ? 'text-sm font-semibold' : 'text-xs md:text-sm text-slate-500 mt-1'}`}>{message}</p>
    </div>
  );
}

export function AsdosLoadingState({ message }: { message: string }) {
  return (
    <div className="space-y-3">
      <AsdosListSkeleton count={3} />
      <p className="sr-only">{message}</p>
    </div>
  );
}

export function AsdosListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex items-center justify-between border border-slate-100"
        >
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 animate-shimmer" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded-lg w-32 md:w-44 animate-shimmer" />
              <div className="h-3.5 bg-slate-100 rounded-lg w-24 md:w-32 animate-shimmer" />
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-2">
            <div className="h-8 bg-slate-100/80 border border-slate-100 rounded-lg w-24 animate-shimmer" />
            <div className="h-8 bg-slate-100/80 border border-slate-100 rounded-lg w-20 animate-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
}

export function AsdosQrScanSkeleton() {
  return (
    <>
      <div className="mb-6 md:mb-8 space-y-2.5">
        <div className="h-3 w-28 rounded-lg animate-shimmer" />
        <div className="h-8 w-44 rounded-xl animate-shimmer" />
        <div className="h-4 w-60 rounded-lg animate-shimmer" />
      </div>

      <div className="md:hidden flex flex-col items-center gap-4">
        <div className="w-full max-w-[280px] aspect-square rounded-2xl animate-shimmer" />
        <div className="w-full max-w-[280px] flex flex-col gap-3">
          <div className="h-12 w-full rounded-xl animate-shimmer" />
          <div className="h-12 w-full rounded-xl animate-shimmer" />
        </div>
      </div>

      <div className="hidden md:flex bg-white rounded-[2rem] shadow-sm border border-slate-100 p-12 lg:p-16 items-start gap-16">
        <div className="flex-1 pt-8 space-y-4">
          <div className="h-8 w-52 rounded-xl animate-shimmer" />
          <div className="space-y-2.5">
            <div className="h-4 w-full rounded-lg animate-shimmer" />
            <div className="h-4 w-5/6 rounded-lg animate-shimmer" />
            <div className="h-4 w-4/6 rounded-lg animate-shimmer" />
          </div>
          <div className="flex gap-4 mt-8">
            <div className="flex-1 h-12 rounded-xl animate-shimmer" />
            <div className="flex-1 h-12 rounded-xl animate-shimmer" />
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-[320px] aspect-square rounded-2xl animate-shimmer" />
        </div>
      </div>
    </>
  );
}

export function AsdosOnlineSessionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      <div className="mb-6 md:mb-8 space-y-2.5">
        <div className="h-3 w-36 rounded-lg animate-shimmer" />
        <div className="h-8 w-52 rounded-xl animate-shimmer" />
        <div className="h-4 w-72 rounded-lg animate-shimmer" />
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <div className="h-3 w-32 rounded-lg animate-shimmer" />
        <div className="h-6 w-14 rounded-lg animate-shimmer" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border border-slate-100 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-start justify-between gap-4 md:block md:w-1/3 w-full">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="h-6 w-40 rounded-lg animate-shimmer" />
                  <div className="h-4 w-28 rounded-lg animate-shimmer" />
                </div>
                <div className="md:hidden w-8 h-8 rounded-full animate-shimmer shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full md:w-[480px]">
                {Array.from({ length: 3 }, (_, j) => (
                  <div key={j} className="border-l-2 border-slate-100 pl-4 space-y-1.5">
                    <div className="h-2.5 w-12 rounded animate-shimmer" />
                    <div className="h-4 w-24 rounded-lg animate-shimmer" />
                  </div>
                ))}
              </div>
              <div className="hidden md:block w-8 h-8 rounded-full animate-shimmer shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

type AsdosPrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
};

export function AsdosPrimaryButton({ icon, children, className = '', ...props }: AsdosPrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`bg-crimson text-white font-bold rounded-xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
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

