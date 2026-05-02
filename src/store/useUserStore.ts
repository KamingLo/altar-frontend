// @/store/useUserStore.ts
import { create } from 'zustand';

interface UserData {
  id: string;
  email: string;
  name: string;
  id_asisten?: string | null;
  id_koordinator?: string | null;
}

interface UserState {
  user: UserData | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setLoading: (status: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (status) => set({ loading: status }),
  clearUser: () => set({ user: null }),
}));