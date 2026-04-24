'use client';

import { useAuth } from '@/hooks/dashboard/useAuth';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { ActivityLog } from '@/components/dashboard/ActivityLog';
import { ProfileCard } from '@/components/dashboard/ProfileCard';

export default function DashboardPage() {
  const { user, loading, handleLogout } = useAuth();

  if (loading) return <DashboardLoading />;

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 relative">
      <Sidebar />

      <div className="md:pl-20">
        <DashboardHeader 
          userEmail={user?.email} 
          userId={user?.id} 
          onLogout={handleLogout} 
        />

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <StatsGrid />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ActivityLog />
            </div>
            <div>
              <ProfileCard user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 blur-[120px] pointer-events-none -z-10" />
    </main>
  );
}