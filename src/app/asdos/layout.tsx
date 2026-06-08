'use client';
import { useEffect } from 'react';
import DashboardLayout, { type MenuGroup } from '@/components/dashboard/DashboardLayout';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';
import { useRoleGuard } from '@/hooks/dashboard/useRoleGuard';
import { useUserStore } from '@/store/useUserStore';
import { usePrefetchStore } from '@/store/usePrefetchStore';
import { useRiwayatKehadiranStore } from '@/store/useRiwayatKehadiranStore';
import { useOnlinePresensiStore } from '@/store/useOnlinePresensiStore';
import { useDataMasterStore } from '@/store/useDataMasterStore';
import { getMyPresensi } from '@/lib/actions/presensi';
import { getSessionsByDate } from '@/lib/actions/jadwal';
import { getSemesterList, getRuanganList } from '@/lib/actions/data-master';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

export default function AsdosLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRoleGuard('asdos');
  const { user } = useUserStore();
  const { isPrefetched, isPrefetching, setPrefetching, setPrefetched } = usePrefetchStore();
  const { setItems: setRiwayatItems } = useRiwayatKehadiranStore();
  const { setData: setOnlineData } = useOnlinePresensiStore();
  const { setSemester, setRuangan } = useDataMasterStore();

  useEffect(() => {
    if (isLoading || isPrefetched || isPrefetching || !user?.id) return;

    setPrefetching();

    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      getMyPresensi(),
      getSessionsByDate(today),
      getSemesterList(1, '', 50),
      getRuanganList(1, '', 200),
    ])
      .then(([presensiRes, sessionRes, semesterRes, ruanganRes]) => {
        const presensiData = presensiRes.success ? (presensiRes.data ?? []) : [];
        setRiwayatItems(presensiData);
        setOnlineData(
          sessionRes.success ? (sessionRes.data ?? []) : [],
          presensiData,
          today,
        );
        if (semesterRes.success && semesterRes.data?.items) {
          const items = semesterRes.data.items;
          setSemester(items, items.length >= 50, 1);
        }
        if (ruanganRes.success && ruanganRes.data?.items) {
          const items = ruanganRes.data.items;
          setRuangan(items, items.length >= 200, 1);
        }
      })
      .catch(() => { /* fetch errors are non-fatal; pages handle their own error states */ })
      .finally(() => {
        setPrefetched();
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !user) {
    return <DashboardLoading />;
  }

  const menuGroups: MenuGroup[] = [];
  if (user?.id_koordinator) {
    menuGroups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
  }
  if (user?.id_asisten) {
    menuGroups.push({ id: 'asdos', title: 'Asisten Dosen', items: asdosMenuItems });
  }
  if (menuGroups.length === 0) {
    menuGroups.push({ id: 'asdos', title: 'Asisten Dosen', items: asdosMenuItems });
  }

  return (
    <DashboardLayout menuGroups={menuGroups} homeHref="/asdos" bgImage="/gedung-untar.png" bgImageDesktop="/gedung-untar-fl.webp">
      {children}
    </DashboardLayout>
  );
}
