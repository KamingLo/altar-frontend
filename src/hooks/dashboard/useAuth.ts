'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logoutUser } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';

export const useAuth = () => {
  const router = useRouter();
  const { user, loading, setUser, setLoading, clearUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getSession();
        
        if (res.success && res.data) {
          // Sinkronisasi data user dari session ke Zustand
          setUser(res.data);
        } else {
          // Jika session tidak valid, tendang ke halaman login
          router.push('/auth/login');
        }
      } catch {
        // Jika server down atau fetch gagal, anggap tidak terautentikasi
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    // Hanya fetch jika data user di store masih kosong
    if (!user) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [router, setUser, setLoading, user]);

  const handleLogout = async () => {
    try {
      const result = await logoutUser();
      if (result.success) {
        clearUser();
        router.push('/auth/login');
      }
    } catch {
      // Tetap bersihkan user di sisi client jika logout gagal di server
      clearUser();
      router.push('/auth/login');
    }
  };

  return { user, loading, handleLogout };
};