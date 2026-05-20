import { create } from 'zustand';
import type { SubstituteSessionDetail } from '@/types/api';

interface PergantianKelasState {
  substitutionList: SubstituteSessionDetail[];
  isLoading: boolean;

  setSubstitutions: (list: SubstituteSessionDetail[]) => void;
  updateStatusLocal: (id: string, status: SubstituteSessionDetail['status'], coordinatorReason?: string | null) => void;
  setIsLoading: (v: boolean) => void;
  reset: () => void;
}

export const usePergantianKelasStore = create<PergantianKelasState>()((set) => ({
  substitutionList: [],
  isLoading: false,

  setSubstitutions: (list) => set({ substitutionList: list }),
  updateStatusLocal: (id, status, coordinatorReason) =>
    set((state) => ({
      substitutionList: state.substitutionList.map((item) =>
        item.id === id
          ? { ...item, status, coordinator_reason: coordinatorReason !== undefined ? coordinatorReason : item.coordinator_reason }
          : item
      ),
    })),
  setIsLoading: (v) => set({ isLoading: v }),
  reset: () => set({ substitutionList: [], isLoading: false }),
}));

