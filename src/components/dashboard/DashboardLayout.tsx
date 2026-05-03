'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, LogOut, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';

interface MenuItem {
  id: number;
  title: string;
  icon: React.ElementType;
  href: string;
}

interface DashboardLayoutProps {
  menuItems: MenuItem[];
  children: React.ReactNode;
  homeHref: string;
}

export default function DashboardLayout({ menuItems, children, homeHref }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { clearUser } = useUserStore();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    await logoutUser();
    clearUser();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}</style>

      <main
        className="relative w-full max-w-md h-screen bg-[#EDF2F4] overflow-hidden shadow-2xl flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* NAVBAR */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4 bg-[#EDF2F4] z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-full text-[#941C2F] hover:bg-black/5 transition-colors"
          >
            <Menu size={26} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 -mr-2 rounded-full text-[#941C2F] hover:bg-black/5 transition-colors"
          >
            <LogOut size={22} strokeWidth={2} />
          </button>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20">
          {children}
        </div>

        {/* SIDEBAR DRAWER */}
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isSidebarOpen ? 'visible' : 'invisible'}`}>
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className={`absolute top-0 left-0 w-[250px] h-full bg-[#941C2F] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overscroll-none overflow-hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <img
              src="/sb-bg.png"
              alt=""
              className="absolute bottom-0 left-0 w-full object-contain pointer-events-none z-0 translate-y-27"
            />

            <div className="relative z-10 pt-10 pb-6 px-6 border-b border-white/20">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            </div>
            <div className="relative z-10 flex-1 px-3 py-6 overflow-y-auto">
              <nav className="space-y-2">
                <Link
                  href={homeHref}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                      <ArrowLeft size={18} className="text-white/60 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-semibold text-sm tracking-wide">Dashboard</span>
                  </div>
                </Link>
                <div className="h-px bg-white/10 mb-4" />
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                          <Icon size={18} className="text-white/60 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-semibold text-sm tracking-wide">{item.title}</span>
                      </div>
                      <ChevronRight size={16} className="text-white/30 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
