'use client';

import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
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

function findCurrentSemesterId(semesters: SemesterItem[]): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let tipe: 'Ganjil' | 'Genap';
  let yearA: number, yearB: number;

  if (month >= 8) {
    tipe = 'Ganjil'; yearA = year; yearB = year + 1;
  } else if (month >= 2) {
    tipe = 'Genap'; yearA = year - 1; yearB = year;
  } else {
    tipe = 'Ganjil'; yearA = year - 1; yearB = year;
  }

  const match = semesters.find(s =>
    s.tipe_semester === tipe &&
    s.tahun_ajaran.includes(String(yearA)) &&
    s.tahun_ajaran.includes(String(yearB))
  );

  return match?.id ?? semesters[0]?.id ?? '';
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
  const [bayarFilter, setBayarFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [payRowPending, setPayRowPending] = useState<Set<string>>(new Set());

  const [paySearchInput, setPaySearchInput] = useState('');
  const [selectedAsdosName, setSelectedAsdosName] = useState<string | null>(null);
  const [payDropdownOpen, setPayDropdownOpen] = useState(false);
  const paySearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSemesterList(1, '', 100).then((res) => {
      if (res.success && res.data) {
        const items = res.data.items;
        setSemesters(items);
        const currentId = findCurrentSemesterId(items);
        if (currentId) {
          setSemesterFilter(currentId);
          fetchPresensi(false, currentId);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRowVerify = useCallback(async (id: string, newVal: boolean) => {
    const key = `verify-${id}`;
    setPayRowPending(prev => new Set(prev).add(key));
    verifyPresensiLocal(id, newVal);
    try {
      const res = await verifyPresensi(id, newVal);
      if (!res.success) {
        toast.error(res.message || 'Gagal memperbarui verifikasi.');
        await fetchPresensi(true);
      }
    } catch {
      toast.error('Gagal memproses verifikasi.');
      await fetchPresensi(true);
    } finally {
      setPayRowPending(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [verifyPresensiLocal, fetchPresensi]);

  const handleRowPay = useCallback(async (id: string, newVal: boolean) => {
    const key = `pay-${id}`;
    setPayRowPending(prev => new Set(prev).add(key));
    updatePaymentLocal([id], newVal);
    try {
      const res = await updatePaymentStatus([id], newVal);
      if (!res.success) {
        toast.error(res.message || 'Gagal memperbarui pembayaran.');
        await fetchPresensi(true);
      }
    } catch {
      toast.error('Gagal memproses pembayaran.');
      await fetchPresensi(true);
    } finally {
      setPayRowPending(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [updatePaymentLocal, fetchPresensi]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paySearchRef.current && !paySearchRef.current.contains(e.target as Node)) {
        setPayDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const asdosOptions = useMemo(() => {
    const search = paySearchInput.toLowerCase();
    const names = new Set<string>();
    presensiList.forEach(item => {
      const name = (item.nama_asdos || '').trim();
      if (name && name.toLowerCase().includes(search)) names.add(name);
    });
    return Array.from(names).sort();
  }, [presensiList, paySearchInput]);

  const payTableData = useMemo<PresensiResponseDTO[] | null>(() => {
    if (!selectedAsdosName) return null;
    let list = presensiList.filter(item =>
      (item.nama_asdos || '').trim() === selectedAsdosName
    );
    if (bayarFilter === 'PAID') list = list.filter(r => r.is_paid);
    else if (bayarFilter === 'UNPAID') list = list.filter(r => !r.is_paid);
    return list.sort((a, b) => a.tanggal_mengajar.localeCompare(b.tanggal_mengajar));
  }, [presensiList, selectedAsdosName, bayarFilter]);

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

  const formatDateCompact = (dateStr: string) => {
    if (!dateStr || dateStr === 'null' || dateStr.startsWith('0001')) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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
              <div className="hidden md:block h-12" />
            )}
          </div>

          <div className="flex gap-3 flex-1 md:max-w-max md:ml-auto w-full items-end">
            {semesters.length > 0 && (
              <>
                <div className={`hidden md:flex flex-col gap-1 shrink-0 ${pageTab === 'PAY' ? 'w-[240px]' : 'w-[180px]'}`}>
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

            {pageTab === 'VERIFY' ? (
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
            ) : (
              <div ref={paySearchRef} className="flex-1 md:flex-initial w-full md:w-[220px] md:shrink-0 relative">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari nama asdos..."
                    value={paySearchInput}
                    onChange={(e) => {
                      setPaySearchInput(e.target.value);
                      setSelectedAsdosName(null);
                      setPayDropdownOpen(true);
                    }}
                    onFocus={() => setPayDropdownOpen(true)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-slate-200 outline-none text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  />
                  {(paySearchInput || selectedAsdosName) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaySearchInput('');
                        setSelectedAsdosName(null);
                        setPayDropdownOpen(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {payDropdownOpen && !selectedAsdosName && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-56 overflow-y-auto">
                    {asdosOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400 text-center">
                        {paySearchInput ? `Tidak ada asdos "${paySearchInput}"` : 'Ketik nama untuk mencari'}
                      </div>
                    ) : (
                      asdosOptions.map(name => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedAsdosName(name);
                            setPaySearchInput(name);
                            setPayDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-crimson transition-colors flex items-center gap-2.5"
                        >
                          <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {pageTab === 'VERIFY' && (
              <div className="shrink-0">
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
              </div>
            )}
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
          {/* ── VERIFY TAB ── */}
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
              />
            ) : (
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

          {/* ── PAY TAB ── */}
          <div
            className={`w-1/2 shrink-0 transition-opacity duration-300 ${
              pageTab === 'PAY' ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {isLoading ? (
              /* Skeleton loading berbentuk tabel */
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-4 w-36 bg-slate-100 rounded animate-shimmer" />
                      <div className="h-3 w-24 bg-slate-100 rounded animate-shimmer" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          {['No', 'Nama Pelajaran', 'Kelas', 'Tgl Perkuliahan', 'Mulai', 'Selesai', 'Bahasan Materi', 'Pengajar', 'Verifikasi', 'Pembayaran'].map(col => (
                            <th key={col} className="px-4 py-3 text-left">
                              <div className="h-2.5 bg-slate-100 rounded animate-shimmer w-16" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(8)].map((_, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-4" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-32" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-16" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-24" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-12" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-12" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-28" /></td>
                            <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded animate-shimmer w-20" /></td>
                            <td className="px-4 py-3"><div className="h-5 w-5 bg-slate-100 rounded animate-shimmer mx-auto" /></td>
                            <td className="px-4 py-3"><div className="h-5 w-5 bg-slate-100 rounded animate-shimmer mx-auto" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            ) : (
              <div className="space-y-4">
                {/* Konten tabel / prompt */}
                {payTableData === null ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 mb-1">Pilih asisten dosen</p>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Ketik dan pilih nama dari dropdown untuk melihat data kehadiran.
                    </p>
                  </div>
                ) : payTableData.length === 0 ? (
                  <AsdosState
                    icon={<Inbox size={24} />}
                    title="Tidak Ada Data"
                    message={`Tidak ada presensi tercatat untuk "${selectedAsdosName}".`}
                    className="mt-2"
                  />
                ) : (
              /* Tabel presensi asdos */
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {/* Tabel — scrollable kiri kanan */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-8">No</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Nama Pelajaran</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Kelas</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Tgl Perkuliahan</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Mulai</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Selesai</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[160px]">Bahasan Materi</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Pengajar</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap w-24">Verifikasi</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap w-24">Pembayaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payTableData.map((item, index) => {
                        const verifyKey = `verify-${item.id_presensi}`;
                        const payKey = `pay-${item.id_presensi}`;
                        const verifyPending = payRowPending.has(verifyKey);
                        const payPending = payRowPending.has(payKey);
                        const isOnline = item.tipe_absensi === 'link';
                        return (
                          <tr key={item.id_presensi} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-4 py-3 text-xs text-slate-400 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                                {item.nama_mata_kuliah || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 whitespace-nowrap">{item.nama_kelas || '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 whitespace-nowrap">{formatDateCompact(item.tanggal_mengajar)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-slate-600 whitespace-nowrap font-mono">{formatTime(item.waktu_checkin)}</span>
                            </td>
                            <td className="px-4 py-3">
                              {isOnline ? (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full whitespace-nowrap">Online</span>
                              ) : (
                                <span className="text-xs text-slate-600 whitespace-nowrap font-mono">{formatTime(item.waktu_checkout)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 min-w-[160px]">
                              {item.deskripsi_materi ? (
                                <span className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{item.deskripsi_materi}</span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.nama_asdos_rekan ? (
                                <span className="text-xs text-slate-600 whitespace-nowrap">{item.nama_asdos_rekan}</span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>

                            {/* Checkbox Verifikasi */}
                            <td className="px-4 py-3 text-center">
                              {verifyPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-300 mx-auto" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRowVerify(item.id_presensi, !item.is_verified)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all active:scale-90 cursor-pointer ${
                                    item.is_verified
                                      ? 'bg-crimson border-crimson shadow-sm'
                                      : 'border-slate-300 bg-white hover:border-crimson'
                                  }`}
                                  title={item.is_verified ? 'Batalkan verifikasi' : 'Verifikasi'}
                                >
                                  {item.is_verified && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </button>
                              )}
                            </td>

                            {/* Checkbox Pembayaran */}
                            <td className="px-4 py-3 text-center">
                              {payPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-300 mx-auto" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRowPay(item.id_presensi, !item.is_paid)}
                                  disabled={!item.is_verified}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition-all active:scale-90 ${
                                    !item.is_verified
                                      ? 'border-slate-200 bg-slate-50 opacity-30 cursor-not-allowed'
                                      : item.is_paid
                                      ? 'bg-emerald-600 border-emerald-600 shadow-sm cursor-pointer'
                                      : 'border-slate-300 bg-white hover:border-emerald-600 cursor-pointer'
                                  }`}
                                  title={!item.is_verified ? 'Verifikasi dahulu sebelum bayar' : item.is_paid ? 'Batalkan pembayaran' : 'Tandai lunas'}
                                >
                                  {item.is_paid && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Baris kosong sampai 15 sesi */}
                      {payTableData.length < 15 && [...Array(15 - payTableData.length)].map((_, i) => (
                        <tr key={`empty-${i}`} className="opacity-20">
                          <td className="px-4 py-3 text-xs text-slate-400">{payTableData.length + i + 1}</td>
                          <td colSpan={9} className="px-4 py-3">
                            <div className="h-2 bg-slate-100 rounded-full w-24" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                )}
              </div>
            )}
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
