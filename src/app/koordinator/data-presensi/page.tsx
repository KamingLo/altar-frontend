'use client';

import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import {
  CalendarDays,
  User,
  X,
  Check,
  Search,
  Inbox,
  Loader2,
  Video,
  ExternalLink,
  Filter,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPresensi,
  verifyPresensi,
  updatePaymentStatus,
  type PresensiResponseDTO
} from '@/lib/actions/presensi';
import { getSemesterList } from '@/lib/actions/data-master';
import type { SemesterItem } from '@/types/api';
import { usePresensiStore } from '@/store/usePresensiStore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AsdosPageShell, AsdosState } from '@/components/dashboard/asdos/AsdosUI';

type TabId = 'ALL' | 'PENDING' | 'VERIFIED';
type TipeFilter = 'ALL' | 'QR' | 'LINK';
type PageTab = 'VERIFY' | 'PAY';

function toMonthKey(dateStr: string) {
  // Accepts ISO-ish strings; safest for backend formats used here.
  // Example: 2026-05-27T00:00:00.000Z -> 2026-05
  const part = (dateStr || '').split('T')[0] || '';
  const [y, m] = part.split('-');
  if (!y || !m) return '';
  return `${y}-${m}`;
}

function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey || '-';
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

const FILTER_TIPE_OPTIONS = [
  { value: 'ALL', label: 'Semua Absensi' },
  { value: 'QR', label: 'Scan QR (Reguler)' },
  { value: 'LINK', label: 'Link Video (Malam)' }
];

const FILTER_BAYAR_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'UNPAID', label: 'Belum Dibayar' },
  { value: 'PAID', label: 'Sudah Dibayar' }
];

