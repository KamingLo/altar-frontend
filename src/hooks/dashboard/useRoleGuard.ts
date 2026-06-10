'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkIsAsdos, checkIsKoordinator } from '@/lib/actions/auth/checkRole';
import { getSession } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';
import type { UserRole } from '@/types/api';

export const useRoleGuard = (expectedRole: UserRole) => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const role = useUserStore((state) => state.role);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && role === expectedRole) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
    }
  }, [user, role, expectedRole]);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const check =
        expectedRole === 'koordinator'
          ? await checkIsKoordinator()
          : await checkIsAsdos();

      if (cancelled) return;

      if (!check.success) {
        useUserStore.getState().clearUser();
        router.replace('/auth/login');
        return;
      }

      const { user: currentUser, setUser, setRole } = useUserStore.getState();
      if (!currentUser) {
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

