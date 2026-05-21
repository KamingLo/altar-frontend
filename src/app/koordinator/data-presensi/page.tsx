'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  CalendarDays,
  MapPin,
  User,
  CheckCircle2,
  X,
  MessageSquare,
  Check,
  Search,
  Inbox,
  Loader2,
  Video,
  QrCode,
  ExternalLink,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllPresensi,
  verifyPresensi,
  type PresensiResponseDTO
} from '@/lib/actions/presensi';
import { usePresensiStore } from '@/store/usePresensiStore';
import { CustomSelect } from '@/components/ui/CustomSelect';

type TabId = 'ALL' | 'PENDING' | 'VERIFIED';
type TipeFilter = 'ALL' | 'QR' | 'LINK';

const FILTER_TIPE_OPTIONS = [
  { value: 'ALL', label: 'Semua Absensi' },
  { value: 'QR', label: 'Scan QR (Reguler)' },
  { value: 'LINK', label: 'Link Video (Malam)' }
];

export default function DataPresensiPage() {
  const { presensiList, isLoading, setPresensi, verifyPresensiLocal, setIsLoading } = usePresensiStore();

  const [activeTab, setActiveTab] = useState<TabId>('PENDING');
  const [tipeFilter, setTipeFilter] = useState<TipeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PresensiResponseDTO | null;
    action: boolean;
  }>({
    isOpen: false,
    item: null,
    action: true
  });

  const fetchPresensi = useCallback(async (silent = false) => {
    if (!silent && presensiList.length === 0) {
      setIsLoading(true);
    }
    try {
      const res = await getAllPresensi(undefined, undefined);
      if (res.success && res.data) {
        setPresensi(res.data);
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
  }, [setPresensi, setIsLoading, presensiList.length]);

  useEffect(() => {
    fetchPresensi(false);
  }, [fetchPresensi]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchPresensi(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [fetchPresensi]);

  const openConfirmModal = (item: PresensiResponseDTO, action: boolean) => {
    setConfirmModal({
      isOpen: true,
      item,
      action
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      item: null,
      action: true
    });
  };

  const handleVerify = async () => {
    const { item, action } = confirmModal;
    if (!item) return;

    closeConfirmModal();

    startTransition(async () => {

      verifyPresensiLocal(item.id_presensi, action);

      try {
        const res = await verifyPresensi(item.id_presensi, action);
        if (res.success) {
          toast.success(
            action
              ? `Presensi asisten ${item.nama_asdos} berhasil diverifikasi!`
              : `Verifikasi presensi asisten ${item.nama_asdos} berhasil dibatalkan.`
          );
        } else {
          toast.error(res.message || 'Gagal memperbarui status presensi.');
          fetchPresensi(true); 
        }
      } catch {
        toast.error('Gagal memproses verifikasi presensi.');
        fetchPresensi(true); 
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

  const formatDate = (dateStr: string) => {
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
    if (!timeStr) return '—';
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
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 min-h-screen pb-24 md:pb-12 font-sans">

      <div className="mb-6 md:mb-8 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">
            Data Presensi
          </p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Presensi Asisten</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base max-w-xl">
            Tinjau jurnal mengajar, periksa video bukti kelas malam, dan lakukan verifikasi kehadiran asisten dosen.
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10 mb-6">
        <div className="w-full z-20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex w-full md:w-auto">
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
                        ? 'bg-[#941C2F] text-white shadow-sm' 
                        : 'bg-transparent text-slate-500 hover:text-slate-800'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 flex-1 md:max-w-[420px] md:ml-auto w-full">

            <div className="relative flex-1 min-w-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari asdos, matkul, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 outline-none text-sm font-medium text-slate-800 bg-white/95 placeholder-slate-400 focus:border-[#941C2F] focus:ring-2 focus:ring-[#941C2F]/15 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <CustomSelect
                variant="icon"
                align="right"
                value={tipeFilter}
                onChange={(v) => setTipeFilter(v as TipeFilter)}
                options={FILTER_TIPE_OPTIONS}
                placeholder="Filter tipe"
                icon={<Filter className="w-[18px] h-[18px]" />}
                triggerClassName={
                  tipeFilter !== 'ALL' ? 'bg-red-50 border-[#941C2F] text-[#941C2F]' : ''
                }
              />
            </div>

          </div>
        </div>
      </div>

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

        <div className="text-center max-w-xl mx-auto mt-16 py-6 relative z-10">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/50 border border-slate-200/50 flex items-center justify-center text-slate-400">
            <Inbox size={28} className="text-slate-400" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Tidak Ada Presensi</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {searchQuery 
              ? 'Tidak menemukan rekaman presensi asisten yang cocok dengan kata pencarian Anda.'
              : `Tidak ada berkas presensi asisten dengan status "${activeTab === 'ALL' ? 'Semua' : activeTab === 'PENDING' ? 'Pending' : 'Terverifikasi'}" saat ini.`
            }
          </p>
        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {filteredList.map((item) => {
            const isPendingStatus = !item.is_verified;
            const isLink = item.tipe_absensi === 'link';

            return (
              <div
                key={item.id_presensi}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.005] active:scale-[0.999] transition-all flex flex-col justify-between border border-slate-100"
              >
                <div className="space-y-4">

                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${isLink ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isLink ? <Video size={20} /> : <QrCode size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[15px] text-[#1F2937] truncate leading-tight">
                          {item.nama_mata_kuliah}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 mt-0.5 truncate">Kelas {item.nama_kelas}</p>
                      </div>
                    </div>

                    <span
                      className={`
                        text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg border uppercase shrink-0
                        ${isPendingStatus 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }
                      `}
                    >
                      {isPendingStatus ? 'Pending' : 'Verified'}
                    </span>
                  </div>

                  <div className="pt-2 space-y-3">

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{formatDate(item.tanggal_mengajar)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Ruangan: {item.nama_ruangan}</span>
                      {item.menggantikan && (
                        <span className="text-[9px] font-extrabold text-[#941C2F] bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase ml-2 tracking-wide">
                          Menggantikan
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 text-xs font-bold text-slate-600 pt-1 border-t border-slate-100">
                      <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Asisten Dosen</span>
                        <span className="text-slate-700 font-extrabold block truncate mt-0.5">{item.nama_asdos}</span>
                        {item.nama_asdos_rekan && (
                          <span className="text-[11px] text-slate-400 font-medium block truncate mt-0.5">
                            Rekan: {item.nama_asdos_rekan}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 flex justify-between items-center gap-2 mt-2">
                      <div className="text-center flex-1 border-r border-slate-200/50 pr-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Check-In</span>
                        <span className="text-xs font-black text-slate-700 block mt-1">
                          {formatTime(item.waktu_checkin)}
                        </span>
                      </div>
                      <div className="text-center flex-1 pl-2">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Check-Out</span>
                        <span className="text-xs font-black text-slate-700 block mt-1">
                          {isLink ? 'Selesai Sesi' : formatTime(item.waktu_checkout)}
                        </span>
                      </div>
                    </div>

                    {item.deskripsi_materi && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold text-slate-600 italic leading-relaxed relative flex gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-extrabold text-[9px] tracking-wider uppercase text-slate-400 not-italic block mb-1">
                            JURNAL MATERI
                          </span>
                          <span className="line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                            {'"'}{item.deskripsi_materi}{'"'}
                          </span>
                        </div>
                      </div>
                    )}

                    {isLink && item.link_video && (
                      <a
                        href={item.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200/60 bg-rose-50/30 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all mt-2 active:scale-98"
                      >
                        <Video className="w-4 h-4" />
                        <span>Buka Link Rekaman Video</span>
                        <ExternalLink className="w-3 h-3 text-rose-400 shrink-0" />
                      </a>
                    )}

                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3 mt-4">
                  {isPendingStatus ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openConfirmModal(item, true)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verifikasi Kehadiran</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => openConfirmModal(item, false)}
                      className="w-full py-3 px-4 rounded-xl border border-rose-200 text-[#941C2F] hover:bg-rose-50/50 font-extrabold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Batalkan Verifikasi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {confirmModal.isOpen && confirmModal.item && (
        <>
          <div
            onClick={closeConfirmModal}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-out opacity-100"
          />

          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-4">
            <div className="w-full max-w-md bg-white rounded-[2.2rem] shadow-2xl p-7 pointer-events-auto border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-300 opacity-100 scale-100">

              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                    ${confirmModal.action 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-[#941C2F]'
                    }
                  `}
                >
                  {confirmModal.action ? (
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">
                    {confirmModal.action ? 'Konfirmasi Verifikasi' : 'Batalkan Verifikasi'}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    {confirmModal.action ? 'Setujui Kehadiran?' : 'Batalkan Persetujuan?'}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 mb-5">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                  <span>Asisten Dosen:</span>
                  <span className="text-slate-800 font-extrabold">{confirmModal.item.nama_asdos}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                  <span>Mata Kuliah:</span>
                  <span className="text-slate-800 font-extrabold max-w-[200px] truncate">
                    {confirmModal.item.nama_mata_kuliah}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#941C2F] font-black border-b border-slate-200/50 pb-2">
                  <span>Tanggal Sesi:</span>
                  <span>{formatDate(confirmModal.item.tanggal_mengajar)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Tipe Absensi:</span>
                  <span className="text-slate-800 font-extrabold uppercase">
                    {confirmModal.item.tipe_absensi === 'link' ? 'Video (Malam)' : 'QR Code'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                {confirmModal.action
                  ? 'Dengan menyetujui, kehadiran asisten ini akan ditandai terverifikasi di dalam sistem dan dimasukkan ke dalam rekapitulasi honor mengajar asisten.'
                  : 'Membatalkan verifikasi akan merubah status asisten kembali menjadi pending/belum terverifikasi. Rekapitulasi honor asisten untuk sesi ini akan dibekukan sementara.'
                }
              </p>

              <div className="flex gap-3 mt-auto pt-2">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200/70 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleVerify}
                  className={`
                    flex-1 py-3.5 rounded-2xl text-white font-extrabold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer
                    ${confirmModal.action
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                      : 'bg-[#941C2F] hover:bg-[#7a1728] shadow-md shadow-[#941C2F]/10'
                    }
                  `}
                >
                  {confirmModal.action ? 'Verifikasi' : 'Batalkan'}
                </button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
