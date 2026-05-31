'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { FileText, QrCode, Users, CalendarSync, CalendarDays } from 'lucide-react';
import { getAllSubstitutions } from '@/lib/actions/pergantian-kelas';
import { getAllPresensi } from '@/lib/actions/presensi';
import type { SubstituteSessionDetail } from '@/types/api';
import type { PresensiResponseDTO } from '@/lib/actions/presensi';

export const koordinatorMenuItems = [
  { id: 1, title: 'Data Presensi', icon: FileText, href: '/koordinator/data-presensi', desc: 'Lihat & kelola data presensi' },
  { id: 2, title: 'Generate QR', icon: QrCode, href: '/koordinator/generate-qr', desc: 'Buat kode QR untuk sesi' },
  { id: 3, title: 'Manajemen User', icon: Users, href: '/koordinator/manajemen-user', desc: 'Kelola data asisten dosen' },
  { id: 4, title: 'Manajemen KP', icon: CalendarSync, href: '/koordinator/manajemen-kp', desc: 'Jadwal & data kerja praktik' },
  { id: 5, title: 'Manajemen Jadwal', icon: CalendarDays, href: '/koordinator/manajemen-jadwal', desc: 'Kelola sesi jadwal mengajar' },
];

function getDisplayName(email?: string | null) {
  if (!email) return 'Koordinator';
  const raw = email.split('@')[0] || '';
  const cleaned = raw.replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim();
  if (!cleaned) return 'Koordinator';
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatTime(value?: string) {
  if (!value || value === 'null' || String(value).startsWith('0001')) return '--:--';
  try {
    return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

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

type ActivityEvent = {
  id: string;
  name: string;
  action: string;
  subject: string;
  time: string;
  sort: number;
};

export default function KoordinatorHome() {
  const { markSeen, setPendingCount } = useNotificationStore();
  const user = useUserStore((state) => state.user);
  const [kpItems, setKpItems] = useState<SubstituteSessionDetail[]>([]);
  const [allPresensiItems, setAllPresensiItems] = useState<PresensiResponseDTO[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [kpRes, allPresensiRes] = await Promise.all([
        getAllSubstitutions('PENDING'),
        getAllPresensi(),
      ]);
      const kpData = kpRes.success && kpRes.data?.items ? kpRes.data.items : [];
      const allPresensiData = allPresensiRes.success && allPresensiRes.data ? allPresensiRes.data : [];
      const unverifiedCount = allPresensiData.filter((p) => !p.is_verified).length;
      setKpItems(kpData);
      setAllPresensiItems(allPresensiData);
      setPendingCount(kpData.length + unverifiedCount);
      markSeen();
      setNotifLoaded(true);
    }
    fetchData();
  }, [markSeen, setPendingCount]);

  const unverifiedPresensi = useMemo(
    () =>
      allPresensiItems
        .filter((p) => !p.is_verified)
        .sort((a, b) => new Date(b.waktu_checkin || b.tanggal_mengajar || 0).getTime() - new Date(a.waktu_checkin || a.tanggal_mengajar || 0).getTime())
        .slice(0, 5),
    [allPresensiItems]
  );

  const activities = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    for (const p of allPresensiItems) {
      const isOnline = p.tipe_absensi === 'link';
      const hasCheckout = !!p.waktu_checkout && !String(p.waktu_checkout).startsWith('0001');
      const subject = `${p.nama_mata_kuliah} - ${p.nama_ruangan}`;
      const name = p.nama_asdos || 'Asisten Dosen';

      if (isOnline) {
        events.push({
          id: `${p.id_presensi}-online`,
          name,
          action: 'Online',
          subject,
          time: `${formatTime(p.waktu_checkin)} WIB`,
          sort: new Date(p.waktu_checkin || p.tanggal_mengajar || 0).getTime(),
        });
      } else {
        if (p.waktu_checkin) {
          events.push({
            id: `${p.id_presensi}-in`,
            name,
            action: 'Check-in',
            subject,
            time: `${formatTime(p.waktu_checkin)} WIB`,
            sort: new Date(p.waktu_checkin).getTime(),
          });
        }
        if (hasCheckout) {
          events.push({
            id: `${p.id_presensi}-out`,
            name,
            action: 'Check-out',
            subject,
            time: `${formatTime(p.waktu_checkout)} WIB`,
            sort: new Date(p.waktu_checkout!).getTime(),
          });
        }
      }
    }

    return events.sort((a, b) => b.sort - a.sort).slice(0, 5);
  }, [allPresensiItems]);

  const displayName = getDisplayName(user?.email);

  return (
    <div className="max-w-6xl mx-auto px-1.5 sm:px-2 md:px-0 pb-10 md:pb-12">

      <div className="mb-6 md:mb-8 animate-fade-up">
        <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">
          Dashboard Koordinator
        </p>
        <h1 className="text-[24px] md:text-[30px] font-extrabold text-slate-900 leading-tight">
          Halo, {displayName}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-2xl">
          Pantau pengajuan kelas pengganti dan aktivitas presensi asisten dosen dalam satu ringkasan.
        </p>
      </div>

      <div className="grid grid-cols-5 lg:hidden gap-y-6 gap-x-2 mb-8 w-full animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {koordinatorMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="flex flex-col items-center group">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-crimson group-hover:scale-105 group-active:scale-95 transition-all mb-3">
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 text-center w-14 leading-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Notifikasi Masuk</h3>
          </div>
          <div className="space-y-4">
            {!notifLoaded ? (
              [1, 2].map((i) => (
                <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl animate-pulse flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : kpItems.length === 0 && unverifiedPresensi.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 text-center text-slate-500">
                <p className="text-sm font-semibold">Tidak ada notifikasi masuk</p>
              </div>
            ) : (
              <>
                {kpItems.map((kp) => (
                  <Link
                    key={kp.id}
                    href="/koordinator/manajemen-kp"
                    className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 active:scale-[0.97] transition-all duration-200 flex gap-4 lg:gap-5 items-start block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{kp.substitute_teacher}</h4>
                        <span className="text-[10px] lg:text-xs text-slate-400 font-medium whitespace-nowrap">{timeAgo(kp.created_at)}</span>
                      </div>
                      <p className="text-[12px] lg:text-xs font-semibold text-slate-700 mb-1 truncate">
                        {kp.session?.mata_kuliah}{kp.session?.nama_kelas ? ` — ${kp.session.nama_kelas}` : ''}
                      </p>
                      <p className="text-[12px] lg:text-xs text-slate-500 mb-3 line-clamp-2">
                        {formatShortDate(kp.original_date)} → {formatShortDate(kp.substitute_date)}
                      </p>
                      <span className="inline-block text-[10px] lg:text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                        Menunggu ACC
                      </span>
                    </div>
                  </Link>
                ))}
                {unverifiedPresensi.map((p) => (
                  <Link
                    key={p.id_presensi}
                    href="/koordinator/data-presensi"
                    className="bg-white p-4 lg:p-5 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 active:scale-[0.97] transition-all duration-200 flex gap-4 lg:gap-5 items-start block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate pr-2">{p.nama_asdos}</h4>
                        <span className="text-[10px] lg:text-xs text-slate-400 font-medium whitespace-nowrap">{timeAgo(p.waktu_checkin || p.tanggal_mengajar)}</span>
                      </div>
                      <p className="text-[12px] lg:text-xs font-semibold text-slate-700 mb-1 truncate">
                        {p.nama_mata_kuliah}{p.nama_kelas ? ` — ${p.nama_kelas}` : ''}
                      </p>
                      <p className="text-[12px] lg:text-xs text-slate-500 mb-3 truncate">
                        {p.nama_ruangan} • {formatShortDate(p.tanggal_mengajar)}
                      </p>
                      <span className="inline-block text-[10px] lg:text-xs font-bold text-crimson bg-crimson/5 border border-crimson/10 px-3 py-1.5 rounded-full">
                        Perlu Verifikasi
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Aktivitas Asisten Dosen</h3>
            <Link href="/koordinator/data-presensi" className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
              Lihat Semua
            </Link>
          </div>
          <div className="bg-white rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 p-4 lg:p-6">
            {!notifLoaded ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-20 shrink-0" />
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <p className="text-sm font-semibold">Tidak ada aktivitas presensi terbaru</p>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-5">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 last:border-none last:pb-0">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">{activity.name}</h4>
                      <p className="text-[12px] lg:text-xs text-slate-500 font-medium truncate">{activity.subject}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] lg:text-xs font-bold text-slate-400">{activity.time}</div>
                      <span className="inline-block mt-1 text-[10px] lg:text-xs font-extrabold uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                        {activity.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
