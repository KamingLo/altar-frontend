'use client';
import DashboardLayout, { type MenuGroup } from '@/components/dashboard/DashboardLayout';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';
import { useRoleGuard } from '@/hooks/dashboard/useRoleGuard';
import { useUserStore } from '@/store/useUserStore';

export default function KoordinatorLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('koordinator');
  const { user } = useUserStore();

  const menuGroups: MenuGroup[] = [];

  if (user?.id_koordinator) {
    menuGroups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
  }
  if (user?.id_asisten) {
    menuGroups.push({ id: 'asdos', title: 'Asisten Dosen', items: asdosMenuItems });
  }
  if (menuGroups.length === 0) {
    menuGroups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
  }

  return (
    <DashboardLayout menuGroups={menuGroups} homeHref="/koordinator" bgImage="/gedung-untar.png" bgImageDesktop="/gedung-untar-fl.webp">
      {children}
    </DashboardLayout>
  );
}

