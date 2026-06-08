import { create } from 'zustand';
import type { SessionFromAPI } from '@/lib/actions/jadwal';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

interface OnlinePresensiState {
  sessions: SessionFromAPI[];
  myPresensi: PresensiResponseDTO[];
  fetched: boolean;
  fetchedDate: string;
  isLoading: boolean;
  setData: (sessions: SessionFromAPI[], myPresensi: PresensiResponseDTO[], date: string) => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
}

export const useOnlinePresensiStore = create<OnlinePresensiState>()((set) => ({
  sessions: [],
  myPresensi: [],
  fetched: false,
  fetchedDate: '',
  isLoading: true,
  setData: (sessions, myPresensi, date) => set({ sessions, myPresensi, fetched: true, fetchedDate: date, isLoading: false }),
  setLoading: (value) => set({ isLoading: value }),
  reset: () => set({ sessions: [], myPresensi: [], fetched: false, fetchedDate: '', isLoading: true }),
}));
