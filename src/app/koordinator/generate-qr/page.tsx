'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Clock,
  Lock,
  LogOut,
  MapPin,
  Monitor,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  deactivateKiosk,
  generateQRToken,
  getKioskStatus,
  setKioskPIN,
  verifyKioskPIN,
} from '@/lib/actions/koordinator';
import { getScheduleTimeline } from '@/lib/actions/jadwal';
import { fetchSemesters } from '@/lib/actions/manajemen-jadwal';
import { decodeJwtPayload } from '@/lib/auth/jwt';
import {
  dedupeSessions,
  isPenggantiTipe,
  sessionRowKey,
  todayIso,
} from '@/lib/jadwal-utils';
import type { UnifiedJadwalResponse } from '@/types/api';

const QR_REFRESH_MS = 4 * 60 * 1000;

type PageMode = 'NORMAL' | 'KIOSK';
type PinModalKind = 'setup' | 'activate' | 'exit' | null;

function formatWibTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

function tokenExpiryLabel(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return null;
  return formatWibTime(new Date(exp * 1000));
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="h-[88px] rounded-2xl bg-slate-100/90 animate-pulse border border-slate-100"
        />
      ))}
    </div>
  );
}

function PinModal({
  kind,
  isLoading,
  error,
  onClose,
  onSubmit,
}: {
  kind: Exclude<PinModalKind, null>;
  isLoading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (pin: string, confirmPin?: string) => void;
}) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const titles: Record<Exclude<PinModalKind, null>, { title: string; desc: string }> = {
    setup: {
      title: 'Atur PIN Kiosk',
      desc: 'PIN dipakai untuk mengaktifkan dan keluar dari mode kiosk. Simpan di tempat aman.',
    },
    activate: {
      title: 'Masukkan PIN',
      desc: 'Verifikasi PIN untuk mengaktifkan mode kiosk dan menampilkan QR presensi.',
    },
    exit: {
      title: 'Keluar dari Kiosk',
      desc: 'Masukkan PIN untuk menonaktifkan kiosk dan kembali ke tampilan normal.',
    },
  };

  const { title, desc } = titles[kind];
  const needsConfirm = kind === 'setup';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pin, confirmPin);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <form
        onSubmit={handleSubmit}
        suppressHydrationWarning
        autoComplete="off"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100"
          aria-label="Tutup dialog"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#941C2F] flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#1F2937]">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
          </div>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          PIN (4–6 digit)
        </label>
        <input
          type="password"
          name="kiosk-pin"
          inputMode="numeric"
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          suppressHydrationWarning
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#941C2F]/30"
          placeholder="••••"
          required
        />
        {needsConfirm && (
          <>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 mt-4">
              Konfirmasi PIN
            </label>
            <input
              type="password"
              name="kiosk-pin-confirm"
              inputMode="numeric"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore
              data-form-type="other"
              suppressHydrationWarning
              maxLength={6}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#941C2F]/30"
              placeholder="••••"
              required
            />
          </>
        )}
        {error && (
          <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading || pin.length < 4 || (needsConfirm && confirmPin.length < 4)}
          className="mt-6 w-full rounded-xl bg-[#941C2F] py-3.5 text-[15px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Memproses…' : kind === 'exit' ? 'Keluar Kiosk' : 'Lanjutkan'}
        </button>
      </form>
    </div>
  );
}

