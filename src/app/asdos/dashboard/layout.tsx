'use client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';
import { useRoleGuard } from '@/hooks/dashboard/useRoleGuard';

export default function AsdosLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('asdos');
  return (
    <DashboardLayout menuItems={asdosMenuItems} homeHref="/asdos/dashboard" bgImage="/gedung-untar.png">
      {children}
    </DashboardLayout>
  );
}
