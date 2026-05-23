import { create } from 'zustand';

interface DarkModeState {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

export const useDarkModeStore = create<DarkModeState>((set) => ({
  isDark: false,
  setIsDark: (isDark) => set({ isDark }),
}));