export default function GenerateQrPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<PageMode>('NORMAL');
  const [todaySessions, setTodaySessions] = useState<UnifiedJadwalResponse[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');

  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinModal, setPinModal] = useState<PinModalKind>(null);
  const [pinError, setPinError] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);

  const [qrToken, setQrToken] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTodaySessions = useCallback(async () => {
    setIsSessionsLoading(true);
    setSessionsError('');
    try {
      const semRes = await fetchSemesters();
      if (!semRes.success || !semRes.items.length) {
        setTodaySessions([]);
        setSessionsError(semRes.message || 'Belum ada semester aktif.');
        return;
      }
      const activeId = semRes.items[0].id;
      const today = todayIso();
      const schedRes = await getScheduleTimeline({
        start_date: today,
        end_date: today,
        id_semester: activeId,
      });
      if (schedRes.success && schedRes.data?.items) {
        setTodaySessions(dedupeSessions(schedRes.data.items));
      } else {
        setTodaySessions([]);
        setSessionsError(schedRes.message || 'Gagal memuat jadwal hari ini.');
      }
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  const refreshQrToken = useCallback(async () => {
    setIsQrLoading(true);
    setQrError('');
    const res = await generateQRToken();
    if (res.success && res.token) {
      setQrToken(res.token);
      setLastRefreshAt(new Date());
    } else {
      setQrError(res.message || 'Gagal membuat token QR.');
    }
    setIsQrLoading(false);
    return res.success;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadTodaySessions();
    void (async () => {
      const status = await getKioskStatus();
      if (status.success) {
        setHasPin(status.hasPin);
        if (status.isActive) {
          setMode('KIOSK');
          await refreshQrToken();
        }
      }
    })();
  }, [mounted, loadTodaySessions, refreshQrToken]);

  const todayLabel = mounted ? todayIso() : '';

  useEffect(() => {
    if (mode !== 'KIOSK') {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      void refreshQrToken();
    }, QR_REFRESH_MS);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [mode, refreshQrToken]);

  const qrUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`
    : '';

  const expiryLabel = useMemo(() => (qrToken ? tokenExpiryLabel(qrToken) : null), [qrToken]);

  const roomSummary = useMemo(() => {
    const rooms = [...new Set(todaySessions.map(s => s.ruangan).filter(Boolean))];
    if (rooms.length === 0) return '—';
    if (rooms.length === 1) return rooms[0];
    return `${rooms.length} ruangan`;
  }, [todaySessions]);

  const handleStartKiosk = () => {
    setPinError('');
    if (hasPin === false) setPinModal('setup');
    else setPinModal('activate');
  };

  const handlePinSubmit = async (pin: string, confirmPin?: string) => {
    setPinError('');
    if (pin.length < 4) {
      setPinError('PIN minimal 4 digit.');
      return;
    }

    setIsPinLoading(true);
    try {
      if (pinModal === 'setup') {
        if (pin !== confirmPin) {
          setPinError('Konfirmasi PIN tidak cocok.');
          return;
        }
        const resSet = await setKioskPIN(pin);
        if (!resSet.success) {
          setPinError(resSet.message || 'Gagal menyimpan PIN.');
          return;
        }
        setHasPin(true);
        setPinModal('activate');
        return;
      }

      if (pinModal === 'activate') {
        const resVerify = await verifyKioskPIN(pin);
        if (!resVerify.success) {
          setPinError(resVerify.message || 'PIN salah.');
          return;
        }
        setPinModal(null);
        const ok = await refreshQrToken();
        if (ok) setMode('KIOSK');
        return;
      }

      if (pinModal === 'exit') {
        const resVerify = await verifyKioskPIN(pin);
        if (!resVerify.success) {
          setPinError(resVerify.message || 'PIN salah! Akses keluar ditolak.');
          return;
        }
        const resDeact = await deactivateKiosk();
        if (!resDeact.success) {
          setPinError(resDeact.message || 'Gagal menonaktifkan kiosk.');
          return;
        }
        setMode('NORMAL');
        setQrToken('');
        setPinModal(null);
      }
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-presensi-${todayIso()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (mode === 'KIOSK') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-[#1a0a0e] to-slate-900 text-white p-6">
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-rose-200/90">
            <Monitor size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Kiosk Mode</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPinError('');
              setPinModal('exit');
            }}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-rose-200/80 text-sm font-semibold uppercase tracking-[0.2em] mb-2">
            Scan untuk presensi
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{roomSummary}</h1>
          {expiryLabel && (
            <p className="mt-2 text-rose-100/70 text-sm">
              Token berlaku hingga{' '}
              <span className="font-bold text-white tabular-nums">{expiryLabel} WIB</span>
            </p>
          )}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[40px] shadow-2xl">
          {isQrLoading && !qrToken ? (
            <div className="w-[280px] h-[280px] md:w-[300px] md:h-[300px] flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-[#941C2F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrToken ? (
            <img
              src={qrUrl}
              alt="QR Code Presensi"
              width={300}
              height={300}
              className="w-[280px] h-[280px] md:w-[300px] md:h-[300px]"
            />
          ) : (
            <p className="w-[280px] h-[280px] flex items-center justify-center text-slate-500 text-sm font-medium">
              Generating Token…
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-rose-100/60">
          <button
            type="button"
            onClick={() => void refreshQrToken()}
            disabled={isQrLoading}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isQrLoading ? 'animate-spin' : ''} />
            {isQrLoading ? 'Memperbarui…' : 'Perbarui QR'}
          </button>
          {mounted && lastRefreshAt && (
            <span className="text-xs tabular-nums" suppressHydrationWarning>
              Terakhir diperbarui {formatWibTime(lastRefreshAt)} WIB · auto setiap 4 menit
            </span>
          )}
          {qrError && <p className="text-red-300 font-semibold">{qrError}</p>}
        </div>

        {mounted && pinModal === 'exit' && (
          <PinModal
            key="exit"
            kind="exit"
            isLoading={isPinLoading}
            error={pinError}
            onClose={() => setPinModal(null)}
            onSubmit={handlePinSubmit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-800 md:mx-auto md:max-w-5xl md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-12">
      <header className="relative z-10 mb-8 md:mb-10">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#941C2F] md:text-xs">
          Presensi
        </p>
        <h1 className="text-[28px] font-extrabold leading-8 tracking-tight text-[#1F2937] md:text-3xl">
          Generate QR Ruangan
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 md:text-[15px]">
          Aktifkan mode kiosk untuk menampilkan QR presensi di layar kelas. Token diperbarui otomatis
          setiap 4 menit.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-[#1F2937] mb-1">Sesi Hari Ini</h2>
        <p className="text-sm text-slate-500 mb-4">
          {isSessionsLoading
            ? 'Memuat jadwal…'
            : todaySessions.length
              ? `${todaySessions.length} sesi${todayLabel ? ` pada ${todayLabel}` : ''}`
              : 'Tidak ada sesi terjadwal hari ini'}
        </p>

        {isSessionsLoading && <SessionsSkeleton />}

        {!isSessionsLoading && sessionsError && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {sessionsError}
          </div>
        )}

        {!isSessionsLoading && !sessionsError && todaySessions.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
            Belum ada jadwal untuk hari ini. Anda tetap dapat mengaktifkan kiosk jika diperlukan.
          </div>
        )}

        {!isSessionsLoading && todaySessions.length > 0 && (
          <ul className="space-y-3">
            {todaySessions.map(s => {
              const timePart = s.waktu.includes(', ') ? s.waktu.split(', ')[1] : s.waktu;
              return (
                <li
                  key={sessionRowKey(s)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 text-[#941C2F] flex items-center justify-center">
                      <BookOpen size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#1F2937] truncate">{s.mata_kuliah}</h3>
                        {isPenggantiTipe(s.tipe) && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-md">
                            PENGGANTI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{s.nama_kelas}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                          <Clock size={12} className="text-slate-400" />
                          {timePart}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                          <MapPin size={12} className="text-slate-400" />
                          {s.ruangan}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white/90 backdrop-blur-sm p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#941C2F]/10 text-[#941C2F] flex items-center justify-center">
            <Monitor size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-[#1F2937]">Mode Kiosk</h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Layar penuh dengan QR besar untuk discan asisten dosen. Keluar kiosk memerlukan PIN
              keamanan.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Lokasi hari ini
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-[#1F2937]">{roomSummary}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Status PIN
                </dt>
                <dd className="mt-1 text-sm font-bold text-[#941C2F]">
                  {hasPin === null ? 'Memeriksa…' : hasPin ? 'Sudah diatur' : 'Belum diatur'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleStartKiosk}
              disabled={isSessionsLoading}
              className="mt-8 w-full sm:w-auto rounded-xl bg-[#941C2F] px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1728] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSessionsLoading ? 'Memuat Jadwal…' : 'Aktifkan Kiosk Mode'}
            </button>
          </div>
        </div>
      </section>

      {qrToken && (
        <section className="mt-10 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex flex-col items-center">
            <img
              src={qrUrl}
              alt="QR Code presensi"
              width={200}
              height={200}
              className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/80"
            />
            <button
              type="button"
              onClick={() => void handleDownload()}
              className="mt-4 text-sm font-bold text-[#941C2F] underline"
            >
              Unduh QR
            </button>
          </div>
          <div>
            <p className="text-sm text-slate-600">
              Pratinjau token terakhir
              {expiryLabel && (
                <>
                  {' '}
                  · berlaku hingga <span className="font-bold tabular-nums">{expiryLabel} WIB</span>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {mounted && pinModal && pinModal !== 'exit' && (
        <PinModal
          key={pinModal}
          kind={pinModal}
          isLoading={isPinLoading}
          error={pinError}
          onClose={() => setPinModal(null)}
          onSubmit={handlePinSubmit}
        />
      )}
    </div>
  );
}
