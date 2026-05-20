import { create } from 'zustand';
import type { SubstituteSessionDetail } from '@/types/api';

interface PengajuanKpState {
  items: SubstituteSessionDetail[];
  total: number;
  loadedPages: Record<number, boolean>;
  setPage: (page: number, items: SubstituteSessionDetail[], total: number) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export const usePengajuanKpStore = create<PengajuanKpState>()((set) => ({
  items: [],
  total: 0,
  loadedPages: {},
  setPage: (page, newItems, total) => set((state) => {
    const existing = new Set(state.items.map(item => item.id));
    const merged = page === 1
      ? newItems
      : [...state.items, ...newItems.filter(item => !existing.has(item.id))];

    return {
      items: merged,
      total,
      loadedPages: { ...state.loadedPages, [page]: true },
    };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id),
    total: Math.max(0, state.total - 1),
  })),
  reset: () => set({ items: [], total: 0, loadedPages: {} }),
}));
