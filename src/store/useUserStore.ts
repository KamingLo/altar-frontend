import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserData, UserRole } from '@/types/api';

interface UserState {
  user: UserData | null;
  role: UserRole | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (status: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setRole: (role) => set({ role }),
      setLoading: (status) => set({ loading: status }),
      clearUser: () => set({ user: null, role: null, loading: false }),
    }),
    {
      name: 'altar-user-session',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
);
