'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  maxWidthClassName?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  headerAction,
  maxWidthClassName = 'max-w-md md:max-w-xl',
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetStartY, setSheetStartY] = useState(0);

  useEffect(() => {
    let t0: NodeJS.Timeout;
    let t1: NodeJS.Timeout;
    if (isOpen) {
      t0 = setTimeout(() => setClosing(false), 0);
      t1 = setTimeout(() => setVisible(true), 10);
    } else {
      t0 = setTimeout(() => { setVisible(false); setClosing(true); }, 0);
      t1 = setTimeout(() => {
        setClosing(false);
        setSheetDragY(0);
      }, 300);
    }
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setSheetStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };

  const handleTouchEnd = () => {
    if (sheetDragY > 100) {
      onClose();
    } else {
      setSheetDragY(0);
    }
  };

  if ((!isOpen && !closing) || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9990] transition-opacity duration-300 ease-out
          ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="fixed inset-0 z-[9995] flex items-end md:items-center justify-center pointer-events-none">
        <div
          className={`w-full ${maxWidthClassName} bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[85vh] overflow-hidden pointer-events-auto transition-all duration-300
            ${!isMobile && visible && !closing ? 'opacity-100 scale-100' : ''}
            ${!isMobile && (!visible || closing) ? 'opacity-0 scale-95' : ''}
          `}
          style={
            isMobile
              ? {
                  transform: !visible || closing ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                  transition: !visible || closing || sheetDragY === 0 ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
                }
              : {}
          }
        >
          <div
            className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          {(title || subtitle || headerAction) && (
            <div className="px-5 pt-2 md:pt-6 pb-2 flex items-start justify-between shrink-0">
              <div className="pr-10 min-w-0">
                {title && <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7 truncate">{title}</h2>}
                {subtitle && <p className="text-xs font-medium text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerAction}
                <button
                  onClick={onClose}
                  className="hidden md:flex w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="px-5 pb-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