export default function DataPresensiPage() {
  const { presensiList, isLoading, setPresensi, verifyPresensiLocal, updatePaymentLocal, setIsLoading } = usePresensiStore();

  const [pageTab, setPageTab] = useState<PageTab>('VERIFY');
  const [activeTab, setActiveTab] = useState<TabId>('PENDING');
  const [tipeFilter, setTipeFilter] = useState<TipeFilter>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [bulkPending, setBulkPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);

  const [payingIndividual, setPayingIndividual] = useState<string | null>(null);
  const [bayarFilter, setBayarFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [confirmingPayKey, setConfirmingPayKey] = useState<string | null>(null);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    getSemesterList(1, '', 100).then((res) => {
      if (res.success && res.data) setSemesters(res.data.items);
    });
  }, []);

  const fetchPresensi = useCallback(async (silent = false, semId?: string) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const activeSem = (semId !== undefined ? semId : semesterFilter) || undefined;
      const res = await getAllPresensi(undefined, undefined, undefined, activeSem);
      if (res.success) {
        setPresensi(res.data ?? []);
        setSelectedIds(new Set());
      } else {
        if (!silent) {
          setPresensi([]);
          toast.error(res.message || 'Gagal memuat data presensi.');
        }
      }
    } catch {
      if (!silent) {
        setPresensi([]);
        toast.error('Terjadi kesalahan saat menghubungkan ke server.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [setPresensi, setIsLoading, semesterFilter]);

  const handleSemesterChange = (val: string) => {
    setSemesterFilter(val);
    fetchPresensi(false, val || undefined);
  };

  useEffect(() => {
    fetchPresensi(false);
  }, [fetchPresensi]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (document.visibilityState === 'visible') {
        await fetchPresensi(true);
      }
      timeoutId = setTimeout(poll, 30_000);
    };

    timeoutId = setTimeout(poll, 30_000);
    return () => clearTimeout(timeoutId);
  }, [fetchPresensi]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchPresensi(true);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchPresensi]);

  const handleBulkPayment = async (isPaid: boolean) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkPending(true);
    updatePaymentLocal(ids, isPaid);
    try {
      const res = await updatePaymentStatus(ids, isPaid);
      if (res.success) {
        toast.success(isPaid ? `${ids.length} presensi ditandai lunas.` : `${ids.length} presensi ditandai belum lunas.`);
      } else {
        toast.error(res.message || 'Gagal memperbarui status pembayaran.');
        fetchPresensi(true);
      }
    } catch {
      toast.error('Gagal memproses pembaruan pembayaran.');
      fetchPresensi(true);
    } finally {
      setBulkPending(false);
      setSelectedIds(new Set());
    }
  };

  const handleVerifyDirect = async (id: string, action: boolean) => {
    const item = presensiList.find(p => p.id_presensi === id);
    if (!item) return;
    setConfirmingId(null);
    startTransition(async () => {
      verifyPresensiLocal(id, action);
      try {
        const res = await verifyPresensi(id, action);
        if (res.success) {
          toast.success(
            action
              ? `Presensi asisten ${item.nama_asdos} berhasil diverifikasi!`
              : `Verifikasi presensi asisten ${item.nama_asdos} berhasil dibatalkan.`
          );
        } else {
          toast.error(res.message || 'Gagal memperbarui status presensi.');
          await fetchPresensi(true);
        }
      } catch {
        toast.error('Gagal memproses verifikasi presensi.');
        await fetchPresensi(true);
      }
    });
  };

  const filteredList = presensiList.filter((item) => {

    if (activeTab === 'PENDING' && item.is_verified) return false;
    if (activeTab === 'VERIFIED' && !item.is_verified) return false;

    if (tipeFilter === 'QR' && item.tipe_absensi !== 'qr') return false;
    if (tipeFilter === 'LINK' && item.tipe_absensi !== 'link') return false;

    const search = searchQuery.toLowerCase();
    const asdosName = (item.nama_asdos || '').toLowerCase();
    const asdosRekan = (item.nama_asdos_rekan || '').toLowerCase();
    const matkul = (item.nama_mata_kuliah || '').toLowerCase();
    const kelas = (item.nama_kelas || '').toLowerCase();

    return (
      asdosName.includes(search) ||
      asdosRekan.includes(search) ||
      matkul.includes(search) ||
      kelas.includes(search)
    );
  });

  // For Progress & Pembayaran, we should not depend on the VERIFY tab filters (activeTab).
  // We still respect semesterFilter because the fetch already scopes data by semester.
  const payVerifiedList = useMemo<PresensiResponseDTO[]>(() => {
    return presensiList.filter((item) => {
      if (!item.is_verified) return false;
      if (tipeFilter === 'QR' && item.tipe_absensi !== 'qr') return false;
      if (tipeFilter === 'LINK' && item.tipe_absensi !== 'link') return false;
      const search = searchQuery.toLowerCase();
      const asdosName = (item.nama_asdos || '').toLowerCase();
      return asdosName.includes(search);
    });
  }, [presensiList, tipeFilter, searchQuery]);

  const currentMonthKey = useMemo(() => toMonthKey(new Date().toISOString()), []);

  const paymentSections = useMemo(() => {
    // Group verified items into month -> asdos rekap
    const monthMap = new Map<string, PresensiResponseDTO[]>();
    for (const item of payVerifiedList) {
      const key = toMonthKey(item.tanggal_mengajar);
      if (!key) continue;
      monthMap.set(key, [...(monthMap.get(key) || []), item]);
    }

    const months = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, items]) => {
        const asdosMap = new Map<string, PresensiResponseDTO[]>();
        for (const it of items) {
          const name = (it.nama_asdos || '—').trim() || '—';
          asdosMap.set(name, [...(asdosMap.get(name) || []), it]);
        }

        let asdosRows = Array.from(asdosMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([name, list]) => {
            const unpaidIds = list.filter(x => !x.is_paid).map(x => x.id_presensi);
            return {
              name,
              totalSessions: list.length,
              unpaidCount: unpaidIds.length,
              isPaid: unpaidIds.length === 0,
              unpaidIds,
            };
          });

        if (bayarFilter === 'PAID') {
          asdosRows = asdosRows.filter(r => r.isPaid);
        } else if (bayarFilter === 'UNPAID') {
          asdosRows = asdosRows.filter(r => !r.isPaid);
        }

        const unpaidIdsAll = asdosRows.flatMap(r => r.unpaidIds);
        const canPay = monthKey < currentMonthKey; // only months strictly before current month

        return {
          monthKey,
          monthLabel: formatMonthLabel(monthKey),
          asdosRows,
          unpaidIdsAll,
          canPay,
        };
      })
      .filter(section => section.asdosRows.length > 0);

    return months;
  }, [payVerifiedList, currentMonthKey, bayarFilter]);

  const handleIndividualPayment = useCallback(async (ids: string[], isPaid: boolean, asdosName: string, monthKey: string) => {
    let targetIds = ids;
    if (!isPaid) {
      const matchingPresensi = presensiList.filter(p =>
        p.is_verified &&
        p.is_paid &&
        ((p.nama_asdos || '—').trim() || '—') === asdosName &&
        toMonthKey(p.tanggal_mengajar) === monthKey
      );
      targetIds = matchingPresensi.map(p => p.id_presensi);
    }
    if (!targetIds.length) return;

    const key = `${asdosName}-${monthKey}`;
    setPayingIndividual(key);
    updatePaymentLocal(targetIds, isPaid);
    try {
      const res = await updatePaymentStatus(targetIds, isPaid);
      if (res.success) {
        toast.success(
          isPaid 
            ? `Pembayaran asisten ${asdosName} berhasil ditandai lunas.` 
            : `Status pembayaran asisten ${asdosName} berhasil dibatalkan.`
        );
      } else {
        toast.error(res.message || 'Gagal memperbarui status pembayaran.');
        fetchPresensi(true);
      }
    } catch {
      toast.error('Gagal memproses status pembayaran.');
      fetchPresensi(true);
    } finally {
      setPayingIndividual(null);
    }
  }, [presensiList, fetchPresensi, updatePaymentLocal]);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'null' || dateStr.startsWith('0001')) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr || timeStr === 'null' || timeStr.startsWith('0001')) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <AsdosPageShell>

      <div className="mb-2 md:mb-3 px-1">
        <p className="text-[11px] font-black text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">
          DATA PRESENSI
        </p>
        <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">
          Presensi Asisten
        </h2>

        <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed">
            Tinjau jurnal mengajar, periksa video bukti kelas malam, dan lakukan verifikasi kehadiran asisten dosen.
          </p>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slate-100 p-0.5 rounded-xl w-full md:w-auto md:min-w-[280px]">
              {(['VERIFY', 'PAY'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPageTab(t)}
                  className={`flex-1 h-10 flex items-center justify-center gap-2 px-3 rounded-[8px] text-[11px] font-bold transition-all ${
                    pageTab === t ? 'bg-white text-crimson shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t === 'VERIFY' ? 'Verifikasi' : 'Pembayaran'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Filter Bar above the sliding container */}
      <div className="space-y-6 relative z-20 mb-3 px-1">
        <div className="w-full z-20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex w-full md:w-auto">
            {pageTab === 'VERIFY' ? (
              <div className="p-1 rounded-2xl border border-slate-200/80 bg-white/95 flex gap-1 overflow-x-auto hide-scrollbar w-full md:w-auto">
                {(
                  [
                    { id: 'PENDING', label: 'Pending' },
                    { id: 'VERIFIED', label: 'Terverifikasi' },
                    { id: 'ALL', label: 'Semua' }
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 md:flex-initial min-w-fit px-5 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all active:scale-[0.98] select-none
                        ${isActive
                          ? 'bg-crimson text-white shadow-sm'
                          : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Empty space to maintain layout alignment when PAY tab is active
              <div className="hidden md:block h-12" />
            )}
          </div>

          <div className="flex gap-3 flex-1 md:max-w-max md:ml-auto w-full items-end">
            {semesters.length > 0 && (
              <>
                {/* Desktop Semester Select */}
                <div className="hidden md:flex flex-col gap-1 w-[180px] shrink-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Semester</span>
                  <CustomSelect
                    variant="field"
                    value={semesterFilter}
                    onChange={handleSemesterChange}
                    options={[
                      { value: '', label: 'Semua Semester' },
                      ...semesters.map((s) => ({
                        value: s.id,
                        label: `${s.tipe_semester} ${s.tahun_ajaran}`,
                      })),
                    ]}
                    placeholder="Semester"
                    icon={<CalendarDays className="w-4 h-4 text-slate-400" />}
                    triggerClassName="py-3.5 px-4 rounded-xl border-slate-200 bg-white text-sm"
                  />
                </div>

                {/* Mobile Semester Floating Select Button (styled exactly like manajemen jadwal) */}
                <div className="md:hidden fixed bottom-7 right-4 z-50">
                  <CustomSelect
                    variant="icon"
                    align="right"
                    value={semesterFilter}
                    onChange={handleSemesterChange}
                    options={[
                      { value: '', label: 'Semua Semester' },
                      ...semesters.map((s) => ({
                        value: s.id,
                        label: `${s.tipe_semester} ${s.tahun_ajaran}`,
                      })),
                    ]}
                    placeholder="Semester"
                    icon={<CalendarDays className="w-5 h-5 text-slate-600" />}
                    triggerClassName="w-14 h-14 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center active:scale-90 transition-transform"
                  />
                </div>
              </>
            )}

            <div className="flex-1 md:flex-initial w-full md:w-[200px] md:shrink-0">
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {pageTab === 'VERIFY' ? (
                <CustomSelect
                  variant="icon"
                  align="right"
                  value={tipeFilter}
                  onChange={(v) => setTipeFilter(v as TipeFilter)}
                  options={FILTER_TIPE_OPTIONS}
                  placeholder="Filter tipe"
                  icon={<Filter className="w-5 h-5" />}
                  triggerClassName={
                    tipeFilter !== 'ALL'
                      ? 'bg-red-50 border-crimson text-crimson py-3.5 px-4 rounded-xl flex items-center justify-center'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 py-3.5 px-4 rounded-xl flex items-center justify-center'
                  }
                />
              ) : (
                <CustomSelect
                  variant="icon"
                  align="right"
                  value={bayarFilter}
                  onChange={(v) => setBayarFilter(v as 'ALL' | 'PAID' | 'UNPAID')}
                  options={FILTER_BAYAR_OPTIONS}
                  placeholder="Filter status"
                  icon={<Filter className="w-5 h-5" />}
                  triggerClassName={
                    bayarFilter !== 'ALL'
                      ? 'bg-red-50 border-crimson text-crimson py-3.5 px-4 rounded-xl flex items-center justify-center'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 py-3.5 px-4 rounded-xl flex items-center justify-center'
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div
          className="flex w-[200%] transform-gpu"
          style={{
            transform: pageTab === 'PAY' ? 'translateX(-50%)' : 'translateX(0)',
            transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className={`w-1/2 shrink-0 transition-opacity duration-300 ${
              pageTab === 'PAY' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >

            {isLoading ? (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-shimmer space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex gap-4 items-center">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-slate-100 mt-6">
                  <div className="h-8 bg-slate-100 rounded-xl w-full" />
                  <div className="h-8 bg-slate-100 rounded-xl w-full" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex gap-3 mt-4">
                <div className="h-10 bg-slate-100 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>

      ) : filteredList.length === 0 ? (

        <AsdosState
          icon={<Inbox size={24} />}
          title="Tidak Ada Presensi"
          message={
            searchQuery
              ? 'Tidak menemukan rekaman presensi asisten yang cocok dengan kata pencarian Anda.'
              : `Tidak ada berkas presensi asisten dengan status "${activeTab === 'ALL' ? 'Semua' : activeTab === 'PENDING' ? 'Pending' : 'Terverifikasi'}" saat ini.`
          }
          className="mt-8"
        />      ) : (
        (() => {
          const groupedList = filteredList.reduce<Record<string, typeof filteredList>>((acc, item) => {
            const datePart = item.tanggal_mengajar ? item.tanggal_mengajar.split('T')[0] : 'other';
            acc[datePart] = [...(acc[datePart] || []), item];
            return acc;
          }, {});

          const sortedDateKeys = Object.keys(groupedList).sort((a, b) => b.localeCompare(a));

          return (
            <div className="space-y-8 relative z-10">
              {sortedDateKeys.map((dateKey) => {
                const items = groupedList[dateKey];
                const displayDate = dateKey === 'other' ? 'Tanggal Lainnya' : formatDate(dateKey);

                return (
                  <div key={dateKey} className="space-y-4">
                    <div className="flex items-center px-1 pt-2">
                      <h3 className="text-sm font-bold text-slate-800">{displayDate}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {items.map((item) => {
                        const isPendingStatus = !item.is_verified;
                        const isLink = item.tipe_absensi === 'link';
                        const isCheckoutEmpty = !isLink && (!item.waktu_checkout || item.waktu_checkout === '' || item.waktu_checkout === 'null' || String(item.waktu_checkout).startsWith('0001'));
                        return (
                          <section
                            key={item.id_presensi}
                            className="bg-white rounded-[12px] p-5 border border-slate-100 flex flex-col w-full"
                          >
                            <article className="flex flex-col flex-1 gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h2 className="font-bold text-slate-900 leading-snug line-clamp-2 text-sm">
                                    {item.nama_mata_kuliah}
                                  </h2>
                                  <p className="text-slate-500 font-medium text-[11px] mt-0.5 truncate">
                                    {item.nama_kelas || '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <div className="grid grid-cols-2 gap-x-0 gap-y-2.5">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                                    <span className="text-[11px] font-bold text-slate-800">
                                      {(!item.tanggal_mengajar || item.tanggal_mengajar === '' || item.tanggal_mengajar === 'null' || String(item.tanggal_mengajar).startsWith('0001')) ? '-' : formatDate(item.tanggal_mengajar)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                                    <span className="text-[11px] font-bold text-slate-800 truncate" title={item.nama_ruangan || '-'}>
                                      {item.nama_ruangan || '-'}
                                      {item.menggantikan && (
                                        <span className="text-[8px] font-extrabold text-crimson bg-rose-50 border border-rose-100 px-1 py-0.2 rounded uppercase ml-1">
                                          Ganti
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Check-In</span>
                                    <span className="text-[11px] font-bold text-slate-800">
                                      {(!item.waktu_checkin || item.waktu_checkin === '' || item.waktu_checkin === 'null' || String(item.waktu_checkin).startsWith('0001')) ? '-' : formatTime(item.waktu_checkin)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Check-Out</span>
                                    <span className="text-[11px] font-bold text-slate-800">
                                      {isLink ? 'Sesi Online' : (isCheckoutEmpty ? '-' : formatTime(item.waktu_checkout))}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Asisten Dosen</span>
                                <div className="flex items-center gap-2 min-w-0">
                                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-xs font-semibold text-slate-700 truncate" title={item.nama_asdos}>
                                    {item.nama_asdos}
                                  </span>
                                </div>
                                {item.nama_asdos_rekan && (
                                  <div className="flex items-center gap-2 min-w-0 mt-1 pl-5">
                                    <span className="text-[9px] text-slate-400 font-medium">Rekan:</span>
                                    <span className="text-xs text-slate-500 font-medium truncate">{item.nama_asdos_rekan}</span>
                                  </div>
                                )}
                              </div>

                              {item.deskripsi_materi ? (
                                <div className="bg-fog border border-slate-100 rounded-[12px] p-3">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    Materi
                                  </span>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 hover:line-clamp-none cursor-pointer transition-all">
                                    &quot;{item.deskripsi_materi}&quot;
                                  </p>
                                </div>
                              ) : null}

                              {isLink && item.link_video && (
                                <a
                                  href={item.link_video}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/30 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-all mt-1 active:scale-98"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Buka Rekaman Video</span>
                                  <ExternalLink className="w-3 h-3 text-rose-400 shrink-0" />
                                </a>
                              )}

                              {isCheckoutEmpty && (
                                <p className="text-xs font-bold text-crimson mt-2 mb-2 text-center w-full">
                                  Tidak melakukan checkout
                                </p>
                              )}

                              <div className="pt-3 border-t border-slate-100 flex gap-2 mt-auto">
                                {confirmingId === item.id_presensi ? (
                                  <div className="w-full h-10 flex items-center justify-between gap-3 bg-slate-50/50 rounded-xl px-3 border border-slate-100">
                                    <span className="text-xs font-extrabold text-slate-700 animate-pulse">
                                      Anda Yakin?
                                    </span>
                                    <div className="flex gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setConfirmingId(null)}
                                        className="w-7 h-7 rounded-full border border-rose-200 bg-white text-crimson hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                        title="Batal"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleVerifyDirect(item.id_presensi, isPendingStatus)}
                                        className="w-7 h-7 rounded-full border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-sm"
                                        title="Ya, Konfirmasi"
                                      >
                                        {isPending ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ) : isPendingStatus ? (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingId(item.id_presensi)}
                                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <span>Verfikasi</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingId(item.id_presensi)}
                                    className="w-full h-10 rounded-xl border border-rose-200 text-crimson hover:bg-rose-50/50 font-extrabold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <span>Batalkan</span>
                                  </button>
                                )}
                              </div>
                            </article>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}

          </div>
          <div
            className={`w-1/2 shrink-0 transition-opacity duration-300 ${
              pageTab === 'PAY' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
              {(() => {
                if (isLoading) {
                  return (
                    <div className="grid grid-cols-1 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-[12px] md:rounded-[32px] p-5 md:p-6 border border-slate-100 animate-shimmer space-y-4">
                          <div className="h-5 w-40 rounded" />
                          <div className="h-10 w-full rounded-2xl" />
                          <div className="h-24 w-full rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  );
                }

                if (paymentSections.length === 0) {
                  return (
                    <AsdosState
                      icon={<Inbox size={24} />}
                      title="Belum ada progress"
                      message="Tidak ada presensi terverifikasi untuk pembayaran."
                      className="mt-2"
                    />
                  );
                }

                return (
                  <div className="space-y-8 relative z-10">
                    {paymentSections.map(section => {
                      return (
                        <div key={section.monthKey} className="space-y-4">
                          <div className="flex items-center px-1 pt-2">
                            <h3 className="text-sm font-bold text-slate-800">{section.monthLabel}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {section.asdosRows.map(r => {
                              const unverifiedCount = presensiList.filter(p =>
                                !p.is_verified &&
                                ((p.nama_asdos || '—').trim() || '—') === r.name &&
                                toMonthKey(p.tanggal_mengajar) === section.monthKey
                              ).length;

                              return (
                                <section
                                  key={r.name}
                                  className="bg-white rounded-[12px] p-5 border border-slate-100 flex flex-col w-full"
                                >
                                  <article className="flex flex-col flex-1 gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <h2 className="font-bold text-slate-900 leading-snug truncate text-sm" title={r.name}>
                                          {r.name}
                                        </h2>
                                        <p className="text-slate-500 font-medium text-[11px] mt-0.5 uppercase tracking-wider">
                                          Asisten Dosen
                                        </p>
                                      </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3">
                                      <div className="grid grid-cols-2 gap-x-0 gap-y-2.5">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kehadiran</span>
                                          <span className="text-[11px] font-bold text-slate-800">
                                            {r.totalSessions} / 15
                                          </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Belum Diverifikasi</span>
                                          <span className="text-[11px] font-bold text-slate-800">
                                            {unverifiedCount}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex gap-2 mt-auto">
                                      {payingIndividual === `${r.name}-${section.monthKey}` ? (
                                        <button
                                          type="button"
                                          disabled
                                          className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 font-extrabold text-xs flex items-center justify-center gap-2"
                                        >
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Memproses...</span>
                                        </button>
                                      ) : confirmingPayKey === `${r.name}-${section.monthKey}` ? (
                                        <div className="w-full h-10 flex items-center justify-between gap-3 bg-slate-50/50 rounded-xl px-3 border border-slate-100 animate-fadeIn">
                                          <span className="text-xs font-extrabold text-slate-700 animate-pulse">
                                            Anda Yakin?
                                          </span>
                                          <div className="flex gap-1.5 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => setConfirmingPayKey(null)}
                                              className="w-7 h-7 rounded-full border border-rose-200 bg-white text-crimson hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                              title="Batal"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                setConfirmingPayKey(null);
                                                await handleIndividualPayment(
                                                  !r.isPaid ? r.unpaidIds : [],
                                                  !r.isPaid,
                                                  r.name,
                                                  section.monthKey
                                                );
                                              }}
                                              className="w-7 h-7 rounded-full border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                              title="Ya, Konfirmasi"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ) : !r.isPaid ? (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingPayKey(`${r.name}-${section.monthKey}`)}
                                          className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <span>Bayar</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingPayKey(`${r.name}-${section.monthKey}`)}
                                          className="w-full h-10 rounded-xl border border-rose-200 text-crimson hover:bg-rose-50/50 font-extrabold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <span>Batalkan Bayar</span>
                                        </button>
                                      )}
                                    </div>
                                  </article>
                                </section>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && pageTab === 'VERIFY' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 pointer-events-none w-full">
          <div className="mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 px-5 py-3.5 flex items-center justify-between gap-3 pointer-events-auto w-fit max-w-[calc(100vw-2rem)]">
            <span className="text-sm font-extrabold text-slate-800 whitespace-nowrap">
              {selectedIds.size} terpilih
            </span>
            <button
              type="button"
              disabled={bulkPending}
              onClick={() => handleBulkPayment(true)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50"
            >
              {bulkPending ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
              Tandai Lunas
            </button>
            <button
              type="button"
              disabled={bulkPending}
              onClick={() => handleBulkPayment(false)}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-extrabold transition-all active:scale-95 hover:bg-slate-50 disabled:opacity-50"
            >
              Blm Lunas
            </button>
          </div>
        </div>
      )}



    </AsdosPageShell>
  );
}

