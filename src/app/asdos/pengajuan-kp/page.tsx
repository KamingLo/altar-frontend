'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarPlus, Clock, CheckCircle2, XCircle, Check, X, Trash2, MapPin, Calendar } from 'lucide-react';
import { getAllSubstitutions, createSubstitution, deleteSubstitution } from '@/lib/actions/pergantian-kelas';
import { getRuanganList } from '@/lib/actions/data-master';
import { getSessionsByDate } from '@/lib/actions/jadwal';
import type { RuanganItem } from '@/types/api';
import type { SessionFromAPI } from '@/lib/actions/jadwal';
import { AsdosLoadingState, AsdosPageHeader, AsdosPageShell, AsdosPrimaryButton, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { usePengajuanKpStore } from '@/store/usePengajuanKpStore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { BottomSheet } from '@/components/ui/BottomSheet';

const DROPDOWN_LIMIT = 500;
const HISTORY_LIMIT = 10;
const SLOT_OPTIONS = [
  { value: 1, label: '07:30 – 09:10' },
  { value: 2, label: '09:30 – 11:10' },
  { value: 3, label: '11:30 – 13:10' },
  { value: 4, label: '13:30 – 15:10' },
  { value: 5, label: '15:30 – 17:10' },
  { value: 6, label: '17:40 – 19:15' },
  { value: 7, label: '19:30 – 21:00' },
];

type KpStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
const statusConfig: Record<KpStatus, { icon: React.ElementType; bg: string; text: string; border: string; label: string }> = {
  PENDING: { icon: Clock, bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', label: 'Menunggu' },
  VERIFIED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Disetujui' },
  REJECTED: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'Ditolak' },
};

function formatDate(iso: string) {
  if (!iso) return '-';
  const datePart = iso.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const d = year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function PengajuanKpPage() {
  const { items: history, total: historyTotal, loadedPages, setPage, removeItem, reset } = usePengajuanKpStore();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [originalDate, setOriginalDate] = useState('');
  const [substituteDate, setSubstituteDate] = useState('');
  const [idSession, setIdSession] = useState('');
  const [idRuangan, setIdRuangan] = useState('');
  const [slotOption, setSlotOption] = useState(1);
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientToday, setClientToday] = useState('');
  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([]);
  const [sessionList, setSessionList] = useState<SessionFromAPI[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const fetchHistory = useCallback(async (page = 1, append = false, force = false) => {
    if (!force && loadedPages[page]) {
      setHistoryLoading(false);
      setLoadingMore(false);
      return;
    }

    if (append) setLoadingMore(true);
    else setHistoryLoading(true);

    setHistoryError(null);
    try {
      const res = await getAllSubstitutions({ page, limit: HISTORY_LIMIT });
      if (res.success && res.data) {
        setPage(page, res.data.items ?? [], res.data.total ?? 0);
        setCurrentPage(page);
      } else {
        setHistoryError(res.message || 'Gagal memuat riwayat.');
      }
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setHistoryLoading(false);
      setLoadingMore(false);
    }
  }, [loadedPages, setPage]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => {
    setClientToday(todayIso());
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    let cancelled = false;
    setDropdownLoading(true);
    setDropdownError(null);

    getRuanganList(1, '', DROPDOWN_LIMIT).then((ruanganRes) => {
      if (cancelled) return;
      if (!ruanganRes.success) {
        setDropdownError(ruanganRes.message || 'Gagal memuat daftar ruangan.');
      }
      setRuanganList(ruanganRes.success ? ruanganRes.data?.items ?? [] : []);
    }).catch((e: unknown) => {
      if (cancelled) return;
      setDropdownError(e instanceof Error ? e.message : 'Gagal memuat data form.');
    }).finally(() => {
      if (!cancelled) setDropdownLoading(false);
    });

    return () => { cancelled = true; };
  }, [isFormOpen]);

  useEffect(() => {
    if (!isFormOpen || !originalDate) return;
    let cancelled = false;
    setDropdownError(null);

    getSessionsByDate(originalDate).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setDropdownError(res.message || 'Gagal memuat sesi pada tanggal ini.');
        setSessionList([]);
        setIdSession('');
        return;
      }
      setSessionList(res.data ?? []);
      setIdSession('');
    }).catch((e: unknown) => {
      if (cancelled) return;
      setDropdownError(e instanceof Error ? e.message : 'Gagal memuat sesi pada tanggal ini.');
      setSessionList([]);
      setIdSession('');
    });

    return () => { cancelled = true; };
  }, [originalDate, isFormOpen]);

  const handleOpenSheet = () => {
    setIsFormOpen(true);
    setSubmitError(null);
  };

  const handleCloseSheet = () => {
    if (isSuccess || submitLoading) return;
    setIsFormOpen(false);
    setOriginalDate('');
    setSubstituteDate('');
    setIdSession('');
    setIdRuangan('');
    setSlotOption(1);
    setReason('');
    setSubmitError(null);
  };

  const handleOpenDelete = (id: string) => {
    setTargetDeleteId(id);
    setIsDeleteOpen(true);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    if (deletingId) return;
    setIsDeleteOpen(false);
    setTargetDeleteId(null);
    setDeleteError(null);
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await createSubstitution({
        id_session: idSession,
        id_ruangan: idRuangan,
        substitute_date: substituteDate,
        original_date: originalDate,
        slot_option: slotOption,
        reason,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          handleCloseSheet();
          reset();
          fetchHistory(1, false, true);
        }, 2000);
      } else {
        setSubmitError(res.message || 'Gagal mengajukan kelas pengganti.');
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    handleOpenDelete(id);
  };

  const confirmDelete = async () => {
    if (!targetDeleteId) return;
    setDeletingId(targetDeleteId);
    setDeleteError(null);
    try {
      const res = await deleteSubstitution(targetDeleteId);
      if (res.success) {
        removeItem(targetDeleteId);
        handleCloseDelete();
      } else {
        setDeleteError(res.message || 'Gagal membatalkan pengajuan.');
      }
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setDeletingId(null);
    }
  };

  const isFormValid =
    originalDate.trim() !== '' &&
    substituteDate.trim() !== '' &&
    idSession.trim() !== '' &&
    idRuangan.trim() !== '' &&
    reason.trim() !== '';
  const hasMoreHistory = history.length < historyTotal;

  return (
    <AsdosPageShell>
      <AsdosPageHeader
        eyebrow="Kelas Pengganti"
        title="Riwayat Kelas Pengganti"
        description="Daftar pengajuan Kelas Pengganti Anda."
        action={
          <AsdosPrimaryButton onClick={handleOpenSheet} icon={<CalendarPlus size={18} />} className="hidden md:flex py-3 px-6 text-[15px] mt-4 md:mt-0">
            Ajukan Kelas Pengganti
          </AsdosPrimaryButton>
        }
      />
      <div className="space-y-3 pb-28 md:pb-8">
        {historyLoading && (
          <AsdosLoadingState message="Memuat riwayat..." />
        )}

        {historyError && !historyLoading && (
          <AsdosState variant="error" message={historyError} />
        )}

        {!historyLoading && !historyError && history.length === 0 && (
          <AsdosState icon={<CalendarPlus size={24} />} title="Belum ada pengajuan." message="Ajukan kelas pengganti lewat tombol di bawah." className="p-10 rounded-[2rem]" />
        )}

        {!historyLoading && !historyError && history.map(item => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          const isPending = item.status === 'PENDING';
          const session = item.session;
          return (
            <div key={item.id}
              className="bg-white rounded-2xl md:rounded-[1.25rem] p-4 md:px-5 md:py-4 shadow-sm border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all group">

              <div className="flex flex-col gap-3 md:hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#941C2F] to-[#b3273e]">
                      <CalendarPlus size={22} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[15px] text-[#1F2937] leading-tight truncate">{session?.mata_kuliah ?? 'Mata kuliah tidak tersedia'}</h3>
                      <p className="text-xs font-semibold text-slate-500 mt-1 truncate">{session?.nama_kelas ?? 'Kelas tidak tersedia'}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 ml-3 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1.5`}>
                    <Icon size={12} strokeWidth={2.5} />
                    {cfg.label}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">
                      {formatDate(item.original_date)} → {formatDate(item.substitute_date)}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">{item.time_slot}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{item.room}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <p className="text-xs text-slate-500 italic line-clamp-1 flex-1">&quot;{item.reason}&quot;</p>
                    {isPending && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 border border-rose-100 transition-colors">
                        {deletingId === item.id
                          ? <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-500 rounded-full animate-spin" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    )}
                  </div>
                </div>

                {item.status === 'REJECTED' && item.coordinator_reason && (
                  <div className="bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Alasan Ditolak</p>
                    <p className="text-xs text-rose-600 leading-tight">{item.coordinator_reason}</p>
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center bg-rose-50 text-[#941C2F] shadow-sm">
                      <CalendarPlus size={22} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-[#1F2937] truncate">{session?.mata_kuliah ?? 'Mata kuliah tidak tersedia'}</h3>
                      <p className="text-[13px] font-semibold text-[#8BA3CB] truncate">{session?.nama_kelas ?? 'Kelas tidak tersedia'}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold tracking-widest uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    <Icon size={14} strokeWidth={2.5} />
                    <span>{cfg.label}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Calendar size={13} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">
                        {formatDate(item.original_date)} → {formatDate(item.substitute_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Clock size={13} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">{item.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">{item.room}</span>
                    </div>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 border border-rose-100 transition-colors disabled:opacity-50">
                      {deletingId === item.id
                        ? <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-500 rounded-full animate-spin" />
                        : <Trash2 size={16} />
                      }
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-start gap-2">
                  <div className="flex-1 bg-slate-50/50 border border-slate-100 px-3.5 py-2 rounded-xl">
                    <p className="text-xs text-slate-500 italic line-clamp-1">&quot;{item.reason}&quot;</p>
                  </div>
                </div>

                {item.status === 'REJECTED' && item.coordinator_reason && (
                  <div className="mt-3 bg-rose-50 border border-rose-100 px-4 py-3 rounded-xl">
                    <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1">Alasan Ditolak</p>
                    <p className="text-xs text-rose-600 leading-relaxed">{item.coordinator_reason}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}


        {!historyLoading && !historyError && history.length > 0 && (
          <>
            <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 mt-2 text-center md:text-left">
              Menampilkan {history.length} dari {historyTotal} pengajuan kelas pengganti.
            </p>
            {hasMoreHistory && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchHistory(currentPage + 1, true)}
                  disabled={loadingMore}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-[#941C2F]/30 hover:text-[#941C2F] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loadingMore ? 'Memuat...' : 'Show More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10">
        <div className="max-w-md mx-auto">
          <button onClick={handleOpenSheet}
            className="w-full flex items-center justify-center gap-2 bg-[#941C2F] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all text-[15px]">
            <CalendarPlus size={18} /><span>Ajukan Kelas Pengganti</span>
          </button>
        </div>
      </div>

      <BottomSheet
        isOpen={isFormOpen}
        onClose={handleCloseSheet}
        title="Pengajuan Kelas Pengganti"
        subtitle="Isi formulir untuk mengajukan kelas pengganti."
      >
        {isSuccess ? (
          <div className="h-56 md:h-64 flex flex-col items-center justify-center text-center">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-28 h-28 bg-[#941C2F]/5 rounded-full animate-ping" />
              <div className="absolute w-20 h-20 bg-[#941C2F]/10 rounded-full" />
              <div className="relative w-14 h-14 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30">
                <Check size={28} strokeWidth={3} />
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-[#1F2937] mb-1">Pengajuan Berhasil!</h2>
            <p className="text-sm text-slate-500">Formulir Kelas Pengganti Anda telah disubmit.</p>
          </div>
        ) : (
          <>
            {dropdownLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-7 h-7 border-4 border-[#941C2F]/20 border-t-[#941C2F] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {dropdownError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
                    ⚠️ {dropdownError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                    Tanggal Kelas Asli (yang Dibatalkan)
                  </label>
                  <input
                    type="date"
                    value={originalDate}
                    onChange={e => setOriginalDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all"
                  />
                </div>

                {originalDate && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                      Sesi yang Diganti
                    </label>
                    {sessionList.length === 0 ? (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-400 italic">
                        Tidak ada jadwal pada tanggal ini.
                      </div>
                    ) : (
                      <CustomSelect
                        value={idSession}
                        onChange={setIdSession}
                        options={sessionList.map(s => ({
                          value: s.id_sesi,
                          label: s.mata_kuliah,
                          description: `${s.nama_kelas} · ${s.waktu.split(', ')[1] ?? s.waktu}`,
                        }))}
                        placeholder="-- Pilih Sesi --"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                    Tanggal Kelas Pengganti
                  </label>
                  <input
                    type="date"
                    value={substituteDate}
                    min={clientToday}
                    onChange={e => setSubstituteDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                      Slot Jam
                    </label>
                    <CustomSelect
                      value={String(slotOption)}
                      onChange={val => setSlotOption(Number(val))}
                      options={SLOT_OPTIONS.map(s => ({
                        value: String(s.value),
                        label: s.label,
                      }))}
                      placeholder="-- Pilih Slot --"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                      Ruangan
                    </label>
                    <CustomSelect
                      value={idRuangan}
                      onChange={setIdRuangan}
                      options={ruanganList.map(r => ({
                        value: r.id,
                        label: r.nama_ruangan,
                        description: `Lantai ${r.lantai}`,
                      }))}
                      placeholder="-- Pilih --"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                    Alasan Pengajuan
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Masukkan alasan Anda..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28"
                  />
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold">
                    ⚠️ {submitError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 bg-white">
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitLoading}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-md shadow-[#941C2F]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...
                      </>
                    ) : (
                      'Kirim Pengajuan'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={isDeleteOpen}
        onClose={handleCloseDelete}
        maxWidthClassName="max-w-sm"
      >
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-center w-14 h-14 bg-rose-50 rounded-2xl mx-auto mb-5 text-[#941C2F]">
            <Trash2 size={24} />
          </div>
          <h2 className="text-[20px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">
            Batalkan Pengajuan?
          </h2>
          <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
            Apakah Anda yakin ingin membatalkan pengajuan kelas pengganti ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          {deleteError && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-semibold mb-6 flex items-center gap-2 text-left">
              <span>⚠️</span>
              <span className="flex-1">{deleteError}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={confirmDelete}
              disabled={!!deletingId}
              className="w-full py-4 rounded-2xl bg-[#941C2F] text-white font-bold text-[15px] shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deletingId ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Ya, Batalkan'
              )}
            </button>
            <button
              onClick={handleCloseDelete}
              disabled={!!deletingId}
              className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-[15px] hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </BottomSheet>
    </AsdosPageShell>
  );
}
