'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/home/Hero';
import { useUserStore } from '@/store/useUserStore';
import { getSession } from '@/lib/actions/auth/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      const { user } = useUserStore.getState();
      if (user) {
        if (user.id_koordinator) {
          router.replace('/koordinator');
        } else {
          router.replace('/asdos');
        }
        return;
      }

      const sessionRes = await getSession();
      if (!cancelled && sessionRes.success && sessionRes.data) {
        useUserStore.getState().setUser(sessionRes.data);
        if (sessionRes.data.id_koordinator) {
          router.replace('/koordinator');
        } else {
          router.replace('/asdos');
        }
      }
    };
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main>
      <Hero />
    </main>
  );
}
