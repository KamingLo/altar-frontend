'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/dashboard/useAuth';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.id_koordinator) {
        router.replace('/koordinator');
      } else {
        router.replace('/asdos');
      }
    }
  }, [user, loading, router]);

  return <DashboardLoading />;
}

