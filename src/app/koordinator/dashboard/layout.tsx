'use client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';
import { useRoleGuard } from '@/hooks/dashboard/useRoleGuard';

export default function KoordinatorLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('koordinator');
  return (
    <DashboardLayout menuItems={koordinatorMenuItems} homeHref="/koordinator/dashboard" bgImage="/gedung-untar.png">
      {children}
    </DashboardLayout>
  );
}
