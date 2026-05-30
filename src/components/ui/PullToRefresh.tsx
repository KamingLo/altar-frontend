'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const THRESHOLD = 110;
const MAX_DRAG = 130;
const INDICATOR = 44;

export function PullToRefresh() {
  const [drag, setDrag] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const dragRef = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current || refreshing) return;
    const raw = e.touches[0].clientY - startY.current;
    if (raw <= 0) {
      active.current = false;
      dragRef.current = 0;
      setDrag(0);
      return;
    }
    const d = Math.min(raw * 0.28, MAX_DRAG);
    dragRef.current = d;
    setDrag(d);
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    if (dragRef.current >= THRESHOLD) {
      setRefreshing(true);
      setDrag(0);
      dragRef.current = 0;
      setTimeout(() => window.location.reload(), 380);
    } else {
      setDrag(0);
      dragRef.current = 0;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  if (drag === 0 && !refreshing) return null;

  const progress = Math.min(drag / THRESHOLD, 1);
  const translateY = refreshing ? 10 : drag - INDICATOR;

  return (
    <div
      className="fixed left-1/2 z-[999] pointer-events-none"
      style={{
        top: 0,
        width: INDICATOR,
        height: INDICATOR,
        transform: `translateX(-50%) translateY(${translateY}px)`,
        transition: drag === 0 ? 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        opacity: refreshing ? 1 : progress,
      }}
    >
      <div className="w-11 h-11 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center">
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-crimson animate-spin" />
        ) : (
          <RefreshCw
            className="w-[18px] h-[18px] text-slate-400"
            style={{ transform: `rotate(${progress * 270}deg)`, transition: 'none' }}
          />
        )}
      </div>
    </div>
  );
}
