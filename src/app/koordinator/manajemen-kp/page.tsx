'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  X,
  BookOpen,
  MessageSquare,
  ShieldAlert,
  Check,
  XCircle,
  Search,
  Inbox,
  Loader2,
  FileText,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllSubstitutions,
  updateSubstitutionStatus
} from '@/lib/actions/pergantian-kelas';
import type { SubstituteSessionDetail } from '@/types/api';
import { usePergantianKelasStore } from '@/store/usePergantianKelasStore';

type TabId = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function ManajemenKpPage() {

  const { substitutionList, isLoading, setSubstitutions, updateStatusLocal, setIsLoading } = usePergantianKelasStore();

  const [activeTab, setActiveTab] = useState<TabId>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubstituteSessionDetail | null>(null);
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | 'NONE'>('NONE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLoadedRef = useRef(false);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedRef.current) {
      setIsLoading(true);
    }
    try {
      const res = await getAllSubstitutions(undefined);
      if (res.success && res.data?.items) {
        setSubstitutions(res.data.items);
        hasLoadedRef.current = true;
      } else if (!silent) {
        setSubstitutions([]);
        toast.error(res.message || 'Gagal memuat data pengajuan.');
        hasLoadedRef.current = true;
      }
    } catch {
      if (!silent) {
        setSubstitutions([]);
        toast.error('Terjadi kesalahan saat menghubungi server.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [setSubstitutions, setIsLoading]);

  useEffect(() => {
    fetchRequests(false);
  }, [fetchRequests]);

  const openModal = (req: SubstituteSessionDetail, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setModalType(type);
    setRejectionReason('');
    setIsClosing(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedRequest(null);
      setModalType('NONE');
      setRejectionReason('');
      setIsClosing(false);
    }, 300);
  };

  const handleVerifyStatus = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);

    const action = modalType === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
    const reasonPayload = modalType === 'REJECT' ? rejectionReason.trim() : null;

    try {

      updateStatusLocal(selectedRequest.id, action, reasonPayload);

      const res = await updateSubstitutionStatus(selectedRequest.id, {
        status: action,
        coordinator_reason: reasonPayload
      });

      if (res.success) {
        toast.success(
          action === 'VERIFIED'
            ? 'Pengajuan kuliah pengganti berhasil disetujui!'
            : 'Pengajuan kuliah pengganti telah ditolak.'
        );
        closeModal();
      } else {
        toast.error(res.message || 'Gagal memperbarui status pengajuan.');

        fetchRequests(true);
      }
    } catch {
      toast.error('Gagal memperbarui status pengajuan.');

      fetchRequests(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = substitutionList.filter(req => {

    if (activeTab !== 'ALL') {
      if (req.status !== activeTab) return false;
    }

    const course = (req.session?.mata_kuliah || '').toLowerCase();
    const className = (req.session?.nama_kelas || '').toLowerCase();
    const teacher = (req.substitute_teacher || '').toLowerCase();
    const originalTeacher = (req.session?.pengajar || '').toLowerCase();
    const search = searchQuery.toLowerCase();

    return (
      course.includes(search) ||
      className.includes(search) ||
      teacher.includes(search) ||
      originalTeacher.includes(search)
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

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 min-h-screen pb-24 md:pb-12 font-sans">

      <div className="mb-6 md:mb-8 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">
            Manajemen KP
          </p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Kuliah Pengganti</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base max-w-xl">
            Tinjau, setujui, atau tolak permohonan penjadwalan kelas pengganti dari asisten dosen.
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">

        <div className="w-full z-20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="hidden md:block md:w-auto">
            <div className="p-1 rounded-2xl border border-slate-200/80 bg-white/95 flex gap-1 overflow-x-auto hide-scrollbar">
              {(
                [
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'VERIFIED', label: 'Disetujui' },
                  { id: 'REJECTED', label: 'Ditolak' },
                  { id: 'ALL', label: 'Semua' }
                ] as const
              ).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 min-w-fit px-5 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all active:scale-[0.98] select-none
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

          <div className="w-full md:w-80 shrink-0 flex items-center gap-2">

            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari matkul, kelas, atau asdos"
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

            <div className="relative md:hidden shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className={`
                  p-3.5 rounded-2xl border border-slate-200/80 bg-white/95 text-slate-600 hover:text-slate-800 active:scale-95 transition-all flex items-center justify-center relative
                  ${activeTab !== 'PENDING' ? 'border-[#941C2F]/30 bg-[#941C2F]/5 text-[#941C2F]' : ''}
                `}
              >
                <Filter className="w-5 h-5" />

                {activeTab !== 'PENDING' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#941C2F]" />
                )}
              </button>

              {isMobileFilterOpen && (
                <>

                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsMobileFilterOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/85 rounded-2xl p-1.5 shadow-xl backdrop-blur-md z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    {(
                      [
                        { id: 'PENDING', label: 'Pending' },
                        { id: 'VERIFIED', label: 'Disetujui' },
                        { id: 'REJECTED', label: 'Ditolak' },
                        { id: 'ALL', label: 'Semua' }
                      ] as const
                    ).map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileFilterOpen(false);
                          }}
                          className={`
                            w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] select-none
                            ${isActive 
                              ? 'bg-[#941C2F]/10 text-[#941C2F]' 
                              : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }
                          `}
                        >
                          <span>{tab.label}</span>
                          {isActive && <Check className="w-4 h-4 text-[#941C2F]" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {isLoading ? (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-shimmer space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
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
                  <div className="h-10 bg-slate-100 rounded-xl flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (

          <div className="text-center max-w-xl mx-auto mt-12 py-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/50 border border-slate-200/50 flex items-center justify-center text-slate-400">
              <Inbox size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Tidak Ada Pengajuan</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              {searchQuery 
                ? 'Tidak ada pengajuan kelas pengganti yang cocok dengan kata pencarian Anda.'
                : `Tidak ada permohonan kelas pengganti berstatus "${activeTab === 'ALL' ? 'Semua' : activeTab === 'PENDING' ? 'Pending' : activeTab === 'VERIFIED' ? 'Disetujui' : 'Ditolak'}" saat ini.`
              }
            </p>
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map(req => {
              const isPendingStatus = req.status === 'PENDING';
              const isVerifiedStatus = req.status === 'VERIFIED';
              const isRejectedStatus = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">

                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3.5 items-center min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                          <BookOpen size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-[15px] text-[#1F2937] truncate leading-tight">
                            {req.session?.mata_kuliah || 'Kuliah Pengganti'}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 mt-0.5 truncate">{req.session?.nama_kelas || '—'}</p>
                        </div>
                      </div>

                      <span
                        className={`
                          text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg border uppercase shrink-0
                          ${isPendingStatus 
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : isVerifiedStatus
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }
                        `}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="relative pt-2 space-y-4">

                      <div className="absolute left-[11px] top-6 bottom-4 w-0.5 border-l-2 border-dashed border-slate-200 z-0" />

                      <div className="relative z-10 flex gap-3.5 items-start">
                        <div className="w-[24px] h-[24px] rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black text-slate-500">
                          1
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">JADWAL ASLI</span>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(req.original_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.session?.waktu || 'Regular'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.session?.ruangan || '—'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex gap-3.5 items-start">
                        <div className="w-[24px] h-[24px] rounded-full bg-[#941C2F]/5 border border-[#941C2F]/15 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black text-[#941C2F]">
                          2
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-[#941C2F] tracking-wider uppercase block">JADWAL PENGGANTI</span>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#941C2F]">
                              <CalendarDays className="w-3.5 h-3.5 text-[#941C2F]/60 shrink-0" />
                              <span>{formatDate(req.substitute_date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{req.time_slot}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Ruang {req.room}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-400 font-semibold">Mengajar:</span>
                        <span className="truncate">{req.substitute_teacher}</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs font-semibold text-slate-600 italic leading-relaxed relative overflow-hidden flex gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-[10px] tracking-wider uppercase text-slate-400 not-italic block mb-1">
                            ALASAN ASDOS:
                          </span>
                          {'"'}{req.reason}{'"'}
                        </div>
                      </div>

                      {isRejectedStatus && req.coordinator_reason && (
                        <div className="bg-rose-50/60 border border-rose-100/50 rounded-xl p-3.5 text-xs font-bold text-rose-700 flex gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-[10px] tracking-wider uppercase text-rose-500 block mb-1">
                              CATATAN PENOLAKAN:
                            </span>
                            {'"'}{req.coordinator_reason}{'"'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isPendingStatus && (
                    <div className="pt-5 border-t border-slate-100 flex gap-3 mt-5">
                      <button
                        type="button"
                        onClick={() => openModal(req, 'REJECT')}
                        className="flex-1 py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-extrabold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(req, 'APPROVE')}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Setujui
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {modalType !== 'NONE' && selectedRequest && (
        <>

          <div
            onClick={() => {
              if (!isSubmitting) closeModal();
            }}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-out ${isModalVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
          />

          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-4">
            <div
              className={`
                w-full max-w-md bg-white rounded-[2.2rem] shadow-2xl p-7 pointer-events-auto border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-300
                ${isModalVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
              `}
            >

              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                    ${modalType === 'APPROVE' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-[#941C2F]'
                    }
                  `}
                >
                  {modalType === 'APPROVE' ? (
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">
                    {modalType === 'APPROVE' ? 'Konfirmasi Verifikasi' : 'Penolakan Kelas'}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    {modalType === 'APPROVE' ? 'Setujui Kuliah Pengganti?' : 'Tolak Kuliah Pengganti'}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 mb-5">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                  <span>Mata Kuliah:</span>
                  <span className="text-slate-800 font-extrabold max-w-[200px] truncate">
                    {selectedRequest.session?.mata_kuliah}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                  <span>Kelas:</span>
                  <span className="text-slate-800 font-extrabold">{selectedRequest.session?.nama_kelas}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#941C2F] font-black border-b border-slate-200/50 pb-2">
                  <span>Tanggal Baru:</span>
                  <span>{formatDate(selectedRequest.substitute_date)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Ruang & Jam:</span>
                  <span className="text-slate-800 font-bold">
                    R.{selectedRequest.room} ({selectedRequest.time_slot})
                  </span>
                </div>
              </div>

              {modalType === 'REJECT' ? (
                <div className="space-y-2 mb-6">
                  <label htmlFor="coordinator_reason" className="text-xs font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="coordinator_reason"
                    rows={3}
                    maxLength={150}
                    placeholder="Masukkan alasan penolakan agar asisten dosen mengetahui perbaikan yang diperlukan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#941C2F]/50 focus:border-[#941C2F]/50 transition-all resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                    <span>Minimal 5 karakter</span>
                    <span>{rejectionReason.trim().length} / 150</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                  Dengan menyetujui pengajuan ini, jadwal kuliah pengganti asisten dosen akan otomatis diaktifkan di dalam sistem dan mahasiswa dapat melakukan check-in pada tanggal tersebut.
                </p>
              )}

              <div className="flex gap-3 mt-auto pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200/70 font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleVerifyStatus}
                  disabled={
                    isSubmitting ||
                    (modalType === 'REJECT' && rejectionReason.trim().length < 5)
                  }
                  className={`
                    flex-1 py-3.5 rounded-2xl text-white font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer
                    ${modalType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                      : 'bg-[#941C2F] hover:bg-[#7a1728] shadow-md shadow-[#941C2F]/10'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : modalType === 'APPROVE' ? (
                    <>Setujui <Check className="w-4 h-4" /></>
                  ) : (
                    <>Tolak Pengajuan <XCircle className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
