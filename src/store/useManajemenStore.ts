import { create } from 'zustand';
import type { AsdosListItem, KoorListItem, UserListItem } from '@/lib/actions/manajemen';

interface ManajemenState {
  asdosList: AsdosListItem[];
  koorList: KoorListItem[];
  userList: UserListItem[];
  asdosHasMore: boolean;
  koorHasMore: boolean;
  userHasMore: boolean;
  asdosPage: number;
  koorPage: number;
  userPage: number;
  isLoading: boolean;

  setAsdos: (list: AsdosListItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setKoor: (list: KoorListItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setUsers: (list: UserListItem[], hasMore: boolean, page: number, append?: boolean) => void;
  setIsLoading: (v: boolean) => void;
}

export const useManajemenStore = create<ManajemenState>()((set) => ({
  asdosList: [], koorList: [], userList: [],
  asdosHasMore: false, koorHasMore: false, userHasMore: false,
  asdosPage: 1, koorPage: 1, userPage: 1,
  isLoading: false,

  setAsdos: (list, hasMore, page, append = false) =>
    set((s) => ({ asdosList: append ? [...s.asdosList, ...list] : list, asdosHasMore: hasMore, asdosPage: page })),
  setKoor: (list, hasMore, page, append = false) =>
    set((s) => ({ koorList: append ? [...s.koorList, ...list] : list, koorHasMore: hasMore, koorPage: page })),
  setUsers: (list, hasMore, page, append = false) =>
    set((s) => ({ userList: append ? [...s.userList, ...list] : list, userHasMore: hasMore, userPage: page })),
  setIsLoading: (v) => set({ isLoading: v }),
}));
