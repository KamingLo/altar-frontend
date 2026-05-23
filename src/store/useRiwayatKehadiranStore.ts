import { create } from 'zustand';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

const PAGE_SIZE = 10;

interface RiwayatKehadiranState {
  items: PresensiResponseDTO[];
  fetched: boolean;
  visibleCount: number;
  isLoading: boolean;
  error: string | null;
  setItems: (items: PresensiResponseDTO[]) => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  showMore: () => void;
  resetVisible: () => void;
  reset: () => void;
}

export const useRiwayatKehadiranStore = create<RiwayatKehadiranState>()((set) => ({
  items: [],
  fetched: false,
  visibleCount: PAGE_SIZE,
  isLoading: true,
  error: null,
  setItems: (items) => set({ items, fetched: true, visibleCount: PAGE_SIZE, error: null }),
  setLoading: (value) => set({ isLoading: value }),
  setError: (message) => set({ error: message }),
  showMore: () => set((state) => ({ visibleCount: state.visibleCount + PAGE_SIZE })),
  resetVisible: () => set({ visibleCount: PAGE_SIZE }),
  reset: () => set({ items: [], fetched: false, visibleCount: PAGE_SIZE, isLoading: true, error: null }),
}));

