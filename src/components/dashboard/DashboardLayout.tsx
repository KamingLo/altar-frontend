'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, LogOut, ChevronRight, Home, ChevronsLeft, ChevronsRight, ChevronDown, GraduationCap, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/lib/actions/auth/session';
import { useUserStore } from '@/store/useUserStore';

interface MenuItem {
  id: number;
  title: string;
  icon: React.ElementType;
  href: string;
}

export interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

interface DashboardLayoutProps {
  menuGroups: MenuGroup[];
  children: React.ReactNode;
  homeHref: string;
  bgImage?: string;
  bgImageDesktop?: string;
}

export default function DashboardLayout({ menuGroups, children, homeHref, bgImage, bgImageDesktop }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(menuGroups.map(g => g.id))
  );
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [isLogoutClosing, setIsLogoutClosing] = useState(false);
  const [logoutStartY, setLogoutStartY] = useState(0);
  const [logoutDragY, setLogoutDragY] = useState(0);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearUser } = useUserStore();

  const hasDualRole = !!(user?.id_asisten && user?.id_koordinator);
  const otherDashboardHref = homeHref === '/koordinator' ? '/asdos' : '/koordinator';
  const otherDashboardLabel = homeHref === '/koordinator' ? 'Asdos' : 'Koor';
  const homeDashboardLabel = homeHref === '/koordinator' ? 'Dash Koor' : 'Dash Asdos';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
      setDateStr(now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    clearUser();
    router.replace('/auth/login');
  };

  const openLogoutConfirm = () => {
    setIsLogoutOpen(true);
    setIsLogoutClosing(false);
    setLogoutDragY(0);
    setTimeout(() => setIsLogoutVisible(true), 10);
  };

  const closeLogoutConfirm = () => {
    setIsLogoutClosing(true);
    setIsLogoutVisible(false);
    setTimeout(() => {
      setIsLogoutOpen(false);
      setIsLogoutClosing(false);
      setLogoutDragY(0);
    }, 300);
  };

  const confirmLogout = () => {
    closeLogoutConfirm();
    setTimeout(() => handleLogout(), 300);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allItems = menuGroups.flatMap(g => g.items);
  const isMultiGroup = menuGroups.length > 1;

  const renderDesktopNavItem = (item: MenuItem, collapsed: boolean) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.title : undefined}
        className={`flex items-center rounded-2xl transition-all duration-200 group ${collapsed
          ? `justify-center px-0 py-3.5 ${active ? 'text-white' : 'text-white/70 hover:text-white'}`
          : `justify-between px-4 py-3 ${active ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'}`
          }`}
      >
        <div className={`flex items-center ${collapsed ? '' : 'gap-3.5'}`}>
          <div className={`p-2.5 transition-all duration-200 shrink-0 rounded-xl relative ${collapsed
            ? active ? 'bg-white/20' : 'bg-white/10'
            : active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
            }`}>
            {collapsed && active && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
            )}
            <Icon size={19} className={`transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
          </div>
          {!collapsed && (
            <span className={`font-bold text-sm tracking-wide whitespace-nowrap ${active ? 'text-white' : ''}`}>{item.title}</span>
          )}
        </div>
        {!collapsed && (
          active
            ? <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            : <ChevronRight size={16} className="text-white/30 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 shrink-0" />
        )}
      </Link>
    );
  };

  const renderDesktopNav = () => {
    if (isSidebarCollapsed) {
      return <div className="space-y-1">{allItems.map(item => renderDesktopNavItem(item, true))}</div>;
    }

    if (!isMultiGroup) {
      return <div className="space-y-1">{allItems.map(item => renderDesktopNavItem(item, false))}</div>;
    }

    return (
      <div className="space-y-1">
        {menuGroups.map((group, idx) => (
          <div key={group.id}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white/40 hover:text-white/60 transition-all duration-200"
            >
              <span className="text-[10px] font-extrabold tracking-widest uppercase">{group.title}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${openGroups.has(group.id) ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: openGroups.has(group.id) ? `${group.items.length * 80}px` : '0px' }}
            >
              <div className="space-y-1 pt-0.5 pb-1">
                {group.items.map(item => renderDesktopNavItem(item, false))}
              </div>
            </div>
            {idx < menuGroups.length - 1 && (
              <div className="h-px bg-white/10 mt-3 mb-1" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMobileNavItem = (item: MenuItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${active ? 'text-white bg-white/15' : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
            <Icon size={18} className={`transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
          </div>
          <span className={`font-semibold text-sm tracking-wide ${active ? 'text-white' : ''}`}>{item.title}</span>
        </div>
        {active
          ? <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
          : <ChevronRight size={16} className="text-white/30 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
        }
      </Link>
    );
  };

  const renderMobileNav = () => {
    if (!isMultiGroup) {
      return <div className="space-y-1">{allItems.map(item => renderMobileNavItem(item))}</div>;
    }

    return (
      <div className="space-y-1">
        {menuGroups.map((group, idx) => (
          <div key={group.id}>
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white/40 hover:text-white/60 transition-all duration-200"
            >
              <span className="text-[10px] font-extrabold tracking-widest uppercase">{group.title}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${openGroups.has(group.id) ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: openGroups.has(group.id) ? `${group.items.length * 80}px` : '0px' }}
            >
              <div className="space-y-1 pt-0.5 pb-1">
                {group.items.map(item => renderMobileNavItem(item))}
              </div>
            </div>
            {idx < menuGroups.length - 1 && (
              <div className="h-px bg-white/10 mt-3 mb-1" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 lg:bg-[#EDF2F4]">
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

      <div className="flex w-full h-screen overflow-hidden lg:max-w-none bg-[#EDF2F4] shadow-2xl lg:shadow-none">

        <aside
          id="dashboard-sidebar-desktop"
          className={`hidden lg:flex flex-col h-full overflow-hidden shrink-0 bg-[#941C2F] shadow-[4px_0_24px_rgba(0,0,0,0.08)] transition-[width] duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}`}
        >
          <div className={`pt-10 pb-7 border-b border-white/10 flex items-center transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-7'}`}>
            <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
              <img src="/logo-sb.png" alt="Logo" className="h-9 w-auto object-contain" />
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/15 active:scale-90 transition-all duration-200 shrink-0"
            >
              {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>

          <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto no-scrollbar">
            {renderDesktopNav()}
          </div>

          <div className={`shrink-0 px-3 pb-6 pt-3 border-t border-white/10`}>
            <button
              onClick={openLogoutConfirm}
              title={isSidebarCollapsed ? 'Keluar' : undefined}
              className={`w-full flex items-center rounded-2xl text-white/70 transition-all duration-200 group ${isSidebarCollapsed
                ? 'justify-center px-0 py-3.5 hover:text-white'
                : 'justify-between px-4 py-3 hover:text-white hover:bg-red-500/20'
                }`}
            >
              <div className={`flex items-center ${isSidebarCollapsed ? '' : 'gap-3.5'}`}>
                <div className={`p-2.5 transition-all duration-200 shrink-0 rounded-xl ${isSidebarCollapsed ? 'bg-white/10' : 'bg-white/5 group-hover:bg-red-500/20'
                  }`}>
                  <LogOut size={19} className="text-white/60 group-hover:text-red-400 transition-colors" />
                </div>
                {!isSidebarCollapsed && (
                  <span className="font-bold text-sm tracking-wide">Keluar</span>
                )}
              </div>
            </button>
          </div>
        </aside>

        <main
          className="relative w-full max-w-md lg:max-w-none h-screen bg-[#EDF2F4] overflow-hidden flex flex-col mx-auto lg:mx-0 transition-all duration-300"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {bgImage && (
            <div className="absolute top-0 left-0 right-0 h-[45svh] lg:h-[35svh] z-0 pointer-events-none">
              <div
                className="absolute inset-0 bg-cover bg-[center_top] opacity-30 lg:hidden"
                style={{ backgroundImage: `url(${bgImage})` }}
              />
              <div
                className="absolute inset-0 bg-cover bg-[center_top] opacity-20 hidden lg:block"
                style={{ backgroundImage: `url(${bgImageDesktop ?? bgImage})` }}
              />
              <div
                className="absolute inset-0 z-10"
                style={{
                  background: 'linear-gradient(to top, #EDF2F4 0%, #EDF2F4 15%, rgba(237, 242, 244, 0.8) 30%, rgba(237, 242, 244, 0.4) 45%, rgba(237, 242, 244, 0.1) 65%, transparent 100%)'
                }}
              />
            </div>
          )}

          <div id="dashboard-home-button-desktop" className="hidden lg:flex absolute top-7 left-7 z-20 gap-2">
            {hasDualRole ? (
              <>
                <Link
                  href="/koordinator"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-bold ${homeHref === '/koordinator' ? 'bg-[#941C2F] text-white border-[#941C2F]/30 shadow-md shadow-[#941C2F]/20' : 'text-[#941C2F] bg-white border-slate-200/80 shadow-sm hover:shadow-md'}`}
                >
                  <LayoutDashboard size={16} strokeWidth={2.5} />
                  Dash Koor
                </Link>
                <Link
                  href="/asdos"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-bold ${homeHref === '/asdos' ? 'bg-[#941C2F] text-white border-[#941C2F]/30 shadow-md shadow-[#941C2F]/20' : 'text-[#941C2F] bg-white border-slate-200/80 shadow-sm hover:shadow-md'}`}
                >
                  <GraduationCap size={16} strokeWidth={2.5} />
                  Dash Asdos
                </Link>
              </>
            ) : (
              <Link
                href={homeHref}
                className="flex items-center gap-2 px-4 py-2.5 text-[#941C2F] bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 rounded-2xl transition-all duration-200 text-sm font-bold"
              >
                <Home size={17} strokeWidth={2.5} />
                {homeDashboardLabel}
              </Link>
            )}
          </div>

          <div id="dashboard-clock-desktop" className="hidden lg:flex absolute top-7 right-7 z-20 items-center gap-4 text-right">
            <div>
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase leading-none">{dateStr.split(', ')[0]}</p>
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-1 leading-none">{dateStr.split(', ')[1]}</p>
            </div>
            <div className="w-px h-10 bg-slate-200/70" />
            <div>
              <p className="text-2xl font-black font-mono tracking-tight text-[#941C2F] leading-none">{timeStr}</p>
              <p className="text-[10px] font-extrabold text-slate-500 tracking-widest text-right mt-1">WIB</p>
            </div>
          </div>

          <header id="dashboard-header-mobile" className={`lg:hidden absolute top-0 left-0 right-0 flex items-center justify-between gap-3 px-6 py-3.5 z-20 transition-all duration-300 ${isScrolled ? 'bg-white/60 backdrop-blur-md shadow-sm border-b border-white/30' : 'bg-transparent'}`}>
            <Link
              href={homeHref}
              className="shrink-0 text-[#941C2F] hover:scale-105 active:scale-90 active:bg-[#941C2F]/10 active:shadow-[0_0_20px_rgba(148,28,47,0.15)] rounded-full transition-all duration-200 p-2.5 flex items-center justify-center"
            >
              <Home size={26} strokeWidth={2.5} />
            </Link>
            <div id="dashboard-clock-mobile" className={`flex flex-col items-center rounded-xl px-3 py-1.5 transition-all duration-300 ${isScrolled ? 'bg-transparent border border-transparent shadow-none' : 'bg-white/40 backdrop-blur-md shadow-sm border border-white/20'}`}>
              <p className="text-[8px] font-bold text-slate-500 tracking-widest uppercase leading-none">{dateStr}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-base font-black font-mono tracking-tight text-[#941C2F] leading-none">{timeStr}</p>
                <p className="text-[9px] font-extrabold text-slate-500 tracking-widest leading-none">WIB</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="shrink-0 text-[#941C2F] hover:scale-105 active:scale-90 active:bg-[#941C2F]/10 active:shadow-[0_0_20px_rgba(148,28,47,0.15)] rounded-full transition-all duration-200 p-2.5 flex items-center justify-center"
            >
              <Menu size={28} strokeWidth={2.5} />
            </button>
          </header>

          <div
            id="dashboard-children-container"
            onScroll={(e) => setIsScrolled((e.target as HTMLDivElement).scrollTop > 8)}
            className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 lg:px-12 pt-20 lg:pt-24 pb-20"
          >
            {children}
          </div>

          <div className={`lg:hidden fixed inset-0 z-50 ${isSidebarOpen ? '' : 'pointer-events-none'}`}>
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
              onClick={() => setIsSidebarOpen(false)}
            />
            <div
              className={`absolute top-0 left-0 w-[280px] h-full bg-[#941C2F] shadow-2xl flex flex-col overscroll-none overflow-x-hidden transition-transform duration-300 ease-in-out transform-gpu ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="pt-10 pb-6 px-6 border-b border-white/20 shrink-0">
                <img src="/logo-sb.png" alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <div className="flex-1 min-h-0 px-3 py-6 overflow-y-auto no-scrollbar">
                {renderMobileNav()}
              </div>

              <div className="shrink-0 px-3 pb-6 pt-3 border-t border-white/20 space-y-1">
                {hasDualRole && (
                  <Link
                    href={otherDashboardHref}
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-300">
                        <ArrowLeftRight size={18} className="text-white/60 group-hover:text-white transition-colors" />
                      </div>
                      <span className="font-semibold text-sm tracking-wide">
                        Dashboard {otherDashboardLabel}
                      </span>
                    </div>
                    <ChevronRight size={15} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </Link>
                )}
                <button
                  onClick={openLogoutConfirm}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-red-500/20 transition-all duration-300">
                      <LogOut size={18} className="text-white/60 group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="font-semibold text-sm tracking-wide">Keluar</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isLogoutOpen && (
        <>
          <div
            onClick={closeLogoutConfirm}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ease-out ${isLogoutVisible && !isLogoutClosing ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Desktop popout */}
          <div className="hidden lg:flex fixed inset-0 z-[70] items-center justify-center">
            <div
              className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transition-all duration-300 ${isLogoutVisible && !isLogoutClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="p-7 pb-5">
                <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-5">
                  <LogOut size={24} className="text-[#941C2F]" />
                </div>
                <h2 className="text-[20px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">Keluar dari Sistem?</h2>
                <p className="text-sm text-slate-500 text-center leading-relaxed">Anda akan keluar dari akun ini. Pastikan semua pekerjaan sudah tersimpan.</p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={closeLogoutConfirm}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all">
                  Batal
                </button>
                <button onClick={confirmLogout}
                  className="flex-1 py-3 rounded-xl bg-[#941C2F] text-white font-bold text-sm shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Mobile bottom sheet */}
          <div className="lg:hidden fixed inset-0 z-[70] flex items-end justify-center pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden pointer-events-auto"
              style={{
                transform: (!isLogoutVisible || isLogoutClosing)
                  ? 'translateY(100%)'
                  : `translateY(${logoutDragY}px)`,
                transition: (!isLogoutVisible || isLogoutClosing || logoutDragY === 0)
                  ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  : 'none',
              }}
            >
              <div
                className="w-full flex items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
                onTouchStart={(e) => setLogoutStartY(e.touches[0].clientY)}
                onTouchMove={(e) => {
                  const delta = e.touches[0].clientY - logoutStartY;
                  if (delta > 0) setLogoutDragY(delta);
                }}
                onTouchEnd={() => {
                  if (logoutDragY > 100) closeLogoutConfirm();
                  else setLogoutDragY(0);
                }}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>
              <div className="px-6 pt-4 pb-8">
                <div className="flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-5">
                  <LogOut size={24} className="text-[#941C2F]" />
                </div>
                <h2 className="text-[22px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">Keluar dari Sistem?</h2>
                <p className="text-sm text-slate-500 text-center leading-relaxed mb-7">Anda akan keluar dari akun ini. Pastikan semua pekerjaan sudah tersimpan.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={confirmLogout}
                    className="w-full py-4 rounded-2xl bg-[#941C2F] text-white font-bold text-[15px] shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <LogOut size={16} /> Keluar Sekarang
                  </button>
                  <button onClick={closeLogoutConfirm}
                    className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-[15px] hover:bg-slate-200 active:scale-[0.98] transition-all">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}