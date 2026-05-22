import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  pendingCount: number;
  hasSeen: boolean;
  lastSeenKpId: string | null;
  lastSeenPresensiId: string | null;
  setPendingCount: (n: number) => void;
  markSeen: () => void;
  setLastSeenKpId: (id: string | null) => void;
  setLastSeenPresensiId: (id: string | null) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      pendingCount: 0,
      hasSeen: false,
      lastSeenKpId: null,
      lastSeenPresensiId: null,
      setPendingCount: (n) => set((state) => ({
        pendingCount: n,
        hasSeen: n > state.pendingCount ? false : state.hasSeen,
      })),
      markSeen: () => set({ hasSeen: true }),
      setLastSeenKpId: (id) => set({ lastSeenKpId: id }),
      setLastSeenPresensiId: (id) => set({ lastSeenPresensiId: id }),
    }),
    {
      name: 'altar-notification',
      partialize: (state) => ({
        pendingCount: state.pendingCount,
        lastSeenKpId: state.lastSeenKpId,
        lastSeenPresensiId: state.lastSeenPresensiId,
        // hasSeen NOT persisted — session only, resets on page reload
      }),
    }
  )
);
