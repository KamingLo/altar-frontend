'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { CalendarPlus, Clock, CheckCircle2, XCircle, Check, X, Trash2, MapPin, Calendar } from 'lucide-react';
import { getAllSubstitutions, createSubstitution, deleteSubstitution } from '@/lib/actions/pergantian-kelas';
import { getRuanganList } from '@/lib/actions/data-master';
import { getSessionsByDate } from '@/lib/actions/jadwal';
import type { SubstituteSessionDetail } from '@/types/api';
import type { RuanganItem } from '@/types/api';
import type { SessionFromAPI } from '@/lib/actions/jadwal';
import { AsdosLoadingState, AsdosPageHeader, AsdosPageShell, AsdosPrimaryButton, AsdosState } from '@/components/dashboard/asdos/AsdosUI';

const DROPDOWN_LIMIT = 500;
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
  PENDING:  { icon: Clock,        bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   label: 'Menunggu'  },
  VERIFIED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Disetujui' },
  REJECTED: { icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    label: 'Ditolak'   },
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
  const [history, setHistory] = useState<SubstituteSessionDetail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
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
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await getAllSubstitutions();
      if (res.success && res.data) {
        setHistory(res.data.items ?? []);
      } else {
        setHistoryError(res.message || 'Gagal memuat riwayat.');
      }
    } catch (e: unknown) {
      setHistoryError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => {
    setClientToday(todayIso());
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    let cancelled = false;
    setDropdownLoading(true);
    setDropdownError(null);

    Promise.all([
      getRuanganList(1, '', DROPDOWN_LIMIT),
      originalDate ? getSessionsByDate(originalDate) : Promise.resolve(null),
    ]).then(([ruanganRes, sessionRes]) => {
      if (cancelled) return;
      if (!ruanganRes.success) {
        setDropdownError(ruanganRes.message || 'Gagal memuat daftar ruangan.');
      }
      if (sessionRes && !sessionRes.success) {
        setDropdownError(sessionRes.message || 'Gagal memuat daftar sesi.');
      }
      setRuanganList(ruanganRes.success ? ruanganRes.data?.items ?? [] : []);
      setSessionList(sessionRes?.success ? sessionRes.data ?? [] : []);
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
    setIsSheetClosing(false);
    setSheetDragY(0);
    setSubmitError(null);
    setTimeout(() => setIsSheetVisible(true), 10);
  };

  const handleCloseSheet = () => {
    if (isSuccess || submitLoading) return;
    setIsSheetClosing(true);
    setIsSheetVisible(false);
    setTimeout(() => {
      setIsFormOpen(false);
      setIsSheetClosing(false);
      setSheetDragY(0);
      setOriginalDate('');
      setSubstituteDate('');
      setIdSession('');
      setIdRuangan('');
      setSlotOption(1);
      setReason('');
      setSubmitError(null);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => setSheetStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };
  const handleTouchEnd = () => {
    if (sheetDragY > 100) handleCloseSheet();
    else setSheetDragY(0);
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
          fetchHistory();
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

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau batalkan pengajuan ini?')) return;
    setDeletingId(id);
    try {
      const res = await deleteSubstitution(id);
      if (res.success) {
        fetchHistory();
      } else {
        alert(res.message || 'Gagal membatalkan pengajuan.');
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan.');
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
      <div className="space-y-3 pb-28 md:pb-8 px-4 md:px-0">
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
              
              {/* Mobile View */}
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

              {/* Desktop View */}
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
          <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 mt-2 text-center md:text-left">
            Menampilkan {history.length} pengajuan kelas pengganti.
          </p>
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

      {isFormOpen && (
        <>
          <div
            onClick={handleCloseSheet}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out
              ${isSheetVisible && !isSheetClosing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md md:max-w-xl bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[85vh] overflow-hidden pointer-events-auto"
              style={{
                transform: (!isSheetVisible || isSheetClosing)
                  ? 'translateY(100%)'
                  : `translateY(${sheetDragY}px)`,
                transition: (!isSheetVisible || isSheetClosing || sheetDragY === 0)
                  ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  : 'none',
              }}
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none shrink-0"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pt-2 md:pt-6 pb-6 overflow-y-auto">
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
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Pengajuan Kelas Pengganti</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Isi formulir untuk mengajukan kelas pengganti.</p>
                      </div>
                      <button onClick={handleCloseSheet}
                        className="hidden md:flex shrink-0 w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors ml-4">
                        <X size={18} />
                      </button>
                    </div>
                    
                    {dropdownLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-7 h-7 border-4 border-[#941C2F]/20 border-t-[#941C2F] rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
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
                              <select
                                value={idSession}
                                onChange={e => setIdSession(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all appearance-none"
                              >
                                <option value="">-- Pilih Sesi --</option>
                                {sessionList.map(s => (
                                  <option key={s.id_sesi} value={s.id_sesi}>
                                    {s.mata_kuliah} · {s.nama_kelas} · {s.waktu.split(', ')[1] ?? s.waktu}
                                  </option>
                                ))}
                              </select>
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
                            <select
                              value={slotOption}
                              onChange={e => setSlotOption(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all appearance-none"
                            >
                              {SLOT_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                              Ruangan
                            </label>
                            <select
                              value={idRuangan}
                              onChange={e => setIdRuangan(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all appearance-none"
                            >
                              <option value="">-- Pilih --</option>
                              {ruanganList.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.nama_ruangan} (Lt.{r.lantai})
                                </option>
                              ))}
                            </select>
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
                      </div>
                    )}
                  </>
                )}
              </div>

              {!isSuccess && !dropdownLoading && (
                <div className="sticky bottom-0 px-5 pb-6 md:pb-6 pt-4 border-t border-slate-100 bg-white">
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitLoading}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-md shadow-[#941C2F]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitLoading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</>
                      : 'Kirim Pengajuan'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AsdosPageShell>
  );
}
