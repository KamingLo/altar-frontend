'use client';
import React from 'react';
import Link from 'next/link';
import {
  FileText, QrCode, Users, CalendarSync,
  MapPin, LogOut, ChevronRight, TrendingUp, Clock, CheckCircle2,
  Database, CalendarDays
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export const koordinatorMenuItems = [
  { id: 1, title: 'Data Presensi', icon: FileText, href: '/koordinator/data-presensi', desc: 'Lihat & kelola data presensi' },
  { id: 2, title: 'Generate QR', icon: QrCode, href: '/koordinator/generate-qr', desc: 'Buat kode QR untuk sesi' },
  { id: 3, title: 'Manajemen User', icon: Users, href: '/koordinator/manajemen-user', desc: 'Kelola data asisten dosen' },
  { id: 4, title: 'Manajemen KP', icon: CalendarSync, href: '/koordinator/manajemen-kp', desc: 'Jadwal & data kerja praktik' },
  { id: 5, title: 'Data Master', icon: Database, href: '/koordinator/data-master', desc: 'Kelola kelas, MK, ruangan, semester' },
  { id: 6, title: 'Manajemen Jadwal', icon: CalendarDays, href: '/koordinator/manajemen-jadwal', desc: 'Kelola sesi jadwal mengajar' },
];

const desktopStats = [
  { id: 1, label: 'Total Asdos', value: '24', sub: '+2 bulan ini', icon: Users, positive: true },
  { id: 2, label: 'Presensi Hari Ini', value: '18', sub: '75% hadir', icon: CheckCircle2, positive: true },
  { id: 3, label: 'Menunggu ACC', value: '2', sub: 'Perlu persetujuan', icon: Clock, positive: false },
];

const notifications = [
  {
    id: 1, name: 'Sarah Amalia', type: 'Jaringan Komputer TI C',
    detail: 'Senin, 11 Nov -> Kamis, 14 Nov', status: 'Menunggu ACC', time: '10 mnt lalu',
  },
  {
    id: 2, name: 'Doni Tata', type: 'Sistem Operasi TI A',
    detail: 'Selasa, 12 Nov -> Jumat, 15 Nov', status: 'Menunggu ACC', time: '1 jam lalu',
  },
];

const activities = [
  { id: 1, name: 'Bima Sakti', action: 'Check-in', subject: 'Basis Data - Ruang M305', time: '08:00 WIB', isCheckIn: true },
  { id: 2, name: 'Kevin Wijaya', action: 'Check-out', subject: 'Algoritma', time: '10:30 WIB', isCheckIn: false },
  { id: 3, name: 'Alya Rahma', action: 'Check-in', subject: 'Pemrograman Web - Ruang M402', time: '11:15 WIB', isCheckIn: true },
];

export default function KoordinatorHome() {
  const { user } = useUserStore();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 animate-fade-up lg:flex lg:justify-between lg:items-end">
        <div>
          <p className="text-sm lg:text-base font-semibold text-[#941C2F] tracking-wide uppercase mb-1">
            Dashboard Koordinator
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold lg:font-extrabold text-slate-800 leading-tight">
            Halo, <br className="lg:hidden" />{user?.email.split('@')[0] ?? 'Admin'}
          </h1>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100 shrink-0">
          <TrendingUp size={15} className="text-[#941C2F]" />
          <span className="text-sm font-semibold text-slate-500">{today}</span>
        </div>
      </div>

      <div className="hidden lg:gap-5 lg:mb-10">
        {desktopStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-50 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#941C2F]/5 flex items-center justify-center text-[#941C2F]">
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${stat.positive ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {stat.sub}
                </span>
              </div>
              <p className="text-4xl font-extrabold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm font-semibold text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 lg:hidden gap-y-6 gap-x-3 mb-10 w-full px-1">
        {koordinatorMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center group lg:flex-row lg:items-center lg:bg-white lg:rounded-2xl lg:p-5 lg:gap-4 lg:shadow-sm lg:border lg:border-slate-50 lg:hover:border-[#941C2F]/20 lg:hover:shadow-md lg:transition-all lg:duration-300"
            >
              <div className="w-14 h-14 lg:w-12 lg:h-12 bg-white lg:bg-[#941C2F]/5 rounded-full lg:rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] lg:shadow-none text-[#941C2F] group-hover:scale-110 lg:group-hover:scale-100 group-hover:bg-[#941C2F] group-hover:text-white group-active:scale-95 transition-all duration-300 mb-3 lg:mb-0 shrink-0">
                <Icon size={24} className="lg:w-5 lg:h-5" strokeWidth={2} />
              </div>

              <div className="hidden lg:block flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 group-hover:text-[#941C2F] transition-colors leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>

              <span className="text-[10px] lg:hidden font-semibold text-slate-600 text-center w-16 leading-tight">
                {item.title}
              </span>

              <ChevronRight size={16} className="hidden lg:block text-slate-300 group-hover:text-[#941C2F] transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Notifikasi Masuk</h3>
            <button className="text-xs lg:text-sm font-semibold text-[#941C2F] active:scale-95 transition">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-md lg:shadow-sm active:scale-[0.97] transition-all duration-200 flex gap-4 lg:gap-5 items-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#941C2F]/5 flex items-center justify-center text-[#941C2F] shrink-0">
                  <CalendarSync size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{notif.name}</h4>
                    <span className="text-[10px] lg:text-xs text-slate-400 font-medium whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-[12px] lg:text-xs font-semibold text-[#941C2F] mb-1 truncate">{notif.type}</p>
                  <p className="text-[12px] lg:text-xs text-slate-500 mb-3 line-clamp-2">{notif.detail}</p>
                  <span className="inline-block text-[10px] lg:text-xs font-bold text-[#941C2F] bg-[#941C2F]/10 px-4 py-1.5 rounded-full">
                    {notif.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Aktivitas Asdos</h3>
            <button className="text-xs lg:text-sm font-semibold text-[#941C2F] active:scale-95 transition">
              Lihat Semua
            </button>
          </div>
          <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-md lg:shadow-sm p-4 lg:p-6 space-y-4 lg:space-y-5">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-4 items-start group active:scale-[0.98] transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-colors ${activity.isCheckIn ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                  {activity.isCheckIn ? <MapPin size={20} /> : <LogOut size={20} />}
                </div>
                <div className="flex-1 pb-4 border-b border-slate-100 last:border-none group-last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{activity.name}</h4>
                      <p className="text-[12px] lg:text-xs text-slate-500 font-medium">{activity.subject}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] lg:text-xs font-bold text-slate-400 mb-1">{activity.time}</div>
                      <div className={`text-[11px] lg:text-xs font-extrabold uppercase tracking-wider ${activity.isCheckIn ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {activity.action}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}