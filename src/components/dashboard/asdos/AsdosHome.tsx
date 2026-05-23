'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ScanLine, FileSignature, Monitor, History,
  CalendarDays, CalendarSync, CalendarClock,
  CheckCircle2, Info, Bell, ChevronRight
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllSubstitutions } from '@/lib/actions/pergantian-kelas';
import { getMyPresensi } from '@/lib/actions/presensi';
import type { SubstituteSessionDetail } from '@/types/api';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

export const asdosMenuItems = [
  {
    id: 1,
    title: 'Check-in Kelas',
    icon: ScanLine,
    href: '/asdos/check-in',
    desc: 'Tandai kehadiran masuk',
  },
  {
    id: 2,
    title: 'Check-out Kelas',
    icon: FileSignature,
    href: '/asdos/check-out',
    desc: 'Tandai kehadiran keluar',
  },
  {
    id: 3,
    title: 'Presensi Kelas Online',
    icon: Monitor,
    href: '/asdos/presensi-kelas-online',
    desc: 'Presensi via kelas online',
  },
  {
    id: 4,
    title: 'Riwayat Kehadiran',
    icon: History,
    href: '/asdos/riwayat-kehadiran',
    desc: 'Lihat riwayat presensi',
  },
  {
    id: 5,
    title: 'Jadwal Mengajar',
    icon: CalendarDays,
    href: '/asdos/jadwal-ajar',
    desc: 'Lihat jadwal mengajar',
  },
  {
    id: 6,
    title: 'Kelas Pengganti',
    icon: CalendarSync,
    href: '/asdos/pengajuan-kp',
    desc: 'Ajukan kelas pengganti',
  },
];

const schedules = [
  { id: 1, subject: 'Basis Data', session: '07:30 - 10:00', room: 'Ruang 901', day: 'Senin, 11 Nov' },
  { id: 2, subject: 'Backend Dev', session: '12:30 - 15:00', room: 'Ruang 705', day: 'Rabu, 13 Nov' },
];

const feedbacks = [
  {
    id: 1,
    sender: 'Koordinator Lab',
    title: 'Kelas Pengganti Disetujui',
    detail: 'Pengajuan kelas pengganti Jarkom untuk Kamis, 14 Nov telah diverifikasi.',
    time: '30 mnt lalu',
    type: 'success',
    icon: CheckCircle2,
  },
  {
    id: 2,
    sender: 'Admin Koordinator',
    title: 'Revisi Absensi',
    detail: 'Harap perbaiki berita acara sesi 2 Basis Data kemarin.',
    time: '2 jam lalu',
    type: 'warning',
    icon: Info,
  },
];

export default function AsdosHome() {
  const { markSeen, setPendingCount } = useNotificationStore();
  const [kpItem, setKpItem] = useState<SubstituteSessionDetail | null>(null);
  const [presensiItem, setPresensiItem] = useState<PresensiResponseDTO | null>(null);
  const [notifLoaded, setNotifLoaded] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      const today = new Date().toISOString().split('T')[0];
      const { lastSeenKpId, lastSeenPresensiId, setLastSeenKpId, setLastSeenPresensiId } = useNotificationStore.getState();

      const [kpRes, presensiRes] = await Promise.all([
        getAllSubstitutions(),
        getMyPresensi(),
      ]);

      // Most recent VERIFIED/REJECTED KP â€” no time cutoff, use ID comparison instead
      const recentKp = (kpRes.success && kpRes.data?.items ? kpRes.data.items : [])
        .filter(item => item.status === 'VERIFIED' || item.status === 'REJECTED')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;

      // Only show if it's a KP the user hasn't acknowledged yet
      const kpToShow = recentKp && recentKp.id !== lastSeenKpId ? recentKp : null;

      const verifiedToday = (presensiRes.success && presensiRes.data ? presensiRes.data : [])
        .filter(p => p.is_verified && String(p.tanggal_mengajar).split('T')[0] === today)[0] ?? null;

      const presensiToShow = verifiedToday && verifiedToday.id_presensi !== lastSeenPresensiId ? verifiedToday : null;

      setKpItem(kpToShow);
      setPresensiItem(presensiToShow);
      setPendingCount((kpToShow ? 1 : 0) + (presensiToShow ? 1 : 0));

      // Mark these as acknowledged so they don't reappear next visit
      if (recentKp) setLastSeenKpId(recentKp.id);
      if (verifiedToday) setLastSeenPresensiId(verifiedToday.id_presensi);

      markSeen();
      setNotifLoaded(true);
    }
    fetchNotifications();
  }, [markSeen, setPendingCount]);

  return (
    <div className="max-w-6xl mx-auto">

      <div className="mb-8 animate-fade-up lg:flex lg:justify-between lg:items-end">
        <div>
          <p className="text-sm lg:text-base font-semibold text-crimson tracking-wide uppercase mb-1">
            Dashboard Asdos
          </p>
        </div>
      </div>

      {notifLoaded && (kpItem || presensiItem) && (
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="relative">
              <Bell size={16} className="text-crimson" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-crimson" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Notifikasi</h3>
          </div>
          <div className="space-y-3">
            {kpItem && (
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpItem.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {kpItem.status === 'VERIFIED' ? 'Pengajuan KP Disetujui' : 'Pengajuan KP Ditolak'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    Kelas pengganti{kpItem.session?.mata_kuliah ? ` ${kpItem.session.mata_kuliah}` : ''}{kpItem.session?.nama_kelas ? ` ${kpItem.session.nama_kelas}` : ''} telah {kpItem.status === 'VERIFIED' ? 'disetujui' : 'ditolak'} koordinator
                  </p>
                </div>
              </div>
            )}
            {presensiItem && (
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <CalendarSync size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">Presensi Telah Diverifikasi</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    Kehadiran {presensiItem.nama_mata_kuliah} {presensiItem.nama_kelas} telah diverifikasi oleh koordinator
                  </p>
                </div>
                <Link href="/asdos/riwayat-kehadiran" className="flex items-center gap-1 text-xs font-bold text-crimson shrink-0 hover:underline">
                  Selengkapnya <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 lg:hidden gap-y-6 gap-x-3 mb-10 w-full px-1">
        {asdosMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="flex flex-col items-center group">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-crimson group-hover:scale-105 group-active:scale-95 transition-all mb-3">
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
            <button className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
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
                      <div className="text-[11px] font-bold text-crimson">{schedule.day}</div>
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
            <button className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
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
                      <p className="text-[11px] text-slate-600 leading-relaxed italic">{'"'}{notif.detail}{'"'}</p>
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
