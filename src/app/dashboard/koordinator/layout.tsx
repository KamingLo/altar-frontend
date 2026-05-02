'use client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { koordinatorMenuItems } from '@/components/dashboard/koordinator/KoordinatorHome';

export default function KoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout menuItems={koordinatorMenuItems} homeHref="/dashboard/koordinator">{children}</DashboardLayout>;
}
