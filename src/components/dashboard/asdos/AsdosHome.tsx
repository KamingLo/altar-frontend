'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ScanLine,
  FileSignature,
  Monitor,
  History,
  CalendarDays,
  CalendarSync,
  CheckCircle2,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { getSessionsByDate, type SessionFromAPI } from '@/lib/actions/jadwal';
import { getMySubstitutions } from '@/lib/actions/pergantian-kelas';
import { getMyPresensi, type PresensiResponseDTO } from '@/lib/actions/presensi';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import type { SubstituteSessionDetail } from '@/types/api';

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

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatShortDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function getScheduleTypeLabel(schedule: SessionFromAPI) {
  const type = schedule.tipe_jadwal === 'PENGGANTI' ? 'PENGGANTI' : 'REGULER';
  if (type !== 'REGULER') return type;

  const match = schedule.waktu.match(/(\d{1,2})[:.]/);
  if (!match) return 'REGULER';

  const hour = Number(match[1]);
  if (Number.isNaN(hour)) return 'REGULER';
  return hour < 12 ? 'REGULER PAGI' : 'REGULER SORE';
}

function getDisplayName(email?: string | null) {
  if (!email) return 'Asisten Dosen';

  const raw = email.split('@')[0] || '';
  const cleaned = raw
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  if (!cleaned) return 'Asisten Dosen';

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function hasMeaningfulText(value?: string | null) {
  const text = String(value ?? '').trim();
  return text !== '' && text !== '-';
}

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  badge: string;
  tone: 'emerald' | 'blue';
};

type PresensiActivityItem = {
  id: string;
  nama_mata_kuliah: string;
  nama_kelas: string;
  nama_ruangan: string;
  tanggal_mengajar: string;
  isVerified: boolean;
  isPaid: boolean;
};

function AsdosHomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-1.5 sm:px-2 md:px-0 pb-10 md:pb-12">
      <div className="mb-6 md:mb-8 space-y-2.5">
        <div className="h-3 w-32 rounded-lg animate-shimmer" />
        <div className="h-8 w-48 rounded-xl animate-shimmer" />
        <div className="h-4 w-full max-w-xl rounded-lg animate-shimmer" />
      </div>

      <div className="grid grid-cols-4 lg:hidden gap-y-6 gap-x-3 mb-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full animate-shimmer" />
            <div className="h-3 w-14 rounded-lg animate-shimmer" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-8">
        <section className="lg:row-span-2">
          <div className="flex items-center justify-between mb-4 lg:mb-6 px-1">
            <div className="h-6 w-36 rounded-xl animate-shimmer" />
            <div className="h-4 w-20 rounded-lg animate-shimmer" />
          </div>
          <div className="bg-white rounded-2xl p-4 lg:p-5 space-y-4 border border-slate-100 lg:min-h-[430px]">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
                <div className="flex justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-44 rounded-lg animate-shimmer" />
                    <div className="h-3.5 w-28 rounded-lg animate-shimmer" />
                  </div>
                  <div className="h-6 w-20 rounded-full animate-shimmer" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-4 w-24 rounded-lg animate-shimmer" />
                  <div className="h-4 w-24 rounded-lg animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {Array.from({ length: 2 }, (_, section) => (
          <section key={section}>
            <div className="flex items-center justify-between mb-4 lg:mb-6 px-1">
              <div className="h-6 w-44 rounded-xl animate-shimmer" />
              <div className="h-4 w-20 rounded-lg animate-shimmer" />
            </div>
            <div className="bg-white rounded-2xl p-4 lg:p-5 space-y-3 border border-slate-100">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="h-4 w-2/3 rounded-lg animate-shimmer" />
                  <div className="h-3.5 w-1/2 rounded-lg animate-shimmer" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function AsdosHome() {
  const { markSeen, setPendingCount } = useNotificationStore();
  const user = useUserStore((state) => state.user);
  const [sessionsToday, setSessionsToday] = useState<SessionFromAPI[]>([]);
  const [presensiItems, setPresensiItems] = useState<PresensiResponseDTO[]>([]);
  const [kpItems, setKpItems] = useState<SubstituteSessionDetail[]>([]);
  const [kpItem, setKpItem] = useState<SubstituteSessionDetail | null>(null);
  const [presensiItem, setPresensiItem] = useState<PresensiResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const date = todayISO();
        const { lastSeenKpId, lastSeenPresensiId, setLastSeenKpId, setLastSeenPresensiId } = useNotificationStore.getState();

        const [scheduleRes, kpRes, presensiRes] = await Promise.all([
          getSessionsByDate(date),
          getMySubstitutions(),
          getMyPresensi(),
        ]);

        const schedules = scheduleRes.success && scheduleRes.data ? scheduleRes.data : [];
        const substitutions = kpRes.success && kpRes.data?.items ? kpRes.data.items : [];
        const presensi = presensiRes.success && presensiRes.data ? presensiRes.data : [];

        const recentKp = substitutions
          .filter((item) => item.status === 'VERIFIED' || item.status === 'REJECTED')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;

        const kpToShow = recentKp && recentKp.id !== lastSeenKpId ? recentKp : null;

        const verifiedToday = presensi
          .filter((p) => p.is_verified && String(p.tanggal_mengajar).split('T')[0] === date)
          .sort((a, b) => new Date(b.waktu_checkin || b.tanggal_mengajar).getTime() - new Date(a.waktu_checkin || a.tanggal_mengajar).getTime())[0] ?? null;

        const presensiToShow = verifiedToday && verifiedToday.id_presensi !== lastSeenPresensiId ? verifiedToday : null;

        setSessionsToday(schedules);
        setKpItems(substitutions);
        setPresensiItems(presensi);
        setKpItem(kpToShow);
        setPresensiItem(presensiToShow);
        setPendingCount((kpToShow ? 1 : 0) + (presensiToShow ? 1 : 0));

        if (recentKp) setLastSeenKpId(recentKp.id);
        if (verifiedToday) setLastSeenPresensiId(verifiedToday.id_presensi);

        markSeen();
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, [markSeen, setPendingCount]);

  const displayName = getDisplayName(user?.email);

  const presensiActivities = useMemo<PresensiActivityItem[]>(() => {
    return [...presensiItems]
      .filter((item) => hasMeaningfulText(item.nama_mata_kuliah) || hasMeaningfulText(item.nama_kelas))
      .sort((a, b) => new Date(b.waktu_checkin || b.tanggal_mengajar).getTime() - new Date(a.waktu_checkin || a.tanggal_mengajar).getTime())
      .map((item) => ({
        id: item.id_presensi,
        nama_mata_kuliah: item.nama_mata_kuliah,
        nama_kelas: item.nama_kelas,
        nama_ruangan: item.nama_ruangan,
        tanggal_mengajar: item.tanggal_mengajar,
        isVerified: item.is_verified,
        isPaid: item.is_paid,
      }));
  }, [presensiItems]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const item of presensiActivities) {
      const subject = item.nama_mata_kuliah;
      const context = `${item.nama_kelas} - ${item.nama_ruangan}`;

      if (item.isVerified) {
        items.push({
          id: `${item.id}-verified`,
          title: 'Kehadiran telah diverifikasi',
          detail: `${subject} • ${context}`,
          date: item.tanggal_mengajar,
          badge: 'Terverifikasi',
          tone: 'emerald',
        });
      }

      if (item.isPaid) {
        items.push({
          id: `${item.id}-paid`,
          title: 'Pembayaran sudah masuk',
          detail: `${subject} • ${context}`,
          date: item.tanggal_mengajar,
          badge: 'Dibayar',
          tone: 'blue',
        });
      }
    }

    return items.slice(0, 3);
  }, [presensiActivities]);

  const activityRows = activityItems.slice(0, 3);

  const recentKpItems = useMemo(() => {
    return [...kpItems]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  }, [kpItems]);

  if (isLoading) {
    return <AsdosHomeSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-1.5 sm:px-2 md:px-0 pb-10 md:pb-12">
      <div className="mb-6 md:mb-8 animate-fade-up">
        <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">
          Dashboard Asdos
        </p>
        <h1 className="text-[24px] md:text-[30px] font-extrabold text-slate-900 leading-tight">
          Halo, {displayName}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-2xl">
          Pantau jadwal mengajar, status presensi, dan pengajuan kelas pengganti dalam satu ringkasan.
        </p>
      </div>

      {(kpItem || presensiItem) && (
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
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4 border border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpItem.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {kpItem.status === 'VERIFIED' ? 'Pengajuan KP Disetujui' : 'Pengajuan KP Ditolak'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {kpItem.session?.mata_kuliah ?? 'Kelas pengganti'} {kpItem.session?.nama_kelas ?? ''} telah {kpItem.status === 'VERIFIED' ? 'disetujui' : 'ditolak'} koordinator
                  </p>
                </div>
                <Link href="/asdos/pengajuan-kp" className="hidden sm:flex items-center gap-1 text-xs font-bold text-crimson shrink-0 hover:underline">
                  Detail <ChevronRight size={13} />
                </Link>
              </div>
            )}
            {presensiItem && (
              <div className="bg-white p-4 rounded-2xl shadow-md lg:shadow-sm flex items-center gap-4 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <CalendarSync size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">Presensi Telah Diverifikasi</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    Kehadiran {presensiItem.nama_mata_kuliah} {presensiItem.nama_kelas} telah diverifikasi koordinator
                  </p>
                </div>
                <Link href="/asdos/riwayat-kehadiran" className="hidden sm:flex items-center gap-1 text-xs font-bold text-crimson shrink-0 hover:underline">
                  Detail <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 lg:hidden gap-y-6 gap-x-3 mb-8 w-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-8 lg:gap-8">
        <div className="animate-fade-up lg:row-span-2" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Jadwal Hari Ini</h3>
            <Link href="/asdos/jadwal-ajar" className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
              Lihat Semua
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md lg:shadow-sm p-4 lg:p-5 space-y-4 border border-slate-100 lg:min-h-[430px]">
            {sessionsToday.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-slate-400">Tidak ada jadwal hari ini</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Gunakan waktu ini untuk cek riwayat atau pengajuan KP.</p>
              </div>
            ) : (
              sessionsToday.map((schedule) => (
                <div key={`${schedule.id_sesi}-${schedule.waktu}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:shadow-sm">
                  <div className="flex justify-between gap-3 items-start">
                    <div className="min-w-0">
                      <h4 className="text-sm lg:text-base font-extrabold text-slate-800 leading-tight truncate">{schedule.mata_kuliah}</h4>
                      <p className="text-xs text-slate-500 leading-tight mt-1 truncate">
                        {schedule.nama_kelas}
                      </p>
                    </div>
                    <span className="rounded-full bg-crimson/5 px-3 py-1 text-[10px] font-extrabold text-crimson shrink-0">
                      {getScheduleTypeLabel(schedule)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                    <p>
                      <span className="font-bold text-slate-400">Waktu: </span>
                      <span className="font-semibold">{schedule.waktu}</span>
                    </p>
                    <p className="truncate">
                      <span className="font-bold text-slate-400">Ruangan: </span>
                      <span className="font-semibold">{schedule.ruangan}</span>
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href="/asdos/check-in" className="inline-flex items-center justify-center rounded-xl bg-crimson px-4 py-2 text-xs font-bold text-white shadow-sm shadow-crimson/20 active:scale-[0.98]">
                      Check-in
                    </Link>
                    <Link href="/asdos/check-out" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 active:scale-[0.98]">
                      Check-out
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Aktivitas Terbaru</h3>
            <Link href="/asdos/riwayat-kehadiran" className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
              Lihat Semua
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md lg:shadow-sm border border-slate-100 p-4 lg:p-5 space-y-3">
            {activityRows.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <p className="text-sm font-semibold">Belum ada aktivitas terbaru</p>
                <p className="text-xs font-medium mt-1">Verifikasi kehadiran atau pembayaran akan muncul di sini.</p>
              </div>
            ) : (
              activityRows.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:shadow-sm">
                  <div className="flex justify-between items-start mb-1 gap-3">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                    <span className="text-[10px] lg:text-xs text-slate-400 whitespace-nowrap">
                      {formatShortDate(item.date)}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mb-2 truncate uppercase tracking-wider">
                    {item.detail}
                  </p>
                  <span className={`inline-block text-[10px] lg:text-xs font-bold px-3 py-1.5 rounded-full ${item.tone === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}>
                    {item.badge}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-4 lg:mb-6 px-1">
            <h3 className="font-bold text-lg lg:text-xl text-slate-800">Status Kelas Pengganti</h3>
            <Link href="/asdos/pengajuan-kp" className="text-xs lg:text-sm font-semibold text-crimson active:scale-95 transition">
              Lihat Semua
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md lg:shadow-sm border border-slate-100 p-4 lg:p-5 space-y-3">
            {recentKpItems.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <p className="text-sm font-semibold">Belum ada pengajuan kelas pengganti</p>
              </div>
            ) : (
              recentKpItems.map((item) => {
                const isVerified = item.status === 'VERIFIED';
                const isRejected = item.status === 'REJECTED';
                const badgeClass = isVerified
                  ? 'text-emerald-600 bg-emerald-50'
                  : isRejected
                    ? 'text-red-600 bg-red-50'
                    : 'text-amber-600 bg-amber-50';

                return (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all duration-200 hover:bg-white hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {item.session?.mata_kuliah ?? 'Kelas Pengganti'}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full shrink-0 ${badgeClass}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {item.session?.nama_kelas ?? item.substitute_teacher}
                    </p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                      <p>
                        <span className="font-bold text-slate-400">Pengganti: </span>
                        <span>{formatShortDate(item.substitute_date)}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-400">Waktu: </span>
                        <span>{item.time_slot || item.session?.waktu || '-'}</span>
                      </p>
                      <p className="truncate">
                        <span className="font-bold text-slate-400">Ruang: </span>
                        <span>{item.room || item.session?.ruangan || '-'}</span>
                      </p>
                    </div>
                    {isRejected && item.coordinator_reason && (
                      <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                        <p className="text-[11px] font-bold text-red-600 mb-0.5">Alasan ditolak</p>
                        <p className="text-xs text-red-500 line-clamp-2">{item.coordinator_reason}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
