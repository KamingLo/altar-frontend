'use client';
import DashboardLayout, { type MenuGroup } from '@/components/dashboard/DashboardLayout';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';
import { useRoleGuard } from '@/hooks/dashboard/useRoleGuard';
import { useUserStore } from '@/store/useUserStore';

export default function AsdosLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('asdos');
  const { user } = useUserStore();

  const menuGroups: MenuGroup[] = [];

  if (user?.id_koordinator) {
    menuGroups.push({ id: 'koordinator', title: 'Koordinator', items: koordinatorMenuItems });
  }
  if (user?.id_asisten) {
    menuGroups.push({ id: 'asdos', title: 'Asdos', items: asdosMenuItems });
  }
  if (menuGroups.length === 0) {
    menuGroups.push({ id: 'asdos', title: 'Asdos', items: asdosMenuItems });
  }

  return (
    <DashboardLayout menuGroups={menuGroups} homeHref="/asdos" bgImage="/gedung-untar.png" bgImageDesktop="/gedung-untar-fl.webp">
      {children}
    </DashboardLayout>
  );
}

