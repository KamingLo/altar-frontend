import { create } from 'zustand';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

export const MOCK_MODE = false;

interface PresensiState {
  presensiList: PresensiResponseDTO[];
  isLoading: boolean;
  setPresensi: (list: PresensiResponseDTO[]) => void;
  verifyPresensiLocal: (id: string, isVerified: boolean) => void;
  updatePaymentLocal: (ids: string[], isPaid: boolean) => void;
  setIsLoading: (v: boolean) => void;
  reset: () => void;
}

export const usePresensiStore = create<PresensiState>()((set) => ({
  presensiList: [],
  isLoading: false,
  setPresensi: (list) => set({ presensiList: list }),
  verifyPresensiLocal: (id, isVerified) =>
    set((state) => ({
      presensiList: state.presensiList.map((item) =>
        item.id_presensi === id ? { ...item, is_verified: isVerified } : item
      ),
    })),
  updatePaymentLocal: (ids, isPaid) =>
    set((state) => ({
      presensiList: state.presensiList.map((item) =>
        ids.includes(item.id_presensi) ? { ...item, is_paid: isPaid } : item
      ),
    })),
  setIsLoading: (v) => set({ isLoading: v }),
  reset: () => set({ presensiList: [], isLoading: false }),
}));

