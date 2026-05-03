import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserData } from '@/types/api';

interface UserState {
  user: UserData | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setLoading: (status: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (status) => set({ loading: status }),
      clearUser: () => set({ user: null, loading: false }),
    }),
    {
      name: 'altar-user-session',
      // Hanya simpan data user, loading jangan di-persist
      partialize: (state) => ({ user: state.user }),
    }
  )
);
