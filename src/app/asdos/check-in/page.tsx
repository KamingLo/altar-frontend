'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Scan, ArrowLeft, X, AlertCircle, Loader2, Camera, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { getSessionsByDate, type SessionFromAPI } from '@/lib/actions/jadwal';
import { submitCheckIn, getMyPresensi } from '@/lib/actions/presensi';
import { getMySubstitutions, deleteSubstitution } from '@/lib/actions/pergantian-kelas';

import { AsdosQrScanSkeleton, AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';
import { decodeJwtPayload } from '@/lib/auth/jwt';
import { getSubstituteSessionId, isQrSession, isQrPresensi } from '@/lib/presensi-mode';
import { useUserStore } from '@/store/useUserStore';

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getSessionStartMinutes = (waktu: string): number | null => {
  const match = waktu.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

const getSessionEndMinutes = (waktu: string): number | null => {
  const match = waktu.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isSessionEnded = (session: SessionFromAPI, nowMinutes = getCurrentMinutes()): boolean => {
  const endMinutes = getSessionEndMinutes(session.waktu);
  if (endMinutes === null) return false;
  return nowMinutes >= endMinutes;
};

const canShowForCheckIn = (session: SessionFromAPI, nowMinutes = getCurrentMinutes()): boolean => {
  const startMinutes = getSessionStartMinutes(session.waktu);
  if (startMinutes === null) return true;
  return nowMinutes >= startMinutes - 15;
};


const normalizeScannedQrToken = (rawToken: string): string => {
  const token = rawToken.trim();
  if (!token) return '';

  try {
    const url = new URL(token);
    const nestedToken =
      url.searchParams.get('qr_token') ||
      url.searchParams.get('token') ||
      url.searchParams.get('data') ||
      url.searchParams.get('code');
    return nestedToken?.trim() || token;
  } catch {
    return token;
  }
};

export default function CheckInPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isInlineConfirmOpen, setIsInlineConfirmOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [qrToken, setQrToken] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'scanning'>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  const [hasActivePresensi, setHasActivePresensi] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanningRef = useRef(false);

  const parseAndValidateQrToken = useCallback((token: string): { isValid: boolean; sessionId?: string } => {
    const normalizedToken = normalizeScannedQrToken(token);
    if (!normalizedToken) return { isValid: false };

    if (normalizedToken.startsWith('{') && normalizedToken.endsWith('}')) {
      try {
        const parsed = JSON.parse(normalizedToken);
        const sessionId = parsed.id_sesi || parsed.sesi || parsed.sessionId;
        return { isValid: true, sessionId: typeof sessionId === 'string' ? sessionId : undefined };
      } catch {
        return { isValid: false };
      }
    }

    const parts = normalizedToken.split('.');
    if (parts.length === 3) {
      const payload = decodeJwtPayload(normalizedToken);
      if (payload) {
        if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
          return { isValid: false };
        }
        const sessionId = payload.id_sesi || payload.sesi || payload.sessionId;
        return {
          isValid: true,
          sessionId: typeof sessionId === 'string' ? sessionId : undefined
        };
      }
    }

    if (normalizedToken.length >= 8) {
      return { isValid: true };
    }

    return { isValid: false };
  }, []);

  const handleValidQrScanned = useCallback(async (token: string) => {
    if (scanningRef.current) return;
    scanningRef.current = true;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
      }
    }

    const normalizedToken = normalizeScannedQrToken(token);
    setQrToken(normalizedToken);
    setHasActivePresensi(false);
    setScanMessage('');
    setIsLoading(true);

    try {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const [res, presensiRes] = await Promise.all([
      getSessionsByDate(today),
      getMyPresensi(),
    ]);

    const allPresensi = presensiRes.success ? presensiRes.data ?? [] : [];

    const activePresensi = allPresensi.find(p => {
      if (!isQrPresensi(p)) return false;
      const checkInTime = new Date(p.waktu_checkin).getTime();
      if (isNaN(checkInTime) || Math.abs(Date.now() - checkInTime) > 24 * 60 * 60 * 1000) return false;
      const co = p.waktu_checkout;
      return !co || co === '' || co === 'null' || String(co).startsWith('0001');
    });

    if (activePresensi) {
      setHasActivePresensi(true);
      setScanMessage(`Kamu masih memiliki sesi "${activePresensi.nama_mata_kuliah}" yang belum checkout. Selesaikan checkout terlebih dahulu sebelum check-in ke jadwal lain.`);
      setIsLoading(false);
      return;
    }

    const completedSessionIds = new Set<string>(
      allPresensi
        .filter(p => {
          const checkInTime = new Date(p.waktu_checkin).getTime();
          return !isNaN(checkInTime) && Math.abs(Date.now() - checkInTime) < 24 * 60 * 60 * 1000;
        })
        .flatMap(p => [p.id_sesi, p.id_sesi_pengganti].filter((v): v is string => !!v))
    );

    if (res.success) {
      const availableSessions = (res.data ?? [])
        .filter(s => !completedSessionIds.has(s.id_sesi));
      const fetchedSessions = availableSessions
        .filter(isQrSession)
        .sort((a, b) => {
          const aStart = getSessionStartMinutes(a.waktu) ?? 0;
          const bStart = getSessionStartMinutes(b.waktu) ?? 0;
          return aStart - bStart;
        });
      setSessions(fetchedSessions);

      const { sessionId } = parseAndValidateQrToken(token);
      const matchedSession = sessionId
        ? fetchedSessions.find(s => s.id_sesi === sessionId)
        : null;
      const matchedNonQrSession = sessionId
        ? availableSessions.find(s => s.id_sesi === sessionId && !isQrSession(s))
        : null;
      const matchedUpcomingQrSession = sessionId
        ? availableSessions.find(s => s.id_sesi === sessionId && isQrSession(s) && !canShowForCheckIn(s))
        : null;

      const currentMinutes = getCurrentMinutes();
      const isMatchedSessionDisabled = matchedSession
        ? !canShowForCheckIn(matchedSession, currentMinutes)
        : false;

      if (matchedSession && !isMatchedSessionDisabled) {
        setSelectedSessionId(matchedSession.id_sesi);

        setStep(2);
        setIsLoading(false);

        setTimeout(() => {
          setIsSheetOpen(true);
          setIsSheetVisible(true);
          setIsSheetClosing(false);
          setSheetDragY(0);
        }, 100);
      } else {
        if (matchedNonQrSession) {
          setScanMessage('Sesi ini menggunakan presensi online, bukan QR. Silakan gunakan menu Presensi Kelas Online.');
        } else if (matchedUpcomingQrSession) {
          const startMin = getSessionStartMinutes(matchedUpcomingQrSession.waktu);
          const availMin = startMin !== null ? startMin - 15 : null;
          const availStr = availMin !== null
            ? `${String(Math.floor(availMin / 60)).padStart(2, '0')}:${String(availMin % 60).padStart(2, '0')}`
            : null;
          setScanMessage(`Sesi ini belum masuk waktu check-in.${availStr ? ` Bisa check-in mulai jam ${availStr}.` : ''}`);
        }

        const firstActive = fetchedSessions[0];
        if (firstActive) {
          setSelectedSessionId(firstActive.id_sesi);
        } else if (fetchedSessions.length > 0) {
          setSelectedSessionId(fetchedSessions[0].id_sesi);
        }
        setStep(2);
        setIsLoading(false);
      }
    } else {
      setCameraStatus('idle');
      setIsLoading(false);
    }
    } finally {
      scanningRef.current = false;
    }
  }, [parseAndValidateQrToken]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStatus(prev => (prev === 'active' ? 'idle' : prev));
  }, []);

  useEffect(() => {
    if (step !== 1) stopCamera();
    return () => stopCamera();
  }, [step, stopCamera]);

  useEffect(() => {
    if (step === 3) {
      document.getElementById('dashboard-children-container')?.scrollTo(0, 0);
      setCountdown(10);
    } else {
      setCountdown(null);
    }
  }, [step]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { router.push('/asdos'); return; }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const startDecodeLoop = useCallback(async () => {
    const jsQR = (await import('jsqr')).default;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        const validation = parseAndValidateQrToken(code.data);
        if (validation.isValid) {
          stopCamera();
          handleValidQrScanned(normalizeScannedQrToken(code.data));
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopCamera, parseAndValidateQrToken, handleValidQrScanned]);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraStatus('requesting');
    setScanMessage('');
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment' },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);

      const activeTrack = stream.getVideoTracks()[0];
      const activeDevice = videoDevices.find(d => d.label === activeTrack.label);
      if (activeDevice) setActiveCameraId(activeDevice.deviceId);

      setCameraStatus('active');
      startDecodeLoop();
    } catch (err: unknown) {
      const errorName = err instanceof DOMException ? err.name : '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setScanMessage('Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.');
      } else {
        setCameraStatus('idle');
        setScanMessage('Gagal mengakses kamera. Coba lagi.');
      }
    }
  }, [stopCamera, startDecodeLoop]);

  const switchCamera = useCallback(async (deviceId: string) => {
    setActiveCameraId(deviceId);
    await startCamera(deviceId);
  }, [startCamera]);

  const handleScanFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraStatus('scanning');
    setScanMessage('Menganalisis gambar...');

    const jsQR = (await import('jsqr')).default;

    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      URL.revokeObjectURL(url);

      if (code) {
        const validation = parseAndValidateQrToken(code.data);
        if (validation.isValid) {
          setCameraStatus('idle');
          setScanMessage('');
          handleValidQrScanned(normalizeScannedQrToken(code.data));
        } else {
          setCameraStatus('idle');
          setScanMessage('Format QR Code tidak valid atau kadaluarsa. Pastikan QR dari Koordinator.');
        }
      } else {
        setCameraStatus('idle');
        setScanMessage('QR Code tidak ditemukan di gambar ini. Coba gambar lain.');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setCameraStatus('idle');
      setScanMessage('Gagal membaca file gambar.');
    };

    e.target.value = '';
  }, [parseAndValidateQrToken, handleValidQrScanned]);

  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const selectedSession = sessions.find(s => s.id_sesi === selectedSessionId);
  const currentMinutes = getCurrentMinutes();
  const activeSessions = sessions.filter(s => canShowForCheckIn(s, currentMinutes));
  const disabledSessions = sessions.filter(s => !canShowForCheckIn(s, currentMinutes));

  const handleCloseSheet = () => {
    setIsSheetClosing(true);
    setIsSheetVisible(false);
    setTimeout(() => {
      setIsSheetOpen(false);
      setIsSheetClosing(false);
      setSheetDragY(0);
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

  const handleConfirmCheckIn = async () => {
    if (!selectedSessionId) return;
    const substituteSessionId = getSubstituteSessionId(selectedSession);

    let id_asdos_rekan: string | undefined = undefined;
    if (selectedSession) {
      const currentAsdosId = user?.id_asisten;
      const id1 = selectedSession.id_asdos1;
      const id2 = selectedSession.id_asdos2;
      if (currentAsdosId) {
        if (id1 === currentAsdosId) {
          id_asdos_rekan = id2 || undefined;
        } else if (id2 === currentAsdosId) {
          id_asdos_rekan = id1 || undefined;
        } else {
          id_asdos_rekan = id1 || undefined;
        }
      }
    }

    setIsSubmitting(true);
    const res = await submitCheckIn({
      id_sesi: selectedSessionId,
      qr_token: qrToken,
      menggantikan: selectedSession?.tipe_jadwal === 'PENGGANTI' && !!substituteSessionId,
      id_sesi_pengganti: substituteSessionId,
      id_asdos_rekan,
    });
    if (res.success) {

try {
        const subRes = await getMySubstitutions();
        if (subRes.success && subRes.data) {
          const pendingUntukSesiIni = subRes.data.items.filter(
            item =>
              item.status === 'PENDING' &&
              item.session?.id_sesi === selectedSessionId,
          );
          if (pendingUntukSesiIni.length > 0) {
            await Promise.all(pendingUntukSesiIni.map(item => deleteSubstitution(item.id)));
          }
        }
      } catch {
        
      }

      handleCloseSheet();
      setTimeout(() => setStep(3), 300);
    }
    setIsSubmitting(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsInlineConfirmOpen(false);
  };

  const renderSessionOption = (s: SessionFromAPI, disabled = false) => {
    const isSel = selectedSessionId === s.id_sesi;
    const datePart = s.waktu.split(', ')[0] ?? '-';
    const timePart = s.waktu.split(', ')[1] ?? s.waktu;
    const availableFromStr = (() => {
      const startMinutes = getSessionStartMinutes(s.waktu);
      if (startMinutes === null) return null;
      const availMinutes = startMinutes - 15;
      const h = Math.floor(availMinutes / 60);
      const m = availMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })();

    return (
      <React.Fragment key={s.id_sesi}>
        <section
          onClick={disabled ? undefined : () => handleSelectSession(s.id_sesi)}
          className={`bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 border transition-all flex flex-col gap-6 w-full ${
            disabled
              ? 'border-slate-100 opacity-50 cursor-not-allowed select-none'
              : isSel
                ? 'border-crimson shadow-[0_10px_25px_rgba(148,28,47,0.12)] cursor-pointer active:scale-[0.99]'
                : 'border-slate-100 hover:border-slate-200 cursor-pointer active:scale-[0.99]'
          }`}
        >
          <article className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start justify-between gap-4 md:block w-full md:w-1/3">
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                  {s.mata_kuliah}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{s.nama_kelas || 'Kelas tidak tersedia'}</p>
                {s.tipe_jadwal === 'PENGGANTI' && (
                  <span className="w-fit mt-2 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-fog text-ink uppercase">
                    Pengganti
                  </span>
                )}
              </div>
              <div className={`md:hidden shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSel ? 'bg-crimson text-white shadow-md shadow-crimson/20' : 'bg-slate-100 text-slate-300'}`}>
                <Check size={17} strokeWidth={3} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full md:w-[480px]">
              <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                <span className="text-sm md:text-base font-bold text-slate-800">{datePart}</span>
              </div>
              <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jam</span>
                <span className="text-sm md:text-base font-bold text-slate-800">{timePart}</span>
              </div>
              <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                <span className="text-sm md:text-base font-bold text-slate-800">{s.ruangan}</span>
              </div>
              <div className="flex flex-col gap-1 border-l-2 border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asisten Dosen</span>
                <div className="flex flex-col gap-0.5">
                  {(s.pengajar || '-').split(' & ').map((name, i) => (
                    <span key={i} className="text-sm md:text-base font-bold text-slate-800 leading-snug">{name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`hidden md:flex shrink-0 w-10 h-10 rounded-xl items-center justify-center transition-all ${isSel ? 'bg-crimson text-white shadow-md shadow-crimson/20' : 'bg-slate-100 text-slate-300'}`}>
              <Check size={17} strokeWidth={3} />
            </div>
          </article>

          {disabled && availableFromStr && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-slate-400 shrink-0" />
              <p className="text-[11px] text-slate-500 font-medium">
                Check-in tersedia mulai <span className="font-bold text-slate-700">{availableFromStr}</span> (15 menit sebelum jadwal)
              </p>
            </div>
          )}

        </section>

        {isSel && !disabled && (
          <div className="-mt-1 mb-2">
            {isInlineConfirmOpen ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-slate-800">Anda yakin?</p>
                  <p className="text-sm text-slate-400 mt-0.5">Check-in akan langsung dicatat.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-3 md:shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsInlineConfirmOpen(false)}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-[14px] bg-white border border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCheckIn}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-[14px] bg-crimson text-white font-bold text-sm shadow-lg shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Ya, Check-in
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex md:justify-end">
                <button
                  type="button"
                  onClick={() => setIsInlineConfirmOpen(true)}
                  disabled={!selectedSessionId}
                  className="w-full md:w-auto bg-crimson text-white font-bold py-4 md:py-3.5 md:px-10 text-[15px] rounded-[14px] shadow-lg shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50"
                >
                  Check-in Sekarang
                </button>
              </div>
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <AsdosPageShell>
        <AsdosQrScanSkeleton />
      </AsdosPageShell>
    );
  }

  return (
    <AsdosPageShell>
      {isSheetOpen && (
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
                <div className="flex items-start justify-between mb-5">
                  <div className="pr-10">
                    <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Konfirmasi Check-in</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Pastikan data sesi sudah benar.</p>
                  </div>
                  <button onClick={handleCloseSheet}
                    className="hidden md:flex shrink-0 w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
                  {[
                    { label: 'Mata Kuliah', value: selectedSession?.mata_kuliah ?? '-' },
                    { label: 'Kelas', value: selectedSession?.nama_kelas ?? '-' },
                  ].map(({ label, value }, i, arr) => (
                    <React.Fragment key={label}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">{label}</span>
                        <span className={`text-sm font-semibold text-slate-700 ${label === 'Mata Kuliah' ? 'font-bold text-[#1F2937]' : ''}`}>{value}</span>
                      </div>
                      {i < arr.length - 1 && <div className="h-px bg-slate-100" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] md:text-xs text-amber-700 font-medium leading-relaxed">
                    Check-in tidak dapat dibatalkan setelah dikonfirmasi.
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 px-5 pb-6 md:pb-6 pt-4 border-t border-slate-100 bg-white">
                <div className="hidden md:flex gap-3">
                  <button onClick={handleCloseSheet}
                    className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-all hover:bg-slate-50">
                    Batal
                  </button>
                  <button onClick={handleConfirmCheckIn} disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Ya, Check-in
                  </button>
                </div>
                <div className="flex flex-col gap-3 md:hidden">
                  <button onClick={handleConfirmCheckIn} disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-crimson text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-crimson/20 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Ya, Check-in
                  </button>
                  <button onClick={handleCloseSheet}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <div className="mb-6 md:mb-8">
            <p className="text-left text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">Check-in Kehadiran</p>
            <h2 className="text-left text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Pindai Kode QR</h2>
            <p className="text-left text-sm mt-1 md:text-base text-slate-500">Arahkan kamera ke kode QR yang disediakan oleh koordinator.</p>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-start md:gap-16">
            <div className="hidden md:flex md:flex-1 flex-col justify-center pt-8">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mb-3">Pindai Kode QR</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator untuk melakukan check-in kehadiran. Pastikan pencahayaan cukup dan kode QR berada di dalam area pindai.
              </p>
              <div className="mt-8 flex flex-row gap-4 w-full">
                {cameraStatus === 'idle' || cameraStatus === 'denied' ? (
                  <button
                    onClick={() => startCamera()}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-crimson text-white font-bold py-3.5 rounded-[14px] text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                ) : cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
                  <button disabled
                    className="flex-1 flex items-center justify-center gap-2.5 bg-crimson/60 text-white font-bold py-3.5 rounded-[14px] text-sm cursor-not-allowed">
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </button>
                ) : (
                  <button
                    onClick={() => { stopCamera(); setCameraStatus('idle'); }}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-[14px] text-sm active:scale-[0.98] transition-all hover:bg-slate-200"
                  >
                    <RefreshCw size={18} />
                    Hentikan Kamera
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={cameraStatus === 'requesting' || cameraStatus === 'scanning'}
                  className="flex-1 flex items-center justify-center gap-2.5 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-[14px] text-sm active:scale-[0.98] transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ImageIcon size={17} />
                  Pindai dari File
                </button>

              </div>
              {cameras.length > 1 && cameraStatus === 'active' && (
                <select
                  value={activeCameraId}
                  onChange={e => switchCamera(e.target.value)}
                  className="mt-4 w-full p-3 rounded-[14px] border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-crimson transition-colors"
                >
                  {cameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              )}

              {scanMessage && (
                hasActivePresensi ? (
                  <div className="mt-4 flex items-start gap-3 bg-crimson/5 border border-crimson/20 px-4 py-3.5 rounded-[14px] w-full animate-in fade-in duration-300">
                    <AlertCircle size={18} className="shrink-0 text-crimson mt-0.5" />
                    <p className="text-[11px] md:text-xs font-medium leading-relaxed text-crimson">{scanMessage}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-3.5 rounded-[14px] border border-amber-100 w-full animate-in fade-in duration-300">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-[11px] md:text-xs font-medium leading-relaxed">{scanMessage}</p>
                  </div>
                )
              )}
            </div>
            <div className="md:flex-1 flex flex-col items-center w-full gap-4">
              <div className="w-full max-w-[280px] md:max-w-[320px] relative group mx-auto">
                <div className={`w-full aspect-square flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner
                  ${cameraStatus === 'active' ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                  {cameraStatus === 'requesting' ? (
                    <Loader2 size={48} className="opacity-60 animate-spin mb-3 text-crimson" />
                  ) : cameraStatus === 'scanning' ? (
                    <Loader2 size={48} className="opacity-60 animate-spin mb-3 text-crimson" />
                  ) : cameraStatus === 'denied' ? (
                    <AlertCircle size={48} className="opacity-60 mb-3 text-amber-400" />
                  ) : (
                    <Scan size={48} className="opacity-50 animate-pulse mb-3" />
                  )}
                  <p className="text-xs font-semibold text-center px-4">
                    {cameraStatus === 'requesting' ? 'Meminta izin kamera...' :
                      cameraStatus === 'scanning' ? 'Menganalisis gambar...' :
                        cameraStatus === 'denied' ? 'Izin kamera ditolak' :
                          'Area Pindai QR'}
                  </p>
                </div>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`absolute top-0 left-0 w-full aspect-square object-cover rounded-2xl
                    ${cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute top-0 left-0 w-full aspect-square pointer-events-none z-20">
                  <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-crimson rounded-tl-2xl transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
                  <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-crimson rounded-tr-2xl transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-crimson rounded-bl-2xl transition-all duration-300 group-hover:-translate-x-1 group-hover:translate-y-1" />
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-crimson rounded-br-2xl transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
                </div>
                {cameraStatus === 'active' && (
                  <div className="absolute top-0 left-0 w-full aspect-square rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div className="absolute left-0 w-full h-0.5 bg-crimson/60 shadow-[0_0_8px_var(--color-crimson)]"
                      style={{ animation: 'scanLine 2s linear infinite' }} />
                  </div>
                )}
              </div>
              <div className="w-full max-w-[280px] md:max-w-[320px] flex md:hidden flex-col gap-3 mt-2">
                {cameraStatus === 'idle' || cameraStatus === 'denied' ? (
                  <button
                    onClick={() => startCamera()}
                    className="w-full flex items-center justify-center gap-2.5 bg-crimson text-white font-bold py-3.5 rounded-xl text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                ) : cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
                  <button disabled
                    className="w-full flex items-center justify-center gap-2.5 bg-crimson/60 text-white font-bold py-3.5 rounded-xl text-sm cursor-not-allowed">
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </button>
                ) : (
                  <button
                    onClick={() => { stopCamera(); setCameraStatus('idle'); }}
                    className="w-full flex items-center justify-center gap-2.5 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-all hover:bg-slate-200"
                  >
                    <RefreshCw size={18} />
                    Hentikan Kamera
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={cameraStatus === 'requesting' || cameraStatus === 'scanning'}
                  className="w-full flex items-center justify-center gap-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ImageIcon size={17} />
                  Pindai dari File Gambar
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanFile}
                />
                {cameras.length > 1 && cameraStatus === 'active' && (
                  <select
                    value={activeCameraId}
                    onChange={e => switchCamera(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-crimson transition-colors"
                  >
                    {cameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {scanMessage && (
                  hasActivePresensi ? (
                    <div className="flex items-start gap-3 bg-crimson/5 border border-crimson/20 px-4 py-3.5 rounded-2xl w-full shadow-sm animate-in fade-in duration-300">
                      <AlertCircle size={18} className="shrink-0 text-crimson mt-0.5" />
                      <p className="text-[11px] md:text-xs font-medium leading-relaxed text-crimson">{scanMessage}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-3.5 rounded-2xl border border-amber-100 w-full shadow-sm animate-in fade-in duration-300">
                      <AlertCircle size={18} className="shrink-0" />
                      <p className="text-[11px] md:text-xs font-medium leading-relaxed">{scanMessage}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase md:text-xs">Check-in Kehadiran</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Pilih Sesi Mengajar</h2>
            </div>
            <button onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
              <h4 className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Sesi Tersedia Hari Ini</h4>
            </div>

            <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
              {sessions.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[12px] md:rounded-[32px] p-6 md:p-8 text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-[14px] bg-fog flex items-center justify-center text-slate-500">
                    <Scan size={20} />
                  </div>
                  <p className="text-base md:text-lg text-slate-800 font-bold">Tidak ada sesi mengajar.</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    Sesi QR hari ini belum tersedia, belum jam untuk mengajar, atau sudah tercatat check-in.
                  </p>
                  <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                    <span>↓</span>
                    <span>Tarik halaman ke bawah untuk refresh</span>
                  </p>
                </div>
              ) : (
                <>
                  {activeSessions.map(s => renderSessionOption(s))}
                  {disabledSessions.map(s => renderSessionOption(s, true))}
                </>
              )}
            </div>

          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">Check-in Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Berhasil!</h2>
            <p className="text-sm mt-1 md:text-base text-slate-500">Kehadiran Anda telah tercatat di sistem.</p>
          </div>
          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-center md:gap-16">
            <div className="flex justify-center md:flex-1 mb-10 md:mb-0">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-36 h-36 md:w-48 md:h-48 bg-crimson/5 rounded-full animate-ping" />
                <div className="absolute w-28 h-28 md:w-36 md:h-36 bg-crimson/8 rounded-full" />
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-crimson rounded-full flex items-center justify-center text-white shadow-xl shadow-crimson/30">
                  <Check size={36} strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="md:flex-1">
              <div className="bg-white rounded-3xl border border-slate-100 md:border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-md">
                <div className="h-1 bg-crimson" />
                <div className="p-6 md:p-7 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Aktif</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {selectedSession?.mata_kuliah}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{selectedSession?.ruangan} / {selectedSession?.nama_kelas}</span>
                  </h3>
                  <div className="border-t border-slate-100 pt-5 pb-5">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-in Pada</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-crimson">{currentTime} <span className="text-base font-bold">WIB</span></p>
                  </div>
                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Selamat bertugas! Jangan lupa untuk melakukan <span className="font-bold text-slate-700">Check-out</span> setelah sesi berakhir.
                  </p>
                </div>
              </div>
              <button onClick={() => router.push('/asdos')} className="mt-4 w-full bg-crimson text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                Kembali ke Beranda
              </button>
              {countdown !== null && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  Diarahkan otomatis dalam <span className="font-bold text-slate-600">{countdown}s</span>
                </p>
              )}
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes scanLine {
          0%   { top: 8%; }
          50%  { top: 88%; }
          100% { top: 8%; }
        }
      `}</style>
    </AsdosPageShell>
  );
}

