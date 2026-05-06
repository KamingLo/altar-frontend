'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkIsAsdos, checkIsKoordinator } from '@/lib/actions/auth/checkRole';
import type { UserRole } from '@/types/api';

export const useRoleGuard = (expectedRole: UserRole) => {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const check =
        expectedRole === 'koordinator'
          ? await checkIsKoordinator()
          : await checkIsAsdos();

      if (!cancelled && !check.success) {
        router.replace('/auth/login');
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
