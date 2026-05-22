'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Scan, ArrowLeft, Clock, MapPin, BookOpen, X, AlertCircle, Loader2, Camera, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { getSessionsByDate, type SessionFromAPI } from '@/lib/actions/jadwal';
import { submitCheckIn, getMyPresensi } from '@/lib/actions/presensi';

import { AsdosQrScanSkeleton, AsdosPageShell } from '@/components/dashboard/asdos/AsdosUI';
import { decodeJwtPayload } from '@/lib/auth/jwt';

const isSessionExpired = (waktu: string): boolean => {
  const match = waktu.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const endHour = parseInt(match[3], 10);
  const endMin = parseInt(match[4], 10);
  const now = new Date();
  return endHour * 60 + endMin < now.getHours() * 60 + now.getMinutes();
};

export default function CheckInPage() {
  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState<SessionFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [qrToken, setQrToken] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'scanning'>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndValidateQrToken = useCallback((token: string): { isValid: boolean; sessionId?: string } => {
    if (!token) return { isValid: false };

    if (token.startsWith('SIMULATED_') || token.startsWith('MOCK_')) {
      const match = token.match(/_(?:SESSION|SESI)_([a-zA-Z0-9-]+)/i);
      return { isValid: true, sessionId: match ? match[1] : undefined };
    }

    if (token.trim().startsWith('{') && token.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(token);
        const sessionId = parsed.id_sesi || parsed.sesi || parsed.sessionId;
        return { isValid: true, sessionId: typeof sessionId === 'string' ? sessionId : undefined };
      } catch {
        return { isValid: false };
      }
    }

    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = decodeJwtPayload(token);
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

    if (/^[a-zA-Z0-9_-]{10,}$/.test(token)) {
      return { isValid: true };
    }

    return { isValid: false };
  }, []);

  const handleValidQrScanned = useCallback(async (token: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
      }
    }

    setQrToken(token);
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const [res, presensiRes] = await Promise.all([
      getSessionsByDate(today),
      getMyPresensi(),
    ]);

    const completedSessionIds = new Set<string>(
      (presensiRes.success ? presensiRes.data ?? [] : [])
        .filter(p => p.tanggal_mengajar?.slice(0, 10) === today)
        .flatMap(p => [p.id_sesi, p.id_sesi_pengganti].filter((v): v is string => !!v))
    );

    if (res.success) {
      const fetchedSessions = (res.data ?? [])
        .filter(s => !isSessionExpired(s.waktu))
        .filter(s => !completedSessionIds.has(s.id_sesi));
      setSessions(fetchedSessions);

      const { sessionId } = parseAndValidateQrToken(token);
      const matchedSession = sessionId
        ? fetchedSessions.find(s => s.id_sesi === sessionId)
        : null;

      if (matchedSession) {
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
        if (fetchedSessions.length > 0) {
          setSelectedSessionId(fetchedSessions[0].id_sesi);
        }
        setStep(2);
        setIsLoading(false);
      }
    } else {
      setCameraStatus('idle');
      setIsLoading(false);
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
          handleValidQrScanned(code.data);
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
        setScanMessage('Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser wak.');
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
          handleValidQrScanned(code.data);
        } else {
          setCameraStatus('idle');
          setScanMessage('❌ Format QR Code tidak valid atau kadaluarsa. Pastikan QR dari Koordinator.');
        }
      } else {
        setCameraStatus('idle');
        setScanMessage('❌ QR Code tidak ditemukan di gambar ini. Coba gambar lain.');
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

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
    setIsSheetClosing(false);
    setSheetDragY(0);
    setTimeout(() => setIsSheetVisible(true), 10);
  };

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
    setIsSubmitting(true);
    const res = await submitCheckIn({
      id_sesi: selectedSessionId,
      qr_token: qrToken,
      menggantikan: selectedSession?.tipe_jadwal === 'PENGGANTI',
      id_sesi_pengganti: selectedSession?.tipe_jadwal === 'PENGGANTI' ? selectedSession.id_sesi : undefined,
    });
    if (res.success) {
      handleCloseSheet();
      setTimeout(() => setStep(3), 300);
    }
    setIsSubmitting(false);
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
                    { label: 'Ruangan', value: selectedSession?.ruangan ?? '-' },
                    { label: 'Waktu', value: selectedSession?.waktu ?? '-' },
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
                    className="flex-1 py-3 rounded-xl bg-[#941C2F] text-white font-bold text-sm shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    Ya, Check-in
                  </button>
                </div>
                <div className="flex flex-col gap-3 md:hidden">
                  <button onClick={handleConfirmCheckIn} disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20 flex items-center justify-center gap-2">
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
            <p className="text-left text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Check-in Kehadiran</p>
            <h2 className="text-left text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Pindai Kode QR</h2>
            <p className="text-left md:text-left text-sm text-slate-500 mt-1 md:text-base">Arahkan kamera ke kode QR yang disediakan koordinator.</p>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-start md:gap-16">
            <div className="hidden md:flex md:flex-1 flex-col justify-center pt-8">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mb-3">Pindai Kode QR</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator di depan kelas untuk melakukan check-in kehadiran. Pastikan pencahayaan cukup dan kode QR berada di dalam area pindai.
              </p>
              <div className="mt-8 flex flex-row gap-4 w-full">
                {cameraStatus === 'idle' || cameraStatus === 'denied' ? (
                  <button
                    onClick={() => startCamera()}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-[#941C2F] text-white font-bold py-3.5 rounded-xl text-sm shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                ) : cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
                  <button disabled
                    className="flex-1 flex items-center justify-center gap-2.5 bg-[#941C2F]/60 text-white font-bold py-3.5 rounded-xl text-sm cursor-not-allowed">
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </button>
                ) : (
                  <button
                    onClick={() => { stopCamera(); setCameraStatus('idle'); }}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-all hover:bg-slate-200"
                  >
                    <RefreshCw size={18} />
                    Hentikan Kamera
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={cameraStatus === 'requesting' || cameraStatus === 'scanning'}
                  className="flex-1 flex items-center justify-center gap-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ImageIcon size={17} />
                  Pindai dari File
                </button>
              </div>
              {cameras.length > 1 && cameraStatus === 'active' && (
                <select
                  value={activeCameraId}
                  onChange={e => switchCamera(e.target.value)}
                  className="mt-4 w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-[#941C2F] transition-colors"
                >
                  {cameras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              )}

              {scanMessage && (
                <div className="mt-4 flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-3.5 rounded-2xl border border-amber-100 w-full shadow-sm animate-in fade-in duration-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-[11px] md:text-xs font-medium leading-relaxed">{scanMessage}</p>
                </div>
              )}
            </div>
            <div className="md:flex-1 flex flex-col items-center w-full gap-4">
              <div className="w-full max-w-[280px] md:max-w-[320px] relative group mx-auto">
                <div className={`w-full aspect-square flex flex-col items-center justify-center text-slate-300 bg-white rounded-2xl border border-slate-200 shadow-inner
                  ${cameraStatus === 'active' ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                  {cameraStatus === 'requesting' ? (
                    <Loader2 size={48} className="opacity-60 animate-spin mb-3 text-[#941C2F]" />
                  ) : cameraStatus === 'scanning' ? (
                    <Loader2 size={48} className="opacity-60 animate-spin mb-3 text-[#941C2F]" />
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
                  <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-[#941C2F] rounded-tl-2xl transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
                  <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-[#941C2F] rounded-tr-2xl transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-[#941C2F] rounded-bl-2xl transition-all duration-300 group-hover:-translate-x-1 group-hover:translate-y-1" />
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-[#941C2F] rounded-br-2xl transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
                </div>
                {cameraStatus === 'active' && (
                  <div className="absolute top-0 left-0 w-full aspect-square rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div className="absolute left-0 w-full h-0.5 bg-[#941C2F]/60 shadow-[0_0_8px_#941C2F]"
                      style={{ animation: 'scanLine 2s linear infinite' }} />
                  </div>
                )}
              </div>
              <div className="w-full max-w-[280px] md:max-w-[320px] flex md:hidden flex-col gap-3 mt-2">
                {cameraStatus === 'idle' || cameraStatus === 'denied' ? (
                  <button
                    onClick={() => startCamera()}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#941C2F] text-white font-bold py-3.5 rounded-xl text-sm shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                ) : cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
                  <button disabled
                    className="w-full flex items-center justify-center gap-2.5 bg-[#941C2F]/60 text-white font-bold py-3.5 rounded-xl text-sm cursor-not-allowed">
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
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-[#941C2F] transition-colors"
                  >
                    {cameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Kamera ${cameras.indexOf(cam) + 1}`}
                      </option>
                    ))}
                  </select>
                )}
                {scanMessage && (
                  <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-3.5 rounded-2xl border border-amber-100 w-full shadow-sm animate-in fade-in duration-300">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-[11px] md:text-xs font-medium leading-relaxed">{scanMessage}</p>
                  </div>
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
              <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase md:text-xs">Check-in Kehadiran</p>
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
              <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg">{sessions.length} Sesi</span>
            </div>

            <div className="space-y-3 mb-8 md:mb-10">
              {sessions.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                  <p className="text-slate-500 font-medium">Tidak ada sesi mengajar untuk hari ini.</p>
                </div>
              ) : (
                sessions.map(s => {
                  const isSel = selectedSessionId === s.id_sesi;
                  const isAktif = true;
                  return (
                    <div key={s.id_sesi} onClick={() => setSelectedSessionId(s.id_sesi)}
                      className={`bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm border-2 transition-all
                        cursor-pointer active:scale-[0.99]
                        ${isSel ? 'border-[#941C2F] shadow-md shadow-[#941C2F]/10' : 'border-transparent md:border-slate-100 md:hover:border-slate-200 md:hover:shadow-md'}`}>

                      <div className="md:hidden">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isSel ? 'bg-[#941C2F]/10' : 'bg-rose-50'} text-[#941C2F]`}>
                            <BookOpen size={20} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[15px] text-[#1F2937] truncate">{s.mata_kuliah}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold tracking-wider ${isAktif ? 'text-[#941C2F]' : 'text-slate-400'}`}>{s.nama_kelas}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <div className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className={`text-[10px] font-semibold ${isAktif ? 'text-emerald-600' : 'text-slate-400'}`}>{s.tipe_jadwal}</span>
                            </div>
                          </div>
                          <div className={`shrink-0 self-start mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSel ? 'bg-[#941C2F] shadow-md' : 'bg-slate-100'}`}>
                            <Check size={13} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700">{s.waktu}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700">{s.ruangan}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex md:items-center md:justify-between">
                        <div className="flex items-center gap-4 min-w-0 w-2/5">
                          <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isSel ? 'bg-[#941C2F]/10' : 'bg-rose-50'} text-[#941C2F]`}>
                            <BookOpen size={20} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-[#1F2937] truncate">{s.mata_kuliah}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs font-bold tracking-wider ${isAktif ? 'text-[#941C2F]' : 'text-slate-400'}`}>{s.nama_kelas}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <div className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className={`text-xs font-semibold ${isAktif ? 'text-emerald-600' : 'text-slate-400'}`}>{s.tipe_jadwal}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center justify-start gap-2">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span className="text-[13px] font-semibold text-slate-700">{s.waktu}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg flex items-center justify-start gap-2">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="text-[13px] font-semibold text-slate-700">{s.ruangan}</span>
                          </div>
                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSel ? 'bg-[#941C2F] shadow-md' : 'bg-slate-100'}`}>
                            <Check size={13} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            <div className={`hidden md:flex md:justify-end transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
              <button onClick={handleOpenSheet} disabled={!selectedSessionId}
                className="bg-[#941C2F] text-white font-bold py-3 px-10 text-[15px] rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50">
                Check-in Sekarang
              </button>
            </div>
          </div>

          <div className="h-24 md:hidden" />
          <div className={`md:hidden fixed bottom-0 left-0 right-0 px-4 pb-6 z-30 transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button onClick={handleOpenSheet} disabled={!selectedSessionId}
              className="w-full bg-[#941C2F] text-white font-bold py-4 text-[15px] rounded-2xl shadow-xl shadow-[#941C2F]/30 active:scale-[0.98] transition-all disabled:opacity-50">
              Check-in Sekarang
            </button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Check-in Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Berhasil!</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Kehadiran Anda telah tercatat di sistem.</p>
          </div>
          <div className="md:flex md:items-center md:gap-16">
            <div className="flex justify-center md:flex-1 mb-10 md:mb-0">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-36 h-36 md:w-48 md:h-48 bg-[#941C2F]/5 rounded-full animate-ping" />
                <div className="absolute w-28 h-28 md:w-36 md:h-36 bg-[#941C2F]/8 rounded-full" />
                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#941C2F]/30">
                  <Check size={36} strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="md:flex-1">
              <div className="bg-white rounded-3xl border border-slate-100 md:border-slate-200 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:shadow-md">
                <div className="h-1 bg-[#941C2F]" />
                <div className="p-6 md:p-7 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Aktif</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {selectedSession?.mata_kuliah}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{selectedSession?.ruangan} · {selectedSession?.nama_kelas}</span>
                  </h3>
                  <div className="border-t border-slate-100 pt-5 pb-5">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-in Pada</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-[#941C2F]">{currentTime} <span className="text-base font-bold">WIB</span></p>
                  </div>
                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Selamat bertugas! Jangan lupa untuk melakukan <span className="font-bold text-slate-700">Check-out</span> setelah sesi berakhir.
                  </p>
                </div>
              </div>
              <button onClick={() => setStep(1)} className="mt-4 w-full bg-[#941C2F] text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                Kembali ke Beranda
              </button>
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
