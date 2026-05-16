import { create } from 'zustand';
import type { SessionFromAPI } from '@/lib/actions/jadwal';

const now = new Date();

interface JadwalState {
  sessions: SessionFromAPI[];
  currentYear: number;
  currentMonth: number;
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  setSessions: (sessions: SessionFromAPI[]) => void;
  setCalendar: (year: number, month: number, date: string) => void;
  setSelectedDate: (date: string) => void;
  setIsLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useJadwalStore = create<JadwalState>()((set) => ({
  sessions: [],
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  selectedDate: now.getDate().toString(),
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setCalendar: (year, month, date) => set({ currentYear: year, currentMonth: month, selectedDate: date }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),
  reset: () => set({
    sessions: [],
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    selectedDate: now.getDate().toString(),
    isLoading: false,
    error: null,
  }),
}));
