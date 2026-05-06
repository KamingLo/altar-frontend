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
  bgImage?: string;
}

export default function DashboardLayout({ menuItems, children, homeHref, bgImage }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { clearUser } = useUserStore();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
        {bgImage && (
          <div className="absolute top-0 left-0 right-0 h-[45svh] z-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-cover bg-[center_top] opacity-30"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div
              className="absolute inset-0 z-10"
              style={{
                background: 'linear-gradient(to top, #EDF2F4 0%, #EDF2F4 15%, rgba(237, 242, 244, 0.8) 30%, rgba(237, 242, 244, 0.4) 45%, rgba(237, 242, 244, 0.1) 65%, transparent 100%)'
              }}
            />
          </div>
        )}

        {/* NAVBAR */}
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 z-20 bg-transparent">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-[#941C2F] hover:scale-105 active:scale-95 transition-all"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleLogout}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-[#941C2F] hover:scale-105 active:scale-95 transition-all"
          >
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 pt-24 pb-20">
          {children}
        </div>

        <div
          className={`fixed inset-0 z-50 ${isSidebarOpen ? '' : 'pointer-events-none'}`}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsSidebarOpen(false)}
          />

          <div
            className={`absolute top-0 left-0 w-[280px] h-full bg-[#941C2F] shadow-2xl flex flex-col overscroll-none overflow-hidden transition-transform duration-300 ease-in-out transform-gpu ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <img
              src="/sb-bg.png"
              alt=""
              className="absolute bottom-0 left-0 w-full object-contain pointer-events-none z-0 translate-y-27"
            />

            <div className="relative z-10 pt-10 pb-6 px-6 border-b border-white/20">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            </div>
            <div className="relative z-10 flex-1 px-3 py-6 overflow-y-auto no-scrollbar">
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

        {/* 
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
        */}
      </main>
    </div>
  );
}
