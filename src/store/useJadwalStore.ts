import { create } from 'zustand';
import type { SessionFromAPI } from '@/lib/actions/jadwal';

const now = new Date();

interface JadwalState {
  personalSessions: SessionFromAPI[];
  allSessions: SessionFromAPI[];
  fetchedMonthsPersonal: Record<string, boolean>;
  fetchedMonthsAll: Record<string, boolean>;

  currentYear: number;
  currentMonth: number;
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  jadwalAjarCache: Record<string, SessionFromAPI[]>;
  setJadwalAjarCache: (key: string, sessions: SessionFromAPI[]) => void;

  addPersonalSessions: (sessions: SessionFromAPI[]) => void;
  addAllSessions: (sessions: SessionFromAPI[]) => void;
  markMonthFetched: (monthKey: string, type: 'PERSONAL' | 'ALL') => void;

  setCalendar: (year: number, month: number, date: string) => void;
  setSelectedDate: (date: string) => void;
  setIsLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useJadwalStore = create<JadwalState>()((set) => ({
  personalSessions: [],
  allSessions: [],
  fetchedMonthsPersonal: {},
  fetchedMonthsAll: {},

  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  selectedDate: now.getDate().toString(),
  isLoading: false,
  error: null,

  jadwalAjarCache: {},
  setJadwalAjarCache: (key, sessions) =>
    set((state) => ({ jadwalAjarCache: { ...state.jadwalAjarCache, [key]: sessions } })),

  addPersonalSessions: (newSessions) => set((state) => {
    const existing = new Set(state.personalSessions.map(s => `${s.id_sesi}-${s.waktu}`));
    const filtered = newSessions.filter(s => !existing.has(`${s.id_sesi}-${s.waktu}`));
    return { personalSessions: [...state.personalSessions, ...filtered] };
  }),
  addAllSessions: (newSessions) => set((state) => {
    const existing = new Set(state.allSessions.map(s => `${s.id_sesi}-${s.waktu}`));
    const filtered = newSessions.filter(s => !existing.has(`${s.id_sesi}-${s.waktu}`));
    return { allSessions: [...state.allSessions, ...filtered] };
  }),
  markMonthFetched: (monthKey, type) => set((state) => {
    if (type === 'PERSONAL') {
      return { fetchedMonthsPersonal: { ...state.fetchedMonthsPersonal, [monthKey]: true } };
    }
    return { fetchedMonthsAll: { ...state.fetchedMonthsAll, [monthKey]: true } };
  }),

  setCalendar: (year, month, date) => set({ currentYear: year, currentMonth: month, selectedDate: date }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),
  reset: () => set({
    personalSessions: [],
    allSessions: [],
    fetchedMonthsPersonal: {},
    fetchedMonthsAll: {},
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    selectedDate: now.getDate().toString(),
    isLoading: false,
    error: null,
    jadwalAjarCache: {},
  }),
}));

