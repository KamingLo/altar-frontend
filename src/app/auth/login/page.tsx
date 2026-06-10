'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useUserStore } from '@/store/useUserStore';
import { getSession } from '@/lib/actions/auth/session';

export default function LoginPage() {
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
    <main className="min-h-[100svh] bg-canvas">
      <Suspense fallback={<div className="min-h-[100svh] bg-canvas" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

