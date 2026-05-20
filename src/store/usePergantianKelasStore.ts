import { create } from 'zustand';
import type { SubstituteSessionDetail } from '@/types/api';
import type { SubstitutionStatus } from '@/lib/actions/pergantian-kelas';

interface PergantianKelasState {
  substitutionList: SubstituteSessionDetail[];
  total: number;
  activeFilter: SubstitutionStatus | undefined;
  isLoading: boolean;

  setSubstitutions: (list: SubstituteSessionDetail[], total: number, filter?: SubstitutionStatus) => void;
  setIsLoading: (v: boolean) => void;
  reset: () => void;
}

export const usePergantianKelasStore = create<PergantianKelasState>()((set) => ({
  substitutionList: [],
  total: 0,
  activeFilter: undefined,
  isLoading: false,

  setSubstitutions: (list, total, filter) =>
    set({ substitutionList: list, total, activeFilter: filter }),
  setIsLoading: (v) => set({ isLoading: v }),
  reset: () => set({ substitutionList: [], total: 0, activeFilter: undefined, isLoading: false }),
}));
