'use client';

import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import Image from 'next/image';
import {
  CalendarDays,
  Lock,
  Unlock,
  KeyRound,
  MonitorDot,
  RefreshCw,
  X,
  AlertCircle,
  ArrowRight,
  Loader2,
  Download
} from 'lucide-react';
import {
  setKioskPIN,
  verifyKioskPIN,
  deactivateKiosk,
  generateQRToken
} from '@/lib/actions/koordinator';
import { fetchSemesters, fetchSessions } from '@/lib/actions/manajemen-jadwal';
import { semesterLabel, pengajarDisplayName, todayIso } from '@/lib/jadwal-utils';
import type { SemesterItem, SessionTimeline } from '@/types/api';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { AsdosPageShell, AsdosPageHeader } from '@/components/dashboard/asdos/AsdosUI';

const REFRESH_INTERVAL_SEC = 240; 

export default function GenerateQrPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [todaySessions, setTodaySessions] = useState<SessionTimeline[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);

  const selectedSemester = useMemo(() => {
    return semesters.find(s => s.id === selectedSemesterId);
  }, [semesters, selectedSemesterId]);

  const semesterOptions = useMemo(() => {
    return semesters.map(s => ({
      value: s.id,
      label: semesterLabel(s.tahun_ajaran, s.tipe_semester)
    }));
  }, [semesters]);

  const [mode, setMode] = useState<'NORMAL' | 'KIOSK'>('NORMAL');
  const [qrToken, setQrToken] = useState('');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC);
  const [refreshCount, setRefreshCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPinVisible, setIsPinVisible] = useState(false);
  const [isPinClosing, setIsPinClosing] = useState(false);

  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [isExplanationClosing, setIsExplanationClosing] = useState(false);

  const [pinMode, setPinMode] = useState<'SET' | 'VERIFY_ENTER' | 'VERIFY_CHANGE' | 'NONE'>('NONE');
  const [enteredPin, setEnteredPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [pinError, setPinError] = useState('');

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isExitVisible, setIsExitVisible] = useState(false);
  const [isExitClosing, setIsExitClosing] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [exitError, setExitError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKioskActionLoading, setIsKioskActionLoading] = useState(false);

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');


  const formatDisplayDate = useCallback((raw: string) => {
    if (!raw) return '-';
    try {
      const datePart = raw.split('T')[0] || raw;
      const [y, m, d] = datePart.split('-').map(Number);
      const dt = y && m && d ? new Date(y, m - 1, d) : new Date(raw);
      return dt.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return raw;
    }
  }, []);

  const SessionCard = useCallback(({ s }: { s: SessionTimeline }) => {
    const timePart = s.waktu.includes(', ') ? s.waktu.split(', ')[1] : s.waktu;
    const pengajar = pengajarDisplayName(s.pengajar) || '-';
    const isPengganti = s.tipe === 'PENGGANTI';

    return (
      <section className="bg-white rounded-[12px] p-5 md:p-6 border border-slate-100 flex flex-col w-full">
        <article className="flex flex-col flex-1 gap-5">
          <div className="flex flex-col gap-1 w-full">
            <h2 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-1 text-sm md:text-base">
              {s.mata_kuliah}
            </h2>
            <p className="text-slate-500 font-medium text-[11px] md:text-xs">
              {s.nama_kelas || 'Kelas tidak tersedia'}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 pt-1 md:grid-cols-2 md:pt-0">
            <div className="flex flex-col gap-2.5 border-l border-slate-100 pl-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                <span className="font-bold text-slate-800 text-xs md:text-xs">{formatDisplayDate(s.tanggal)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                <span className="font-bold text-slate-800 text-xs md:text-xs break-words" title={s.ruangan}>{s.ruangan}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-l border-slate-100 pl-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</span>
                <span className="font-bold text-slate-800 text-xs md:text-xs">{timePart}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengajar</span>
                <span className="font-bold text-slate-800 text-xs md:text-xs break-words" title={pengajar}>{pengajar}</span>
              </div>
            </div>
          </div>

          {isPengganti && (
            <div className="flex items-center justify-end pt-1 mt-auto">
              <span className="text-[10px] font-bold bg-crimson/10 text-crimson border border-crimson/20 px-2.5 py-1 rounded-xl uppercase tracking-wider">
                Pengganti
              </span>
            </div>
          )}
        </article>
      </section>
    );
  }, [formatDisplayDate]);


  const loadSemestersData = useCallback(async () => {
    setIsSessionsLoading(true);
    const semRes = await fetchSemesters();
    if (semRes.success && semRes.items.length > 0) {
      setSemesters(semRes.items);
      setSelectedSemesterId(semRes.items[0].id);
    } else {
      setIsSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSemestersData();
  }, [loadSemestersData]);

  const loadSessionsData = useCallback(async (semesterId: string) => {
    if (!semesterId) return;
    setIsSessionsLoading(true);
    const today = todayIso();
    const schedRes = await fetchSessions({
      id_semester: semesterId,
      start_date: today,
      end_date: today,
    });
    if (schedRes.success) {
      setTodaySessions(schedRes.items);
    } else {
      setTodaySessions([]);
    }
    setIsSessionsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      loadSessionsData(selectedSemesterId);
    }
  }, [selectedSemesterId, loadSessionsData]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const refreshQRToken = useCallback(async () => {
    const res = await generateQRToken();
    startTransition(() => {
      if (res.success && res.data?.qr_token) {
        setQrToken(res.data.qr_token);
        setCountdown(REFRESH_INTERVAL_SEC);
      }
    });
  }, []);

  useEffect(() => {
    if (mode === 'KIOSK') {
      refreshQRToken();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'KIOSK' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [mode, countdown]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining(c => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleManualRefresh = useCallback(async () => {
    if (cooldownRemaining > 0) return;
    await refreshQRToken();
    setCountdown(REFRESH_INTERVAL_SEC);
    setRefreshCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setCooldownRemaining(10);
        return 0;
      }
      return next;
    });
  }, [refreshQRToken, cooldownRemaining]);

  const downloadQRCode = async () => {
    if (!qrToken) return;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrToken)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_Presensi_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrToken)}`;
      window.open(qrUrl, '_blank');
    }
  };

  const openExplanationModal = () => {
    setIsExplanationModalOpen(true);
    setIsExplanationClosing(false);
    setTimeout(() => setIsExplanationVisible(true), 10);
  };

  const closeExplanationModal = (thenOpenPIN = false) => {
    setIsExplanationClosing(true);
    setIsExplanationVisible(false);
    setTimeout(() => {
      setIsExplanationModalOpen(false);
      setIsExplanationClosing(false);
      if (thenOpenPIN) {
        openPinModal('SET');
      }
    }, 300);
  };

  const openPinModal = (targetMode: typeof pinMode) => {
    setPinMode(targetMode);
    setEnteredPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setIsConfirmStep(false);
    setIsPinModalOpen(true);
    setIsPinClosing(false);
    setTimeout(() => setIsPinVisible(true), 10);
  };

  const closePinModal = useCallback(() => {
    setIsPinClosing(true);
    setIsPinVisible(false);
    setTimeout(() => {
      setIsPinModalOpen(false);
      setIsPinClosing(false);
      setPinMode('NONE');
      setIsConfirmStep(false);
    }, 300);
  }, []);

  const transitionPinMode = useCallback((targetMode: typeof pinMode) => {
    setIsPinVisible(false);
    setTimeout(() => {
      setPinMode(targetMode);
      setEnteredPin('');
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      setIsConfirmStep(false);
      setIsPinVisible(true);
    }, 150);
  }, []);

  const openExitModal = () => {
    setExitPin('');
    setExitError('');
    setIsExitModalOpen(true);
    setIsExitClosing(false);
    setTimeout(() => setIsExitVisible(true), 10);
  };

  const closeExitModal = useCallback(() => {
    setIsExitClosing(true);
    setIsExitVisible(false);
    setTimeout(() => {
      setIsExitModalOpen(false);
      setIsExitClosing(false);
    }, 300);
  }, []);

  const handleActivateKioskClick = async () => {
    setIsKioskActionLoading(true);
    try {

      const res = await verifyKioskPIN("0000");
      const pinNotConfigured = res.message && res.message.toLowerCase().includes('not set');

      if (pinNotConfigured) {
        openExplanationModal();
      } else {
        openPinModal('VERIFY_ENTER');
      }
    } catch {
      openExplanationModal();
    } finally {
      setIsKioskActionLoading(false);
    }
  };

  const handleAturUbahPinClick = async () => {
    setIsKioskActionLoading(true);
    try {
      const res = await verifyKioskPIN("0000");
      const pinNotConfigured = res.message && res.message.toLowerCase().includes('not set');

      if (pinNotConfigured) {
        openPinModal('SET');
      } else {
        openPinModal('VERIFY_CHANGE');
      }
    } catch {
      openPinModal('SET');
    } finally {
      setIsKioskActionLoading(false);
    }
  };

  const handlePINSubmit = useCallback(async () => {
    setPinError('');
    setIsSubmitting(true);

    if (pinMode === 'SET') {
      if (!isConfirmStep) {
        if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
          setPinError('PIN harus berupa 4-6 digit angka.');
          setIsSubmitting(false);
          return;
        }
        setIsConfirmStep(true);
        setIsSubmitting(false);
        return;
      }

      if (confirmPin.length < 4 || confirmPin.length > 6 || !/^\d+$/.test(confirmPin)) {
        setPinError('Konfirmasi PIN harus berupa 4-6 digit angka.');
        setIsSubmitting(false);
        return;
      }

      if (newPin !== confirmPin) {
        setPinError('Konfirmasi PIN tidak cocok.');
        setIsSubmitting(false);
        return;
      }
      const res = await setKioskPIN(newPin);
      if (res.success) {
        transitionPinMode('VERIFY_ENTER');
      } else {
        setPinError(res.message || 'Gagal menyimpan PIN baru.');
      }
    } else if (pinMode === 'VERIFY_ENTER') {
      if (enteredPin.length < 4 || enteredPin.length > 6) {
        setPinError('PIN harus berupa 4-6 digit angka.');
        setIsSubmitting(false);
        return;
      }
      const res = await verifyKioskPIN(enteredPin);
      if (res.success) {

        const qrRes = await generateQRToken();
        if (qrRes.success && qrRes.data?.qr_token) {
          setQrToken(qrRes.data.qr_token);
          setMode('KIOSK');
          setCountdown(REFRESH_INTERVAL_SEC);
          closePinModal();
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          setPinError(qrRes.message || 'Gagal memuat token QR.');
        }
      } else {
        setPinError(res.message || 'PIN yang dimasukkan salah.');
      }
    } else if (pinMode === 'VERIFY_CHANGE') {
      if (enteredPin.length < 4 || enteredPin.length > 6) {
        setPinError('PIN harus berupa 4-6 digit angka.');
        setIsSubmitting(false);
        return;
      }
      const res = await verifyKioskPIN(enteredPin);
      if (res.success) {

        transitionPinMode('SET');
      } else {
        setPinError(res.message || 'PIN Verifikasi Salah.');
      }
    }
    setIsSubmitting(false);
  }, [pinMode, isConfirmStep, newPin, confirmPin, enteredPin, transitionPinMode, closePinModal]);

  const handleExitKiosk = useCallback(async () => {
    setExitError('');
    setIsSubmitting(true);
    if (exitPin.length < 4 || exitPin.length > 6) {
      setExitError('PIN harus berupa 4-6 digit angka.');
      setIsSubmitting(false);
      return;
    }
    const resVerify = await verifyKioskPIN(exitPin);
    if (resVerify.success) {
      const resDeact = await deactivateKiosk();
      if (resDeact.success) {
        setMode('NORMAL');
        setQrToken('');
        closeExitModal();
        document.exitFullscreen?.().catch(() => {});
      } else {
        setExitError(resDeact.message || 'Gagal menonaktifkan Kiosk.');
      }
    } else {
      setExitError('PIN Salah! Akses keluar ditolak.');
    }
    setIsSubmitting(false);
  }, [exitPin, closeExitModal]);

  const handleNumpadPress = useCallback((num: string, type: 'EXIT' | 'PIN') => {
    if (type === 'EXIT') {
      setExitError('');
      if (exitPin.length < 6) {
        setExitPin(prev => prev + num);
      }
    } else {
      setPinError('');
      if (pinMode === 'SET') {
        if (!isConfirmStep) {
          if (newPin.length < 6) {
            setNewPin(prev => prev + num);
          }
        } else {
          if (confirmPin.length < 6) {
            setConfirmPin(prev => prev + num);
          }
        }
      } else {
        if (enteredPin.length < 6) {
          setEnteredPin(prev => prev + num);
        }
      }
    }
  }, [exitPin, isConfirmStep, newPin, confirmPin, enteredPin, pinMode]);

  const handleNumpadBackspace = useCallback((type: 'EXIT' | 'PIN') => {
    if (type === 'EXIT') {
      setExitPin(prev => prev.slice(0, -1));
    } else {
      if (pinMode === 'SET') {
        if (isConfirmStep) {
          if (confirmPin.length > 0) {
            setConfirmPin(prev => prev.slice(0, -1));
          } else {
            setIsConfirmStep(false);
          }
        } else {
          setNewPin(prev => prev.slice(0, -1));
        }
      } else {
        setEnteredPin(prev => prev.slice(0, -1));
      }
    }
  }, [pinMode, isConfirmStep, confirmPin]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPinModalOpen && !isExitModalOpen) return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const type = isExitModalOpen ? 'EXIT' : 'PIN';

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadPress(e.key, type);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumpadBackspace(type);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (type === 'EXIT') {
          if (!isSubmitting && exitPin.length >= 4 && exitPin.length <= 6) {
            handleExitKiosk();
          }
        } else {
          const isButtonDisabled =
            isSubmitting ||
            (pinMode === 'SET'
              ? (!isConfirmStep
                  ? (newPin.length < 4 || newPin.length > 6)
                  : (confirmPin.length < 4 || confirmPin.length > 6))
              : (enteredPin.length < 4 || enteredPin.length > 6));
          if (!isButtonDisabled) {
            handlePINSubmit();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (type === 'EXIT') {
          if (!isSubmitting) closeExitModal();
        } else {
          if (!isSubmitting) closePinModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isPinModalOpen,
    isExitModalOpen,
    isSubmitting,
    pinMode,
    isConfirmStep,
    newPin,
    confirmPin,
    enteredPin,
    exitPin,
    handleExitKiosk,
    handleNumpadBackspace,
    handleNumpadPress,
    handlePINSubmit,
    closeExitModal,
    closePinModal,
  ]);

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-800 font-sans">

      {mode === 'NORMAL' && (
        <AsdosPageShell className="pb-24 md:pb-12">

          <AsdosPageHeader
            eyebrow="Presensi Asisten Dosen"
            title="Kiosk & QR Presensi"
            description="Konfigurasi kode QR asisten dosen atau jalankan layar Kiosk Mandiri di kelas Anda."
            className="relative z-10 !mb-4 md:!mb-8"
            action={
              <div className="relative shrink-0 w-full sm:w-48 md:w-56 z-30">
                <label className="block text-[10px] md:text-[11px] font-bold text-slate-400/90 tracking-widest uppercase mb-2.5 ml-1">
                  Semester
                </label>
                <CustomSelect
                  value={selectedSemesterId}
                  onChange={setSelectedSemesterId}
                  options={semesterOptions}
                  placeholder="Semester"
                  disabled={!semesters.length}
                  icon={<CalendarDays className="w-[18px] h-[18px]" />}
                  triggerClassName="rounded-2xl py-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
              </div>
            }
          />

          <div className="space-y-8 relative z-10">

            <div className="w-full">
              <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-crimson flex items-center justify-center shrink-0">
                    <MonitorDot className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-[16px] md:text-lg">Kiosk Mode Control</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Jalankan presensi asisten mandiri dengan proteksi layar penuh terkunci kelas.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto self-end xl:self-auto">
                  <button
                    type="button"
                    onClick={handleActivateKioskClick}
                    disabled={isKioskActionLoading || isSessionsLoading}
                    className="py-3.5 px-6 rounded-xl bg-crimson hover:bg-[#7a1728] text-white font-bold text-[14px] shadow-md shadow-crimson/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isKioskActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MonitorDot className="w-5 h-5" />
                    )}
                    {isKioskActionLoading ? 'Memproses...' : 'Aktifkan Kiosk Mode'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAturUbahPinClick}
                    disabled={isKioskActionLoading || isSessionsLoading}
                    className="py-3.5 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[14px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Atur / Ubah PIN Kiosk
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center mb-4 px-1">
                <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                  Sesi Mengajar Hari Ini ({todaySessions.length})
                </h3>
              </div>

              {isSessionsLoading ? (

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-[12px] p-4 md:p-6 border border-slate-100 animate-shimmer flex items-center gap-4">
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="h-4 bg-slate-100 rounded-lg w-2/5" />
                        <div className="h-3.5 bg-slate-100 rounded-lg w-1/3" />
                        <div className="flex gap-2 pt-1">
                          <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                          <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todaySessions.length === 0 ? (

                <div className="bg-white rounded-[12px] p-8 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <CalendarDays size={26} />
                  </div>
                  <p className="text-sm md:text-base font-semibold text-slate-700">Tidak ada sesi mengajar hari ini.</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                    Presensi Kiosk hanya valid jika ada jadwal aktif terdaftar di semester berjalan.
                  </p>
                </div>
              ) : (

                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {todaySessions.map(s => {
                    return (
                      <SessionCard key={s.id_sesi} s={s} />
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </AsdosPageShell>
      )}

      {mode === 'KIOSK' && (
        <div className="fixed inset-0 text-slate-800 z-[9999] overflow-y-auto lg:overflow-hidden flex flex-col p-6 pb-28 md:p-8 font-sans select-none animate-fade-in bg-canvas">

          <style>{`
            #dashboard-home-button-desktop,
            #dashboard-top-left,
            #dashboard-top-right,
            #dashboard-header-mobile,
            #dashboard-sidebar-desktop,
            #dashboard-clock-desktop,
            #dashboard-clock-mobile {
              display: none !important;
            }
            main {
              max-width: none !important;
              margin: 0 !important;
            }
            #dashboard-children-container {
              padding: 0 !important;
            }
          `}</style>

          <div className="absolute top-0 left-0 right-0 h-[45svh] lg:h-[35svh] z-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-cover bg-[center_top] opacity-30 lg:hidden"
              style={{ backgroundImage: "url('/gedung-untar.png')" }}
            />
            <div
              className="absolute inset-0 bg-cover bg-[center_top] opacity-20 hidden lg:block"
              style={{ backgroundImage: "url('/gedung-untar-fl.webp')" }}
            />
            <div
              className="absolute inset-0 z-10"
              style={{
                background: 'linear-gradient(to top, #f4f4f5 0%, #f4f4f5 15%, rgba(244, 244, 245, 0.8) 30%, rgba(244, 244, 245, 0.4) 45%, rgba(244, 244, 245, 0.1) 65%, transparent 100%)'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col min-h-full w-full">

            <div className="flex flex-row justify-between items-start gap-4 pb-5 shrink-0">
              <div className="min-w-0">
                <h1 className="hidden lg:block text-lg md:text-xl font-black text-slate-800 tracking-wider leading-tight">ALTAR PRESENSI KIOSK</h1>
                <p className="hidden lg:block text-xs text-slate-500 font-semibold mt-1">Sesi Presensi Asisten Aktif Kelas</p>
                <div className="mt-2 lg:hidden max-w-full">
                  <p className="text-xl font-black font-mono tracking-tight text-crimson">
                    {timeStr} <span className="text-[10px] font-extrabold text-slate-800 tracking-widest align-middle">WIB</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-800 tracking-wide mt-0.5 leading-snug break-words">{dateStr}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openExitModal}
                className="lg:hidden w-fit shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs shadow-sm active:scale-95 transition-all"
              >
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                Keluar
              </button>

              <div className="hidden lg:flex items-center gap-4 text-right">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">{dateStr}</p>
                  <p className="text-sm font-semibold text-slate-600 mt-0.5">Tahun Ajaran {selectedSemester?.tahun_ajaran || '—'}</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-2xl font-black font-mono tracking-tight text-crimson">{timeStr}</p>
                  <p className="text-[10px] font-extrabold text-slate-500 tracking-widest text-right">WIB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:flex-1 lg:min-h-0 h-auto mt-6 md:mt-8 mb-4 items-stretch">

              <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[1.75rem] p-4 shadow-sm lg:rounded-[2.5rem] lg:p-6 xl:p-8 flex flex-col items-center justify-center relative overflow-hidden text-slate-800">

                <div className="flex flex-col items-center w-full max-w-md lg:max-w-lg xl:max-w-xl">

                  <div className="flex flex-col items-center w-full">
                    <h2 className="text-base md:text-lg xl:text-2xl font-black text-slate-800 text-center tracking-tight">SCAN QR CHECK-IN</h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 mb-4 md:mb-6 text-center font-medium">Buka aplikasi asisten dosen Anda dan scan kode QR ini</p>
                  </div>

                  <div className="flex flex-col items-center w-full">
                    <div className="bg-white p-4 md:p-6 lg:p-8 rounded-[1.75rem] md:rounded-[2.5rem] xl:rounded-[3rem] shadow-[0_12px_30px_rgba(15,23,42,0.08)] lg:shadow-xl border border-slate-100 flex items-center justify-center aspect-square max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[420px] xl:max-w-[480px] w-full relative overflow-hidden">
                      {qrToken ? (
                        <>
                          <Image
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrToken)}`}
                            alt="QR Code"
                            width={500}
                            height={500}
                            className={`w-full h-full object-contain transition-all duration-300 ${countdown === 0 ? 'opacity-20 blur-sm' : ''}`}
                          />
                          {countdown === 0 && (
                            <button
                              type="button"
                              onClick={handleManualRefresh}
                              disabled={cooldownRemaining > 0}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RefreshCw className="w-10 h-10 text-crimson" />
                              <span className="text-xs font-extrabold text-crimson tracking-wide">
                                {cooldownRemaining > 0 ? `Tunggu ${cooldownRemaining}s` : 'Perbarui QR'}
                              </span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-crimson animate-spin" />
                          <p className="text-xs font-semibold text-slate-400">Generating...</p>
                        </div>
                      )}
                    </div>
                    {qrToken && (
                      <div className="mt-4 flex items-center gap-3 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[420px] xl:max-w-[480px]">
                        <button
                          type="button"
                          onClick={downloadQRCode}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-crimson text-white hover:bg-[#7a1728] active:scale-95 transition-all text-xs md:text-sm font-bold shadow-sm shadow-crimson/10"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh QR</span>
                        </button>
                         <button
                          type="button"
                          onClick={handleManualRefresh}
                          disabled={cooldownRemaining > 0}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 active:scale-95 transition-all text-xs md:text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4 text-slate-400" />
                          <span>{cooldownRemaining > 0 ? `Tunggu ${cooldownRemaining}s` : 'Perbarui QR'}</span>
                        </button>
                      </div>
                    )}
                    <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[420px] xl:max-w-[480px] mt-4 flex items-center justify-between">
                      <span className="text-[10px] md:text-xs font-bold tracking-wider text-slate-400">SEKALI PAKAI</span>
                      <span className={`text-[10px] md:text-xs font-bold tracking-wider ${countdown === 0 ? 'text-crimson' : 'text-slate-400'}`}>
                        {countdown === 0 ? 'KEDALUWARSA' : `${countdown}s`}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="lg:col-span-5 lg:bg-white lg:border lg:border-slate-100 lg:rounded-[2.5rem] lg:p-8 lg:shadow-sm flex flex-col lg:overflow-hidden lg:min-h-0 overflow-visible h-auto text-slate-800">
                <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-4">
                  Sesi Terdaftar Hari Ini ({todaySessions.length})
                </h2>

                {todaySessions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-800">
                    <CalendarDays size={40} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Belum ada sesi terdaftar</p>
                  </div>
                ) : (
                  <div className="flex-1 lg:overflow-y-auto overflow-visible grid grid-cols-2 gap-3 content-start pr-1 lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-slate-200">
                    {todaySessions.map(s => {
                      return (
                        <SessionCard key={s.id_sesi} s={s} />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:flex justify-between items-center pt-4 shrink-0">
              <p className="text-xs text-slate-500 font-medium">© Altar Kiosk System · locked secure session.</p>
              <button
                type="button"
                onClick={openExitModal}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm shadow-sm active:scale-95"
              >
                <Unlock className="w-4 h-4 text-slate-400" />
                Keluar Kiosk Mode
              </button>
            </div>
            <div className="lg:hidden h-24 shrink-0" aria-hidden />
          </div>
        </div>
      )}

      {isExplanationModalOpen && (
        <>
          <div
            onClick={() => closeExplanationModal(false)}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-out ${isExplanationVisible && !isExplanationClosing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-4">
            <div
              className={`w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-7 pointer-events-auto border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-300 ${isExplanationVisible && !isExplanationClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >

              <button
                type="button"
                onClick={() => closeExplanationModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-crimson flex items-center justify-center shrink-0">
                  <MonitorDot className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-crimson tracking-widest uppercase">Panduan Aktivasi</span>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">Apa itu Kiosk Mode?</h3>
                </div>
              </div>

              <div className="text-sm text-slate-600 mb-6 space-y-4">
                <p className="leading-relaxed font-semibold text-slate-700">
                  Kiosk Mode mengunci perangkat Anda menjadi layar stasiun presensi mandiri asisten dosen di kelas:
                </p>

                <div className="space-y-3.5">
                  {[
                    { title: 'Layar Penuh Terkunci', desc: 'Mengamankan laptop Anda dari akses lain selama sesi presensi berjalan.' },
                    { title: 'QR Code Sekali Pakai', desc: 'Token QR bersifat sekali pakai. Setelah kedaluwarsa, tap tombol perbarui untuk generate QR baru.' },
                    { title: 'Proteksi Keluar PIN', desc: 'Keluar dari mode stasiun presensi Kiosk membutuhkan PIN keamanan 4-6 digit Koordinator.' },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex gap-2.5 items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0 mt-1.5" />
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                        <strong className="text-slate-800 font-bold">{title}.</strong> {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => closeExplanationModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200/70 font-bold text-sm transition-colors active:scale-95"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => closeExplanationModal(true)}
                  className="flex-1 py-3.5 rounded-2xl bg-crimson text-white hover:bg-[#7a1728] font-bold text-sm shadow-md shadow-crimson/15 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Oke
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {isPinModalOpen && (
        <>
          <div
            onClick={() => {
              if (!isSubmitting) closePinModal();
            }}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-out ${isPinVisible && !isPinClosing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-4">
            <div
              className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-7 pointer-events-auto border border-slate-100 flex flex-col items-center transition-all duration-300 ${isPinVisible && !isPinClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-crimson flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-slate-800">
                {pinMode === 'SET' 
                  ? (!isConfirmStep ? 'Buat PIN Kiosk Baru' : 'Konfirmasi PIN Kiosk')
                  : pinMode === 'VERIFY_ENTER' 
                    ? 'Masukkan PIN Kiosk'
                    : 'Verifikasi PIN Sekarang'}
              </h3>

              <p className="text-xs text-slate-400 mt-1 mb-5 text-center px-4 leading-relaxed font-semibold">
                {pinMode === 'SET'
                  ? (isConfirmStep ? 'Masukkan kembali PIN 4-6 digit Anda untuk mengonfirmasi.' : 'PIN harus terdiri dari 4-6 digit angka untuk mengamankan mode Kiosk.')
                  : 'Gunakan PIN Kiosk 4-6 digit Anda untuk mengotorisasi status keamanan.'}
              </p>

              <div className="flex gap-3.5 justify-center mb-6 h-6 items-center min-h-[24px]">
                {(() => {
                  const activeVal = 
                    pinMode === 'SET'
                      ? (isConfirmStep ? confirmPin : newPin)
                      : enteredPin;
                  const dots = Array.from({ length: activeVal.length }).map((_, idx) => (
                    <div
                      key={`dot-${idx}`}
                      className="w-3.5 h-3.5 rounded-full bg-crimson border border-crimson scale-110 shadow-sm shadow-crimson/30 animate-scale-in"
                    />
                  ));
                  const showUnderscore = activeVal.length < 6;
                  return (
                    <>
                      {dots}
                      {showUnderscore && (
                        <span key="underscore" className="text-slate-300 font-mono font-black text-xl leading-none select-none">
                          _
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {pinError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2 mb-4 animate-shake border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {pinError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadPress(num, 'PIN')}
                    className="w-full aspect-square rounded-full border border-slate-100 bg-slate-50/60 hover:bg-slate-100/90 active:scale-95 text-xl font-black text-slate-700 transition-all flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    {num}
                  </button>
                ))}

                <div className="w-full aspect-square" />

                <button
                  type="button"
                  onClick={() => handleNumpadPress('0', 'PIN')}
                  className="w-full aspect-square rounded-full border border-slate-100 bg-slate-50/60 hover:bg-slate-100/90 active:scale-95 text-xl font-black text-slate-700 transition-all flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={() => handleNumpadBackspace('PIN')}
                  className="w-full aspect-square rounded-full hover:bg-rose-50 hover:text-crimson flex items-center justify-center font-bold text-slate-400 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                </button>
              </div>

              <div className="w-full mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closePinModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handlePINSubmit}
                  disabled={
                    isSubmitting || 
                    (pinMode === 'SET' 
                      ? (!isConfirmStep 
                          ? (newPin.length < 4 || newPin.length > 6) 
                          : (confirmPin.length < 4 || confirmPin.length > 6)) 
                      : (enteredPin.length < 4 || enteredPin.length > 6))
                  }
                  className="flex-1 py-3.5 rounded-2xl bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/15 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pinMode === 'SET' && !isConfirmStep ? (
                    <>Lanjut <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    'Konfirmasi'
                  )}
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {isExitModalOpen && (
        <>
          <div
            onClick={() => {
              if (!isSubmitting) closeExitModal();
            }}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000] transition-opacity duration-300 ease-out ${isExitVisible && !isExitClosing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none p-4">
            <div
              className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-7 pointer-events-auto border border-slate-100 flex flex-col items-center transition-all duration-300 ${isExitVisible && !isExitClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-crimson flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-slate-800">Keluar Kiosk Mode</h3>
              <p className="text-xs text-slate-400 mt-1 mb-5 text-center px-4 leading-relaxed font-semibold">
                Masukkan PIN Kiosk 4-6 digit Anda untuk mengembalikan kontrol admin normal.
              </p>

              <div className="flex gap-3.5 justify-center mb-6 h-6 items-center min-h-[24px]">
                {(() => {
                  const dots = Array.from({ length: exitPin.length }).map((_, idx) => (
                    <div
                      key={`dot-${idx}`}
                      className="w-3.5 h-3.5 rounded-full bg-crimson border border-crimson scale-110 shadow-sm shadow-crimson/30 animate-scale-in"
                    />
                  ));
                  const showUnderscore = exitPin.length < 6;
                  return (
                    <>
                      {dots}
                      {showUnderscore && (
                        <span key="underscore" className="text-slate-300 font-mono font-black text-xl leading-none select-none">
                          _
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {exitError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2 mb-4 animate-shake border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {exitError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3.5 w-full max-w-[280px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadPress(num, 'EXIT')}
                    className="w-full aspect-square rounded-full border border-slate-100 bg-slate-50/60 hover:bg-slate-100/90 active:scale-95 text-xl font-black text-slate-700 transition-all flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                  >
                    {num}
                  </button>
                ))}

                <div className="w-full aspect-square" />

                <button
                  type="button"
                  onClick={() => handleNumpadPress('0', 'EXIT')}
                  className="w-full aspect-square rounded-full border border-slate-100 bg-slate-50/60 hover:bg-slate-100/90 active:scale-95 text-xl font-black text-slate-700 transition-all flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={() => handleNumpadBackspace('EXIT')}
                  className="w-full aspect-square rounded-full hover:bg-rose-50 hover:text-crimson flex items-center justify-center font-bold text-slate-400 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                </button>
              </div>

              <div className="w-full mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeExitModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-500 font-bold text-sm active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExitKiosk}
                  disabled={isSubmitting || exitPin.length < 4 || exitPin.length > 6}
                  className="flex-1 py-3.5 rounded-2xl bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/15 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Keluar Kiosk'
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

