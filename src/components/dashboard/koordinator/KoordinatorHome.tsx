'use client';
import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import Link from 'next/link';
import {
  FileText, QrCode, Users, CalendarSync,
  MapPin, LogOut, ChevronRight, Clock, CheckCircle2,
  CalendarDays, Bell
} from 'lucide-react';
import { getAllSubstitutions } from '@/lib/actions/pergantian-kelas';
import { getAllPresensi } from '@/lib/actions/presensi';
import type { SubstituteSessionDetail } from '@/types/api';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

export const koordinatorMenuItems = [
  { id: 1, title: 'Data Presensi', icon: FileText, href: '/koordinator/data-presensi', desc: 'Lihat & kelola data presensi' },
  { id: 2, title: 'Generate QR', icon: QrCode, href: '/koordinator/generate-qr', desc: 'Buat kode QR untuk sesi' },
  { id: 3, title: 'Manajemen User', icon: Users, href: '/koordinator/manajemen-user', desc: 'Kelola data asisten dosen' },
  { id: 4, title: 'Manajemen KP', icon: CalendarSync, href: '/koordinator/manajemen-kp', desc: 'Jadwal & data kerja praktik' },
  // { id: 5, title: 'Data Master', icon: Database, href: '/koordinator/data-master', desc: 'Kelola kelas, MK, ruangan, semester' },
  { id: 5, title: 'Manajemen Jadwal', icon: CalendarDays, href: '/koordinator/manajemen-jadwal', desc: 'Kelola sesi jadwal mengajar' },
];

const desktopStats = [
  { id: 1, label: 'Total Asdos', value: '24', sub: '+2 bulan ini', icon: Users, positive: true },
  { id: 2, label: 'Presensi Hari Ini', value: '18', sub: '75% hadir', icon: CheckCircle2, positive: true },
  { id: 3, label: 'Menunggu ACC', value: '2', sub: 'Perlu persetujuan', icon: Clock, positive: false },
];


const activities = [
  { id: 1, name: 'Bima Sakti', action: 'Check-in', subject: 'Basis Data - Ruang M305', time: '08:00 WIB', isCheckIn: true },
  { id: 2, name: 'Kevin Wijaya', action: 'Check-out', subject: 'Algoritma', time: '10:30 WIB', isCheckIn: false },
  { id: 3, name: 'Alya Rahma', action: 'Check-in', subject: 'Pemrograman Web - Ruang M402', time: '11:15 WIB', isCheckIn: true },
];

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hr lalu`;
}

function formatShortDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

export default function KoordinatorHome() {
  const { markSeen, setPendingCount } = useNotificationStore();
  const [kpItem, setKpItem] = useState<SubstituteSessionDetail | null>(null);
  const [kpItems, setKpItems] = useState<SubstituteSessionDetail[]>([]);
  const [presensiItem, setPresensiItem] = useState<PresensiResponseDTO | null>(null);
  const [notifLoaded, setNotifLoaded] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      const [kpRes, presensiRes] = await Promise.all([
        getAllSubstitutions('PENDING'),
        getAllPresensi(false),
      ]);
      const kpData = kpRes.success && kpRes.data?.items ? kpRes.data.items : [];
      const presensiItems = presensiRes.success && presensiRes.data ? presensiRes.data : [];
      setKpItems(kpData);
      setKpItem(kpData[0] ?? null);
      setPresensiItem(presensiItems[0] ?? null);
      setPendingCount(kpData.length + presensiItems.length);
      markSeen();
      setNotifLoaded(true);
    }
    fetchNotifications();
  }, [markSeen, setPendingCount]);

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 animate-fade-up lg:flex lg:justify-between lg:items-end">
        <div>
          <p className="text-sm lg:text-base font-semibold text-[#941C2F] tracking-wide uppercase mb-1">
            Dashboard Koordinator
          </p>
        </div>
      </div>

      {notifLoaded && (kpItem || presensiItem) && (
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="relative">
              <Bell size={16} className="text-[#941C2F]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#941C2F]" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Notifikasi</h3>
          </div>
          <div className="space-y-3">
            {kpItem && (
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                  <CalendarSync size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">Pengajuan KP Baru</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {kpItem.substitute_teacher} mengajukan kelas pengganti{kpItem.session?.mata_kuliah ? ` ${kpItem.session.mata_kuliah}` : ''}{kpItem.session?.nama_kelas ? ` ${kpItem.session.nama_kelas}` : ''}
                  </p>
                </div>
                <Link href="/koordinator/manajemen-kp" className="flex items-center gap-1 text-xs font-bold text-[#941C2F] shrink-0 hover:underline">
                  Selengkapnya <ChevronRight size={13} />
                </Link>
              </div>
            )}
            {presensiItem && (
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">Presensi Menunggu Verifikasi</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {presensiItem.nama_asdos} check-in {presensiItem.nama_mata_kuliah} {presensiItem.nama_kelas} dan menunggu verifikasi
                  </p>
                </div>
                <Link href="/koordinator/data-presensi" className="flex items-center gap-1 text-xs font-bold text-[#941C2F] shrink-0 hover:underline">
                  Selengkapnya <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

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
            <Link href="/koordinator/manajemen-kp" className="text-xs lg:text-sm font-semibold text-[#941C2F] active:scale-95 transition">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {!notifLoaded ? (
              [1, 2].map(i => (
                <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl animate-pulse flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : kpItems.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl lg:rounded-3xl shadow-md lg:shadow-sm text-center text-slate-400">
                <CalendarSync size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Tidak ada pengajuan kelas pengganti pending</p>
              </div>
            ) : (
              kpItems.map((kp) => (
                <div
                  key={kp.id}
                  className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-md lg:shadow-sm active:scale-[0.97] transition-all duration-200 flex gap-4 lg:gap-5 items-start"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#941C2F]/5 flex items-center justify-center text-[#941C2F] shrink-0">
                    <CalendarSync size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{kp.substitute_teacher}</h4>
                      <span className="text-[10px] lg:text-xs text-slate-400 font-medium whitespace-nowrap">{timeAgo(kp.created_at)}</span>
                    </div>
                    <p className="text-[12px] lg:text-xs font-semibold text-[#941C2F] mb-1 truncate">
                      {kp.session?.mata_kuliah}{kp.session?.nama_kelas ? ` — ${kp.session.nama_kelas}` : ''}
                    </p>
                    <p className="text-[12px] lg:text-xs text-slate-500 mb-3 line-clamp-2">
                      {formatShortDate(kp.original_date)} → {formatShortDate(kp.substitute_date)}
                    </p>
                    <span className="inline-block text-[10px] lg:text-xs font-bold text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full">
                      Menunggu ACC
                    </span>
                  </div>
                </div>
              ))
            )}
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