'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Scan, ArrowLeft, BookOpen, AlertCircle, Loader2, Camera, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { getMyPresensi, submitCheckOut, type PresensiResponseDTO } from '@/lib/actions/presensi';

import Link from 'next/link';
import { AsdosQrScanSkeleton, AsdosPageShell, AsdosPageHeader } from '@/components/dashboard/asdos/AsdosUI';
import { isQrPresensi } from '@/lib/presensi-mode';

export default function CheckOutPage() {
  const MAX_HURUF = 100;

  const [step, setStep] = useState(1);
  const [materi, setMateri] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activePresensi, setActivePresensi] = useState<PresensiResponseDTO | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'scanning'>('idle');
  const [scanMessage, setScanMessage] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    async function fetchActivePresensi() {
      setIsLoading(true);
      try {
        const res = await getMyPresensi();
        if (res.success && res.data) {
          const today = new Date().toISOString().split('T')[0];
          const active = res.data.find(p => {
            if (!isQrPresensi(p)) return false;
            const checkout = p.waktu_checkout;
            const isOpen = !checkout ||
                           checkout === '' ||
                           checkout === 'null' ||
                           String(checkout).startsWith('0001');
            if (!isOpen) return false;
            const presensiDate = String(p.tanggal_mengajar ?? '').split('T')[0];
            return presensiDate === today;
          });
          setActivePresensi(active ?? null);
        } else {
          setActivePresensi(null);
        }
      } catch (error) {
        console.error('Error in fetchActivePresensi:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivePresensi();
  }, []);

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
        stopCamera();
        setQrToken(code.data);
        setStep(2);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [stopCamera]);

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
        setQrToken(code.data);
        setCameraStatus('idle');
        setStep(2);
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
  }, []);

  const handleConfirmCheckOut = async () => {
    if (!activePresensi) return;

    setIsSubmitting(true);
    const res = await submitCheckOut({
      id_presensi: activePresensi.id_presensi,
      deskripsi_materi: materi,
      qr_token: qrToken,
    });

    if (res.success) {
      setStep(3);
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

  if (!activePresensi && step !== 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tidak Ada Sesi Aktif</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Anda belum memiliki sesi QR aktif hari ini. Pastikan sudah melakukan check-in.        </p>
        <Link
          href="/asdos/check-in"
          className="bg-crimson text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-crimson/20 hover:bg-[#7a1727] transition-all"
        >
          Ke Halaman Check-In
        </Link>
      </div>
    );
  }

  return (
    <AsdosPageShell>

      {step === 1 && (
        <>
          <AsdosPageHeader eyebrow="Check-out Kehadiran" title="Pindai Kode QR" description="Arahkan kamera ke kode QR untuk menyelesaikan sesi mengajar." />

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-start md:gap-16">
            <div className="hidden md:flex md:flex-1 flex-col justify-center pt-8">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mb-3">Pindai Kode QR</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator untuk menyelesaikan dan mencatat sesi mengajar hari ini. Pastikan pencahayaan cukup dan kode QR berada di dalam area pindai.
              </p>

              <div className="mt-8 flex flex-row gap-4 w-full">
                {cameraStatus === 'idle' || cameraStatus === 'denied' ? (
                  <button
                    onClick={() => startCamera()}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-crimson text-white font-bold py-3.5 rounded-xl text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]"
                  >
                    <Camera size={18} />
                    Aktifkan Kamera
                  </button>
                ) : cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
                  <button disabled
                    className="flex-1 flex items-center justify-center gap-2.5 bg-crimson/60 text-white font-bold py-3.5 rounded-xl text-sm cursor-not-allowed">
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
                  className="mt-4 w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-crimson transition-colors"
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
                <div className={`w-full aspect-square flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner
                  ${cameraStatus === 'active' ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                  {cameraStatus === 'requesting' || cameraStatus === 'scanning' ? (
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

      {step === 2 && activePresensi && (
        <>
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase md:text-xs">Check-out Kehadiran</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Isi Laporan Materi</h2>
            </div>
            <button
              onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5 w-full">
              <article className="flex flex-col md:flex-row md:items-center gap-6 md:gap-4">
                <div className="flex flex-col gap-1 w-full md:min-w-0">
                  <h2 className="text-xl md:text-base font-bold text-slate-900 leading-snug line-clamp-2 mb-1 md:mb-0.5">
                    {activePresensi.nama_mata_kuliah}
                  </h2>
                  <p className="text-sm md:text-xs text-slate-500 font-medium">{activePresensi.nama_kelas}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 md:gap-y-3 w-full md:w-auto shrink-0 md:ml-auto">
                  <div className="flex flex-col gap-1 md:gap-0.5 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</span>
                    <span className="text-sm md:text-xs font-bold text-slate-800">
                      {new Date(activePresensi.tanggal_mengajar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 md:gap-0.5 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Check-in</span>
                    <span className="text-sm md:text-xs font-bold text-slate-800">
                      {new Date(activePresensi.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 md:gap-0.5 border-l-2 border-slate-100 pl-4">
                    <span className="text-[10px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ruangan</span>
                    <span className="text-sm md:text-xs font-bold text-slate-800">{activePresensi.nama_ruangan}</span>
                  </div>
                </div>
              </article>
            </section>

            <section className="bg-white rounded-[12px] md:rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-5 w-full">
              <div className="flex items-center gap-2">
                <BookOpen className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
                <span className="text-sm md:text-base font-bold text-slate-800">Bahasan Materi</span>
              </div>

              <div className="relative">
                <textarea
                  value={materi}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.length <= MAX_HURUF) setMateri(val);
                  }}
                  placeholder="Ketik bahasan materi yang diajarkan..."
                  className="w-full bg-fog rounded-[14px] p-4 md:p-5 pb-8 text-sm md:text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crimson/30 transition-all resize-none h-36 md:h-48 border-0"
                />
                <div className={`absolute bottom-3 right-4 text-[10px] font-medium bg-fog/80 px-1 ${materi.length >= MAX_HURUF ? 'text-crimson' : 'text-slate-400'}`}>
                  {materi.length} / {MAX_HURUF} huruf
                </div>
              </div>

              <p className="text-[10px] md:text-xs text-crimson font-medium leading-relaxed">
                * Mohon isi bahasan materi dengan jelas untuk keperluan rekapitulasi kehadiran asisten dosen.
              </p>

              <div className="pt-2 border-t border-slate-100">
                {isConfirmOpen ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-slate-800">Anda yakin?</p>
                      <p className="text-sm text-slate-400 mt-0.5">Check-out akan langsung dicatat.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-3 md:shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsConfirmOpen(false)}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-[14px] bg-white border border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-all hover:bg-slate-50 disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCheckOut}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-[14px] bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        Ya, Check-out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="md:flex md:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={!materi.trim()}
                      className="w-full md:w-auto bg-crimson text-white font-bold py-4 md:py-3.5 md:px-10 text-[15px] rounded-[14px] shadow-md shadow-crimson/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-[#7a1727]"
                    >
                      Check-out Sekarang
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {step === 3 && activePresensi && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-crimson tracking-[0.15em] uppercase mb-1 md:text-xs">Check-out Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Sesi Selesai!</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Sesi mengajar Anda telah diselesaikan dan dicatat.</p>
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
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Diselesaikan</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {activePresensi.nama_mata_kuliah}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{activePresensi.nama_ruangan} · {activePresensi.nama_kelas}</span>
                  </h3>

                  <div className="flex gap-4 border-t border-slate-100 pt-5 pb-5">
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-in</p>
                      <p className="text-base md:text-lg font-extrabold text-slate-600">
                        {new Date(activePresensi.waktu_checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </p>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-out</p>
                      <p className="text-base md:text-lg font-extrabold text-crimson">{currentTime} WIB</p>
                    </div>
                  </div>

                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Terima kasih telah mengajar hari ini. Anda dapat melihat detailnya di menu <span className="font-bold text-slate-700">Riwayat</span>.
                  </p>
                </div>
              </div>
              <Link
                href="/asdos"
                className="mt-4 w-full bg-crimson text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-crimson/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] flex items-center justify-center"
              >
                Kembali ke Beranda
              </Link>
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
