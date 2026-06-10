'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, Filter, Clock, MapPin, BookOpen, Info, Table2, LayoutList, Check, AlertCircle } from 'lucide-react';
import { getMyPresensi, type PresensiResponseDTO } from '@/lib/actions/presensi';
import { getSessionsByDate } from '@/lib/actions/jadwal';
import { AsdosPageHeader, AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { useRiwayatKehadiranStore } from '@/store/useRiwayatKehadiranStore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { pengajarDisplayName, subjectDisplayName, parseUTC } from '@/lib/jadwal-utils';
import { isOnlinePresensi } from '@/lib/presensi-mode';

type ViewType = 'CARD' | 'TABLE';

type HistoryItem = {
  id: string; subject: string; date: string; rawDate: string;
  checkIn: string; checkOut: string; room: string; className: string; teachingTeam: string;
  status: 'BERJALAN' | 'SELESAI'; materi: string;
  isVerified: boolean; isPaid: boolean;
  isOnline: boolean; linkVideo: string;
  forgotCheckout?: boolean;
  isLate?: boolean;
  waktuCheckInRaw?: string;
};

type TeachingSessionInfo = {
  teachingTeam: string;
  isPengganti: boolean;
  waktuMulai?: string;
  waktuSelesai?: string;
};

function isActivePresensi(item: PresensiResponseDTO) {
  const checkout = item.waktu_checkout;
  const hasNoCheckout = !checkout || checkout === '' || checkout === 'null' || String(checkout).startsWith('0001');
  if (!hasNoCheckout) return false;

  const sessionDate = new Date(item.tanggal_mengajar);
  const today = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return sessionDay >= todayDay;
}

function formatDate(value: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateCompact(value: string) {
  if (!value || value === 'null' || value.startsWith('0001')) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(value?: string) {
  if (!value || value === 'null' || String(value).startsWith('0001')) return '--:--';
  return parseUTC(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatTeachingTeam(item: PresensiResponseDTO) {
  const team = item.nama_asdos_rekan ? `${item.nama_asdos} & ${item.nama_asdos_rekan}` : item.nama_asdos;
  return pengajarDisplayName(team);
}

function getHistoryDateKey(item: PresensiResponseDTO) {
  return String(item.tanggal_mengajar || item.waktu_checkin || '').split('T')[0];
}

function getTeachingLookupKey(date: string, sessionId?: string) {
  return sessionId ? `${date}-${sessionId}` : '';
}

function getAutoCheckOutTimeStr(tanggalMengajar: string, waktuSelesai?: string): string | null {
  if (!waktuSelesai) return null;
  const [endH, endM] = waktuSelesai.split(':').map(Number);
  if (isNaN(endH) || isNaN(endM)) return null;

  const baseDate = new Date(tanggalMengajar);
  const deadline = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    endH,
    endM + 30,
    0,
    0
  );

  return deadline.toISOString();
}

function mapPresensiToHistory(item: PresensiResponseDTO, teachingInfoBySession: Record<string, TeachingSessionInfo>): HistoryItem {
  const active = isActivePresensi(item);
  const dateKey = getHistoryDateKey(item);
  const teachingInfo =
    teachingInfoBySession[getTeachingLookupKey(dateKey, item.id_sesi_pengganti)] ||
    teachingInfoBySession[getTeachingLookupKey(dateKey, item.id_sesi)];
  const teachingTeam = teachingInfo?.teachingTeam || formatTeachingTeam(item);
  const isPengganti = item.menggantikan || !!item.id_sesi_pengganti || !!teachingInfo?.isPengganti;

  const forgotCheckout = (() => {
    const hasValidCheckout = item.waktu_checkout && item.waktu_checkout !== '' && item.waktu_checkout !== 'null' && !String(item.waktu_checkout).startsWith('0001');
    if (hasValidCheckout) return false;
    if (isOnlinePresensi(item)) return false;
    if (active) return false;

    if (teachingInfo?.waktuSelesai) {
      const autoTime = getAutoCheckOutTimeStr(item.tanggal_mengajar || item.waktu_checkin, teachingInfo.waktuSelesai);
      if (autoTime && new Date() > new Date(autoTime)) {
        return true;
      }
    }
    return false;
  })();

  const isLate = (() => {
    if (!item.waktu_checkin || !teachingInfo?.waktuMulai) return false;
    const [startH, startM] = teachingInfo.waktuMulai.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) return false;
    const checkin = new Date(item.waktu_checkin);
    if (isNaN(checkin.getTime())) return false;
    return checkin.getHours() * 60 + checkin.getMinutes() > startH * 60 + startM;
  })();

  return {
    id: item.id_presensi,
    subject: subjectDisplayName(item.nama_mata_kuliah, isPengganti),
    date: formatDate(item.tanggal_mengajar || item.waktu_checkin),
    rawDate: item.tanggal_mengajar || item.waktu_checkin || '',
    checkIn: formatTime(item.waktu_checkin),
    checkOut: (() => {
      if (active) return '--:--';
      const hasValidCheckout = item.waktu_checkout && item.waktu_checkout !== '' && item.waktu_checkout !== 'null' && !String(item.waktu_checkout).startsWith('0001');
      if (hasValidCheckout) return formatTime(item.waktu_checkout);
      if (isOnlinePresensi(item)) return teachingInfo?.waktuSelesai ?? '--:--';

      if (teachingInfo?.waktuSelesai) {
        const autoTime = getAutoCheckOutTimeStr(item.tanggal_mengajar || item.waktu_checkin, teachingInfo.waktuSelesai);
        if (autoTime && new Date() > new Date(autoTime)) {
          return formatTime(autoTime);
        }
      }

      return '--:--';
    })(),
    room: item.nama_ruangan,
    className: item.nama_kelas || '-',
    teachingTeam,
    status: active ? 'BERJALAN' : 'SELESAI',
    materi: item.deskripsi_materi || (active ? 'Sesi sedang berlangsung. Materi belum diisi.' : '-'),
    isVerified: item.is_verified,
    isPaid: item.is_paid,
    isOnline: isOnlinePresensi(item),
    linkVideo: item.link_video || '',
    forgotCheckout,
    isLate,
    waktuCheckInRaw: item.waktu_checkin,
  };
}

export default function RiwayatKehadiranPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BERJALAN' | 'SELESAI'>('ALL');
  const [viewType, setViewType] = useState<ViewType>('CARD');
  const {
    items,
    fetched,
    visibleCount,
    isLoading,
    error,
    setItems,
    setLoading,
    setError,
    showMore,
    resetVisible,
  } = useRiwayatKehadiranStore();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [teachingInfoBySession, setTeachingInfoBySession] = useState<Record<string, TeachingSessionInfo>>({});
  const fetchedDatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      if (fetched) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await getMyPresensi();
      if (cancelled) return;
      if (res.success) {
        setItems(res.data ?? []);
      } else {
        setError(res.message || 'Gagal memuat riwayat kehadiran.');
      }
      setLoading(false);
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [fetched, setError, setItems, setLoading]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTeachingTeams() {
      const allDates = Array.from(new Set(items.map(getHistoryDateKey).filter(Boolean)));
      const dates = allDates.filter(d => !fetchedDatesRef.current.has(d));
      if (dates.length === 0) return;

      const lookup: Record<string, TeachingSessionInfo> = {};
      for (let i = 0; i < dates.length; i += 5) {
        if (cancelled) return;
        const batch = dates.slice(i, i + 5);
        const batchResults = await Promise.all(batch.map(async date => {
          const res = await getSessionsByDate(date);
          return { date, sessions: res.success ? res.data ?? [] : [] };
        }));
        if (cancelled) return;
        batchResults.forEach(({ date, sessions }) => {
          fetchedDatesRef.current.add(date);
          sessions.forEach(session => {
            if (session.pengajar) {
              const timePart = session.waktu.split(', ').pop();
              const waktuMulai = timePart?.split(' - ')[0]?.trim();
              const waktuSelesai = timePart?.split(' - ')[1]?.trim();
              lookup[getTeachingLookupKey(date, session.id_sesi)] = {
                teachingTeam: pengajarDisplayName(session.pengajar),
                isPengganti: session.tipe_jadwal === 'PENGGANTI',
                waktuMulai,
                waktuSelesai,
              };
            }
          });
        });
      }
      setTeachingInfoBySession(prev => ({ ...prev, ...lookup }));
    }

    fetchTeachingTeams();
    return () => { cancelled = true; };
  }, [items]);

  useEffect(() => {
    resetVisible();
  }, [searchTerm, filterStatus, resetVisible]);

  const history = items
    .map(item => mapPresensiToHistory(item, teachingInfoBySession))
    .sort((a, b) => {
      const dateStrA = a.rawDate.split('T')[0];
      const dateStrB = b.rawDate.split('T')[0];
      if (dateStrA !== dateStrB) {
        return dateStrB.localeCompare(dateStrA);
      }
      const timeA = a.waktuCheckInRaw ? new Date(a.waktuCheckInRaw).getTime() : 0;
      const timeB = b.waktuCheckInRaw ? new Date(b.waktuCheckInRaw).getTime() : 0;
      return timeA - timeB;
    });
  const filtered = history.filter(item =>
    (item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teachingTeam.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'ALL' || item.status === filterStatus)
  );
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = displayed.length < filtered.length;

  return (
    <AsdosPageShell>

      <AsdosPageHeader
        eyebrow="Rekap Mengajar"
        title="Riwayat Kehadiran"
        description="Log aktivitas mengajar Anda."
        action={
          <div className="flex gap-3 relative z-20 w-full md:w-auto md:min-w-[380px] items-center">
            <div className="flex bg-slate-100 p-0.5 rounded-[14px] md:rounded-xl shrink-0">
              {([
                { type: 'CARD' as ViewType, icon: <LayoutList size={15} />, label: 'Kartu' },
                { type: 'TABLE' as ViewType, icon: <Table2 size={15} />, label: 'Tabel' },
              ]).map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`h-[46px] md:h-[38px] w-[46px] md:w-auto md:flex md:items-center md:gap-1.5 md:px-3 flex items-center justify-center rounded-[11px] md:rounded-[9px] text-xs font-semibold transition-all ${
                    viewType === type ? 'bg-white text-crimson shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-[18px] h-[18px] md:w-5 md:h-5" />
              </div>
              <input type="text" placeholder="Cari materi atau kelas..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm md:text-base rounded-2xl md:rounded-3xl pl-11 md:pl-14 pr-4 py-3.5 md:py-4 focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]" />
            </div>
            <div className="hidden md:block">
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as 'ALL' | 'BERJALAN' | 'SELESAI')}
                options={[
                  { value: 'ALL', label: 'Semua Status' },
                  { value: 'BERJALAN', label: 'Sedang Berjalan' },
                  { value: 'SELESAI', label: 'Selesai' },
                ]}
                variant="icon"
                icon={<Filter className="w-5 h-5" />}
                align="right"
                triggerClassName={filterStatus !== 'ALL' ? 'bg-red-50 border-crimson text-crimson' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
              />
            </div>

          </div>
        }
      />


      <div className="flex flex-col gap-6 w-full pb-8">
        {isLoading ? (
          viewType === 'TABLE' ? (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      {['No', 'Mata Kuliah', 'Kelas', 'Asisten Dosen', 'Ruangan', 'Tanggal', 'Check-In', 'Check-Out', 'Bahasan Materi', 'Verifikasi', 'Dibayar'].map(col => (
                        <th key={col} className="px-4 py-3 text-left">
                          <div className="h-2.5 bg-slate-100 rounded animate-pulse w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(8)].map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-4" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-32" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-16" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-28" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-16" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-24" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-12" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-12" /></td>
                        <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-28" /></td>
                        <td className="px-4 py-3"><div className="h-5 w-5 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                        <td className="px-4 py-3"><div className="h-5 w-5 bg-slate-100 rounded animate-pulse mx-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 w-full animate-pulse">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex flex-col gap-3 w-full md:w-1/3">
                  <div className="h-6 md:h-8 w-3/4 rounded-lg bg-slate-100" />
                  <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                </div>
                <div className="flex flex-row gap-6 md:gap-8 w-full md:w-auto">
                  <div className="border-l-2 border-slate-100 pl-4 space-y-2">
                    <div className="h-3 w-14 rounded bg-slate-100" />
                    <div className="h-4 w-24 rounded bg-slate-100" />
                  </div>
                  <div className="border-l-2 border-slate-100 pl-4 space-y-2">
                    <div className="h-3 w-12 rounded bg-slate-100" />
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-9 w-24 rounded-xl bg-slate-100 mt-2 md:mt-0" />
              </div>
              <div className="bg-fog rounded-[12px] md:rounded-[20px] p-5 space-y-3">
                <div className="h-4 w-40 rounded bg-slate-200/70" />
                <div className="h-4 w-full rounded bg-slate-200/70" />
                <div className="h-4 w-2/3 rounded bg-slate-200/70" />
              </div>
              <p className="sr-only">Memuat riwayat kehadiran...</p>
            </div>
          )
        ) : error ? (
          <AsdosState variant="error" message={error} />
        ) : viewType === 'TABLE' ? (
          filtered.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-8">No</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Mata Kuliah</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Asisten Dosen</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Ruangan</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Check-In</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Check-Out</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[160px]">Bahasan Materi</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap w-24">Verifikasi</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap w-24">Dibayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const groups: { key: string; label: string; items: HistoryItem[] }[] = [];
                      for (const item of filtered) {
                        const date = new Date(item.rawDate);
                        const isValid = !isNaN(date.getTime());
                        const key = isValid ? `${date.getFullYear()}-${date.getMonth()}` : 'other';
                        const label = isValid
                          ? date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                          : 'Lainnya';
                        const existing = groups.find(g => g.key === key);
                        if (existing) existing.items.push(item);
                        else groups.push({ key, label, items: [item] });
                      }
                      let rowNum = 0;
                      return (
                        <>
                          {groups.map(({ key, label, items }) => (
                            <React.Fragment key={key}>
                              <tr className="bg-slate-50 border-y border-slate-100">
                                <td colSpan={11} className="px-4 py-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                                  </div>
                                </td>
                              </tr>
                              {items.map((item) => {
                                rowNum++;
                                const currentNum = rowNum;
                                return (
                                  <tr
                                    key={item.id}
                                    className={`transition-colors ${
                                      (item.forgotCheckout || (item.checkOut === '--:--' && item.status === 'SELESAI'))
                                        ? 'bg-crimson/5 hover:bg-crimson/10'
                                        : item.isLate
                                          ? 'bg-amber-50 hover:bg-amber-100/70'
                                          : 'hover:bg-slate-50/40'
                                    }`}
                                  >
                                    <td className="px-4 py-3 text-xs text-slate-400 font-medium">{currentNum}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-semibold text-slate-800">{item.subject}</span>
                                        {item.isOnline && (
                                          <span className="border border-crimson text-crimson text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                            Online
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-slate-600 whitespace-nowrap">{item.className}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-slate-600 whitespace-nowrap">{item.teachingTeam}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-slate-600 whitespace-nowrap">{item.room}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-slate-600 whitespace-nowrap">{formatDateCompact(item.rawDate)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs text-slate-600 font-mono whitespace-nowrap">{item.checkIn}</span>
                                        {item.isLate && (
                                          <span className="text-[8px] font-extrabold text-amber-600 border border-amber-400 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                                            Terlambat
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs text-slate-600 font-mono whitespace-nowrap">{item.checkOut}</span>
                                        {(item.forgotCheckout || (item.checkOut === '--:--' && item.status === 'SELESAI')) && (
                                          <span className="text-[8px] font-extrabold text-crimson border border-crimson/40 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                                            Auto Co
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 min-w-[160px]">
                                      {item.materi && item.materi !== '-' ? (
                                        <span className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{item.materi}</span>
                                      ) : (
                                        <span className="text-slate-300 text-xs">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto ${
                                        item.isVerified ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 bg-white'
                                      }`}>
                                        {item.isVerified && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto ${
                                        item.isPaid ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 bg-white'
                                      }`}>
                                        {item.isPaid && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))}
                          {filtered.length < 15 && [...Array(15 - filtered.length)].map((_, i) => (
                            <tr key={`empty-${i}`} className="opacity-20">
                              <td className="px-4 py-3 text-xs text-slate-400">{filtered.length + i + 1}</td>
                              <td colSpan={10} className="px-4 py-3">
                                <div className="h-2 bg-slate-100 rounded-full w-24" />
                              </td>
                            </tr>
                          ))}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
                <Clock size={20} />
              </div>
              <p className="text-base md:text-lg text-slate-800 font-bold">Belum ada riwayat kehadiran.</p>
              <p className="text-sm text-slate-400 mt-1">Riwayat akan muncul setelah Anda melakukan check-in.</p>
            </div>
          )
        ) : displayed.length > 0 ? (
          <div className="flex flex-col gap-6">
            {(() => {
              const groups: { dateKey: string; label: string; items: HistoryItem[] }[] = [];
              for (const item of displayed) {
                const raw = item.rawDate.split('T')[0];
                const date = new Date(item.rawDate);
                const isValid = !isNaN(date.getTime());
                const label = isValid
                  ? date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Tanggal Tidak Diketahui';
                const existing = groups.find(g => g.dateKey === raw);
                if (existing) existing.items.push(item);
                else groups.push({ dateKey: raw, label, items: [item] });
              }
              return groups.map(({ dateKey, label, items }) => (
                <div key={dateKey} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => (
            <section
              key={item.id}
              className="bg-white rounded-[12px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 w-full"
            >
              <article className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2 mb-0.5 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 leading-snug">{item.subject}</h2>
                    {item.isOnline && (
                      <span className="mt-0.5 border border-crimson text-crimson text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Kelas: {item.className}</p>
                  <p className="text-xs text-slate-500 font-medium">Ruangan: {item.room}</p>
                  <p className="text-xs text-slate-500 font-medium">Asisten Dosen: {item.teachingTeam}</p>
                </div>

                <div className="flex flex-row gap-5 border-t border-slate-100 pt-3">
                  <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                    <span className="text-xs font-bold text-slate-800">{item.date}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                    <span className="text-xs font-bold text-slate-800">{item.checkIn} – {item.checkOut}</span>
                  </div>
                </div>
              </article>

              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${item.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isVerified ? 'Sudah Diverifikasi' : 'Belum Diverifikasi'}
                </span>
                <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${item.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                </span>
              </div>

              {(item.forgotCheckout || (item.checkOut === '--:--' && item.status === 'SELESAI')) ? (
                <div className="rounded-[14px] border border-crimson/20 bg-crimson/5 px-3 py-2.5 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-crimson shrink-0" />
                  <p className="text-[11px] font-semibold text-crimson">Sesi ini di-checkout otomatis oleh sistem (Auto CO).</p>
                </div>
              ) : (
                <div className="bg-fog rounded-[14px] p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Info className="w-4 h-4 text-slate-800" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-slate-800">Bahasan Materi</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-1 leading-relaxed">
                    &quot;{item.materi}&quot;
                  </p>
                  {item.isOnline && item.linkVideo && (
                    <a
                      href={item.linkVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-[11px] font-semibold text-crimson underline underline-offset-2 break-all"
                    >
                      {item.linkVideo}
                    </a>
                  )}
                </div>
              )}

            </section>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
              <Clock size={20} />
            </div>
            <p className="text-base md:text-lg text-slate-800 font-bold">Belum ada riwayat kehadiran.</p>
            <p className="text-sm text-slate-400 mt-1">Riwayat akan muncul setelah Anda melakukan check-in.</p>
          </div>
        )}

        {viewType === 'CARD' && (
          <>
            <p className="text-xs font-medium text-slate-400 text-center mt-2">
              Menampilkan {displayed.length} dari {filtered.length} riwayat kehadiran.
            </p>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={showMore}
                  className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-crimson/30 hover:text-crimson shadow-sm transition-all active:scale-95"
                >
                  Tampilkan Lebih Banyak
                </button>
              </div>
            )}
          </>
        )}

        {viewType === 'TABLE' && filtered.length > 0 && (
          <p className="text-xs font-medium text-slate-400 text-center mt-2">
            Menampilkan {filtered.length} riwayat kehadiran.
          </p>
        )}
      </div>

      <BottomSheet
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.subject}
        subtitle={selectedItem?.date}
      >
        {selectedItem && (
          <div className="pt-2">
            <div className="flex bg-white rounded-2xl border border-slate-100 p-4 md:p-6 mb-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] divide-x divide-slate-100">
              {[{ label: 'Check-In', time: selectedItem.checkIn }, { label: 'Check-Out', time: selectedItem.checkOut }].map(({ label, time }) => (
                <div key={label} className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">{label}</p>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Clock className="w-[14px] h-[14px] text-slate-400" />
                    <span className="text-base md:text-xl font-bold">{time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${selectedItem.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {selectedItem.isVerified ? 'Sudah Diverifikasi' : 'Belum Diverifikasi'}
              </span>
              <span className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${selectedItem.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {selectedItem.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar'}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <Info className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Kelas</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedItem.className}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Lokasi / Ruangan</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedItem.room}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <Info className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Asisten Dosen</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedItem.teachingTeam}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-2 ml-1">
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Bahasan Materi Lengkap</h4>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 text-sm md:text-base text-slate-600 shadow-[0_2px_10px_rgba(0,0,0,0.02)] leading-relaxed min-h-[80px] flex flex-col gap-3">
                <span>{selectedItem.materi}</span>
                {selectedItem.isOnline && selectedItem.linkVideo && (
                  <a
                    href={selectedItem.linkVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-crimson underline underline-offset-2 break-all"
                  >
                    {selectedItem.linkVideo}
                  </a>
                )}
              </div>
              {selectedItem.checkOut === '--:--' && selectedItem.status === 'SELESAI' && (
                <p className="text-xs font-semibold text-red-500 mt-2 ml-1">Sesi ini di-checkout otomatis oleh sistem (Auto CO).</p>
              )}
            </div>
            <button onClick={() => setSelectedItem(null)}
              className="w-full md:hidden bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
              Tutup
            </button>
          </div>
        )}
      </BottomSheet>
    </AsdosPageShell>
  );
}
