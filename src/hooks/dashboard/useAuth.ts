'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logoutUser } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';

export const useAuth = () => {
  const router = useRouter();
  const { user, loading, setUser, setLoading, clearUser } = useUserStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Tunggu Zustand selesai ambil data dari localStorage (hydration)
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const fetchUser = async () => {
      try {
        const res = await getSession();
        
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          clearUser();
          router.push('/auth/login');
        }
      } catch {
        clearUser();
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    // Jika belum ada user di store, baru fetch ke API
    if (!user) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [router, setUser, setLoading, user, clearUser, isHydrated]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      clearUser();
      router.push('/auth/login');
    }
  };

  return { user, loading: !isHydrated || loading, handleLogout };
};