import { create } from 'zustand';
import type { KelasItem, MataKuliahItem, RuanganItem, SemesterItem } from '@/types/api';

interface DataMasterState {
  kelasList: KelasItem[];
  kelasPage: number;
  kelasHasMore: boolean;
  mkList: MataKuliahItem[];
  mkPage: number;
  mkHasMore: boolean;
  ruanganList: RuanganItem[];
  ruanganPage: number;
  ruanganHasMore: boolean;
  semesterList: SemesterItem[];
  semesterPage: number;
  semesterHasMore: boolean;

  isLoading: boolean;

  setKelas: (list: KelasItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setMK: (list: MataKuliahItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setRuangan: (list: RuanganItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setSemester: (list: SemesterItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setIsLoading: (v: boolean) => void;
  resetTab: (tab: 'kelas' | 'mk' | 'ruangan' | 'semester') => void;
}

export const useDataMasterStore = create<DataMasterState>()((set) => ({
  kelasList: [], kelasPage: 1, kelasHasMore: false,
  mkList: [], mkPage: 1, mkHasMore: false,
  ruanganList: [], ruanganPage: 1, ruanganHasMore: false,
  semesterList: [], semesterPage: 1, semesterHasMore: false,
  isLoading: false,

  setKelas: (list, hasMore, page, append = false) =>
    set((s) => ({ kelasList: append ? [...s.kelasList, ...list] : list, kelasHasMore: hasMore, kelasPage: page })),
  setMK: (list, hasMore, page, append = false) =>
    set((s) => ({ mkList: append ? [...s.mkList, ...list] : list, mkHasMore: hasMore, mkPage: page })),
  setRuangan: (list, hasMore, page, append = false) =>
    set((s) => ({ ruanganList: append ? [...s.ruanganList, ...list] : list, ruanganHasMore: hasMore, ruanganPage: page })),
  setSemester: (list, hasMore, page, append = false) =>
    set((s) => ({ semesterList: append ? [...s.semesterList, ...list] : list, semesterHasMore: hasMore, semesterPage: page })),
  setIsLoading: (v) => set({ isLoading: v }),

  resetTab: (tab) => {
    if (tab === 'kelas') set({ kelasList: [], kelasPage: 1, kelasHasMore: false });
    else if (tab === 'mk') set({ mkList: [], mkPage: 1, mkHasMore: false });
    else if (tab === 'ruangan') set({ ruanganList: [], ruanganPage: 1, ruanganHasMore: false });
    else set({ semesterList: [], semesterPage: 1, semesterHasMore: false });
  },
}));

