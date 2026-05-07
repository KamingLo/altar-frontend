'use client';
import React from 'react';
import Link from 'next/link';
import {
  MapPin, LogOut, CalendarPlus, Clock,
  Calendar, Monitor, CalendarClock, CheckCircle2, Info,
  TrendingUp
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export const asdosMenuItems = [
  { id: 1, title: 'Check-in', icon: MapPin, href: '/asdos/dashboard/check-in', desc: 'Tandai kehadiran masuk' },
  { id: 2, title: 'Check-out', icon: LogOut, href: '/asdos/dashboard/check-out', desc: 'Tandai kehadiran keluar' },
  { id: 3, title: 'Pengajuan KP', icon: CalendarPlus, href: '/asdos/dashboard/pengajuan-kp', desc: 'Ajukan kerja praktik' },
  { id: 4, title: 'Riwayat Kehadiran', icon: Clock, href: '/asdos/dashboard/riwayat-kehadiran', desc: 'Lihat riwayat presensi' },
  { id: 5, title: 'Jadwal Ajar', icon: Calendar, href: '/asdos/dashboard/jadwal-ajar', desc: 'Lihat jadwal mengajar' },
  { id: 6, title: 'Presensi Kelas Online', icon: Monitor, href: '/asdos/dashboard/presensi-kelas-online', desc: 'Presensi via kelas online' },
];

const schedules = [
  { id: 1, subject: 'Basis Data', session: '07:30 - 10:00', room: 'Ruang 901', day: 'Senin, 11 Nov' },
  { id: 2, subject: 'Backend Dev', session: '12:30 - 15:00', room: 'Ruang 705', day: 'Rabu, 13 Nov' },
];

const feedbacks = [
  {
    id: 1, sender: 'Koordinator Lab', title: 'KP Disetujui',
    detail: 'Pengajuan KP Jarkom untuk Kamis, 14 Nov telah diverifikasi.',
    time: '30 mnt lalu', type: 'success', icon: CheckCircle2,
  },
  {
    id: 2, sender: 'Admin Koordinator', title: 'Revisi Absensi',
    detail: 'Harap perbaiki berita acara sesi 2 Basis Data kemarin.',
    time: '2 jam lalu', type: 'warning', icon: Info,
  },
];

export default function AsdosHome() {
  const { user } = useUserStore();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 animate-fade-up lg:flex lg:justify-between lg:items-end">
        <div>
          <p className="text-sm lg:text-base font-semibold text-[#941C2F] tracking-wide uppercase mb-1">
            Dashboard Asdos
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold lg:font-extrabold text-slate-800 leading-tight">
            Halo, <br className="lg:hidden" />{user?.email.split('@')[0] ?? '—'}
          </h1>
        </div>

        <div className="hidden lg:flex items-center gap-2.5 bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-100 shrink-0">
          <TrendingUp size={15} className="text-[#941C2F]" />
          <span className="text-sm font-semibold text-slate-500">{today}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 lg:hidden gap-y-6 gap-x-3 mb-10 w-full px-1">
        {asdosMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="flex flex-col items-center group">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-[#941C2F] group-hover:scale-105 group-active:scale-95 transition-all mb-3">
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 text-center w-16 leading-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Jadwal Mengajar</h3>
            <button className="text-xs lg:text-sm font-semibold text-[#941C2F] active:scale-95 transition">
              Lihat Semua
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-md lg:shadow-sm p-4 lg:p-5 space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex gap-3 items-start active:scale-[0.97] transition-all duration-200">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 bg-slate-50 text-slate-400 border border-slate-100">
                  <CalendarClock size={18} />
                </div>
                <div className="flex-1 pb-3 border-b border-slate-100 last:border-none">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 leading-tight">{schedule.subject}</h4>
                      <p className="text-[12px] text-slate-500 leading-tight mt-0.5">{schedule.room}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-[#941C2F]">{schedule.day}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{schedule.session}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Umpan Balik Koordinator</h3>
            <button className="text-xs lg:text-sm font-semibold text-[#941C2F] active:scale-95 transition">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {feedbacks.map((notif) => {
              const Icon = notif.icon;
              const isSuccess = notif.type === 'success';
              return (
                <div key={notif.id} className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-md lg:shadow-sm active:scale-[0.97] transition-all duration-200 flex gap-4 lg:gap-5 items-start">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{notif.title}</h4>
                      <span className="text-[10px] lg:text-xs text-slate-400 whitespace-nowrap">{notif.time}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mb-1.5 truncate uppercase tracking-wider">
                      Dari: {notif.sender}
                    </p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-600 leading-relaxed italic">"{notif.detail}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
