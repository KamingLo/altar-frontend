'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkIsAsdos, checkIsKoordinator } from '@/lib/actions/auth/checkRole';
import { getSession } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types/api';

export const useRoleGuard = (expectedRole: UserRole) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setIsLoading(true);
      const check =
        expectedRole === 'koordinator'
          ? await checkIsKoordinator()
          : await checkIsAsdos();

      if (cancelled) return;

      if (!check.success) {
        router.replace('/auth/login');
        return;
      }

      // Recover session state in Zustand if it is missing (e.g., after OAuth redirect or page refresh)
      const { user, setUser, setRole } = useUserStore.getState();
      if (!user) {
        const sessionRes = await getSession();
        if (!cancelled && sessionRes.success && sessionRes.data) {
          setUser(sessionRes.data);
          const derivedRole: UserRole | null = sessionRes.data.id_koordinator
            ? 'koordinator'
            : sessionRes.data.id_asisten
            ? 'asdos'
            : null;
          setRole(derivedRole);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, router]);

  return { isLoading };
};

