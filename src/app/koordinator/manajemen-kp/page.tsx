'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  CheckCircle2,
  X,
  Check,
  XCircle,
  Search,
  Inbox,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllSubstitutions,
  updateSubstitutionStatus
} from '@/lib/actions/pergantian-kelas';
import type { SubstituteSessionDetail } from '@/types/api';
import { usePergantianKelasStore } from '@/store/usePergantianKelasStore';
import { AsdosPageShell, AsdosPageHeader, AsdosState } from '@/components/dashboard/asdos/AsdosUI';
import { CustomSelect } from '@/components/ui/CustomSelect';

type TabId = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export default function ManajemenKpPage() {

  const { substitutionList, isLoading, setSubstitutions, updateStatusLocal, setIsLoading } = usePergantianKelasStore();

  const [activeTab, setActiveTab] = useState<TabId>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
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
    setIsModalVisible(false);
    setTimeout(() => setIsModalVisible(true), 10);
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
    <AsdosPageShell>

      <AsdosPageHeader
        eyebrow="Manajemen KP"
        title="Kuliah Pengganti"
        description="Tinjau, setujui, atau tolak permohonan penjadwalan kelas pengganti dari asisten dosen."
      />

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
                className="w-full pl-11 pr-4 py-3.5 rounded-[14px] md:rounded-2xl border border-slate-200 outline-none text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
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

            <div className="md:hidden shrink-0">
              <CustomSelect
                variant="icon"
                align="right"
                value={activeTab}
                onChange={v => setActiveTab(v as TabId)}
                options={[
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'VERIFIED', label: 'Disetujui' },
                  { value: 'REJECTED', label: 'Ditolak' },
                  { value: 'ALL', label: 'Semua' },
                ]}
                placeholder="Filter status"
                icon={<Filter className="w-[18px] h-[18px]" />}
                triggerClassName={activeTab !== 'PENDING' ? 'bg-red-50 border-crimson text-crimson' : ''}
              />
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

          <AsdosState
            icon={<Inbox size={24} />}
            title="Tidak Ada Pengajuan"
            message={
              searchQuery
                ? 'Tidak ada pengajuan kelas pengganti yang cocok dengan kata pencarian Anda.'
                : `Tidak ada permohonan kelas pengganti berstatus "${activeTab === 'ALL' ? 'Semua' : activeTab === 'PENDING' ? 'Pending' : activeTab === 'VERIFIED' ? 'Disetujui' : 'Ditolak'}" saat ini.`
            }
            className="mt-8"
          />
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map(req => {
              const isPendingStatus = req.status === 'PENDING';
              const isRejectedStatus = req.status === 'REJECTED';

              const statusCfg =
                req.status === 'PENDING'
                  ? { bg: 'bg-fog', text: 'text-ink', label: 'MENUNGGU' }
                  : req.status === 'VERIFIED'
                    ? { bg: 'bg-obsidian', text: 'text-white', label: 'DISETUJUI' }
                    : { bg: 'bg-crimson', text: 'text-white', label: 'DITOLAK' };

              const penggantiName = (req.substitute_teacher || '').replace(/\s*\(pengganti\)\s*/gi, '').trim() || req.substitute_teacher || '—';

              return (
                <section
                  key={req.id}
                  className="bg-white rounded-[12px] p-5 border border-slate-100 flex flex-col w-full shadow-sm hover:shadow-md transition-all"
                >
                  <article className="flex flex-col flex-1 gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-bold text-slate-900 leading-snug line-clamp-2 text-sm md:text-sm">
                          {req.session?.mata_kuliah ?? 'Kuliah Pengganti'}
                        </h2>
                        <p className="text-slate-500 font-medium text-[11px] mt-0.5 truncate">
                          {req.session?.nama_kelas ?? 'Kelas tidak tersedia'}
                        </p>
                      </div>
                      {req.status !== 'VERIFIED' && (
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-2 gap-x-0 gap-y-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tgl Asli</span>
                          <span className="text-[11px] font-bold text-slate-800">{formatDate(req.original_date)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tgl Pengganti</span>
                          <span className="text-[11px] font-bold text-slate-800">{formatDate(req.substitute_date)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                          <span className="text-[11px] font-bold text-slate-800">{req.session?.waktu || '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Waktu Baru</span>
                          <span className="text-[11px] font-bold text-slate-800">{req.time_slot}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                          <span className="text-[11px] font-bold text-slate-800 truncate" title={req.session?.ruangan || ''}>
                            {req.session?.ruangan || '—'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l-2 border-slate-100 pl-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ruangan Baru</span>
                          <span className="text-[11px] font-bold text-slate-800 truncate" title={req.room}>
                            {req.room}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 mb-1.5">
                        Mengajar
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate" title={req.substitute_teacher}>{penggantiName}</span>
                      </div>
                    </div>

                    <div className={`bg-fog rounded-[16px] p-3${!isPendingStatus ? ' flex-1' : ''}`}>
                      <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 block mb-1">
                        Alasan Pengajuan
                      </span>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        &quot;{req.reason}&quot;
                      </p>

                      {isRejectedStatus && req.coordinator_reason && (
                        <div className="mt-3 pt-3 border-t border-slate-200/70">
                          <span className="text-[9px] font-extrabold tracking-wider uppercase text-crimson/80 block mb-1">
                            Alasan Ditolak
                          </span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {req.coordinator_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {isPendingStatus && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() => openModal(req, 'REJECT')}
                          className="w-10 h-10 rounded-full border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all flex items-center justify-center"
                          aria-label="Tolak"
                          title="Tolak"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(req, 'APPROVE')}
                          className="w-10 h-10 rounded-full border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all flex items-center justify-center"
                          aria-label="Setujui"
                          title="Setujui"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </article>
                </section>
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
                ${isModalVisible && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >

              {modalType === 'APPROVE' ? (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Konfirmasi Verifikasi</span>
                      <h3 className="text-xl font-black text-slate-800 leading-tight">Setujui Kuliah Pengganti?</h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 mb-5">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                      <span>Mata Kuliah:</span>
                      <span className="text-slate-800 font-extrabold max-w-[200px] truncate">{selectedRequest.session?.mata_kuliah}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-200/50 pb-2">
                      <span>Kelas:</span>
                      <span className="text-slate-800 font-extrabold">{selectedRequest.session?.nama_kelas}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-crimson font-black border-b border-slate-200/50 pb-2">
                      <span>Tanggal Baru:</span>
                      <span>{formatDate(selectedRequest.substitute_date)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                      <span>Ruang & Jam:</span>
                      <span className="text-slate-800 font-bold">R.{selectedRequest.room} ({selectedRequest.time_slot})</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                    Dengan menyetujui pengajuan ini, jadwal kuliah pengganti asisten dosen akan otomatis diaktifkan di dalam sistem dan mahasiswa dapat melakukan check-in pada tanggal tersebut.
                  </p>
                </>
              ) : (
                <div className="mb-5">
                  <label htmlFor="coordinator_reason" className="block text-xs font-extrabold text-slate-500 tracking-wider uppercase mb-2">
                    Alasan Penolakan
                  </label>
                  <textarea
                    id="coordinator_reason"
                    rows={4}
                    maxLength={100}
                    placeholder="Masukkan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-crimson/50 focus:border-crimson/50 transition-all resize-none leading-relaxed"
                  />
                  <div className="text-right text-[10px] font-bold text-slate-400 mt-1 pr-1">
                    {rejectionReason.length} / 100
                  </div>
                </div>
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
                    (modalType === 'REJECT' && rejectionReason.trim().length < 1)
                  }
                  className={`
                    flex-1 py-3.5 rounded-2xl text-white font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer
                    ${modalType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/10'
                      : 'bg-crimson hover:bg-[#7a1728] shadow-md shadow-crimson/10'
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

    </AsdosPageShell>
  );
}
