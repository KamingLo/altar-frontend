'use client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { asdosMenuItems } from '@/components/dashboard/asdos/AsdosHome';

export default function AsdosLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout menuItems={asdosMenuItems} homeHref="/dashboard/asdos">{children}</DashboardLayout>;
}
