import { create } from 'zustand';

interface PrefetchState {
  isPrefetched: boolean;
  isPrefetching: boolean;
  setPrefetching: () => void;
  setPrefetched: () => void;
  reset: () => void;
}

export const usePrefetchStore = create<PrefetchState>()((set) => ({
  isPrefetched: false,
  isPrefetching: false,
  setPrefetching: () => set({ isPrefetching: true }),
  setPrefetched: () => set({ isPrefetched: true, isPrefetching: false }),
  reset: () => set({ isPrefetched: false, isPrefetching: false }),
}));
