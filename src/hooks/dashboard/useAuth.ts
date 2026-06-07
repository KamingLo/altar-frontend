'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logoutUser } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types/api';

export const useAuth = () => {
  const router = useRouter();
  const { user, role, loading, setUser, setRole, setLoading, clearUser } = useUserStore();
  const [isHydrated, setIsHydrated] = useState(false);

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
          const derivedRole: UserRole | null = res.data.id_koordinator
            ? 'koordinator'
            : res.data.id_asisten
            ? 'asdos'
            : null;
          setRole(derivedRole);
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

    fetchUser();
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      clearUser();
      router.push('/auth/login');
    }
  };

  return { user, role, loading: !isHydrated || loading, handleLogout };
};
