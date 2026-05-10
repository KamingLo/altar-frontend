'use client';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

const ROOM_LABEL = 'Ruang 901';
const QR_DATA = 'Token_Presensi_Ruang_901';
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(QR_DATA)}`;

export default function GenerateQrPage() {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(QR_SRC);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-presensi-${ROOM_LABEL.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(QR_SRC, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleDone = useCallback(() => {
    router.push('/koordinator');
  }, [router]);

  const DownloadIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const InfoIcon = () => (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="relative min-h-screen w-full bg-transparent text-slate-800 md:mx-auto md:max-w-5xl md:px-6 md:pt-8 lg:px-8 lg:pt-12">
      <header className="relative z-10 mb-10 md:mb-14">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#941C2F] md:text-xs">
          Presensi
        </p>
        <h1 className="text-[28px] font-extrabold leading-8 tracking-tight text-[#1F2937] md:text-3xl">
          Generate QR Ruangan
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 md:text-[15px]">
          Kode untuk check-in asisten dosen di sesi ini. Tampilkan di layar kelas agar mudah discan.
        </p>
      </header>

      <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-0">
        {/* QR */}
        <section className="flex flex-col items-center lg:items-start">
          <h2 className="text-center text-lg font-bold text-[#1F2937] lg:text-left lg:text-xl">
            QR berhasil dibuat
          </h2>
          <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">
            Scan dengan kamera ponsel
          </p>

          <img
            src={QR_SRC}
            alt={`QR Code ${ROOM_LABEL}`}
            width={280}
            height={280}
            className="mt-6 h-52 w-52 rounded-2xl bg-white object-contain shadow-[0_4px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 sm:h-56 sm:w-56 md:mt-8 md:h-[272px] md:w-[272px]"
          />

          <div className="mt-6 flex max-w-sm gap-2.5 border-l-2 border-[#941C2F]/25 pl-4 md:mt-8">
            <InfoIcon />
            <p className="text-[13px] leading-relaxed text-slate-600">
              Tampilkan QR utuh dan cukup besar di layar; pastikan tidak terpotong atau blur. Silau
              berlebihan di permukaan layar sering membuat scan gagal atau lambat.
            </p>
          </div>
        </section>

        <div className="hidden h-full min-h-[200px] w-px bg-slate-200/90 lg:block" aria-hidden />

        {/* Detail & aksi */}
        <section className="flex flex-col justify-center lg:max-w-md lg:justify-start">
          <dl className="space-y-8">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Lokasi mengajar
              </dt>
              <dd className="mt-2 text-4xl font-extrabold tracking-tight text-[#1F2937] sm:text-[2.75rem] sm:leading-none">
                {ROOM_LABEL}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Berlaku sampai
              </dt>
              <dd className="mt-2">
                <span className="inline-flex items-baseline text-4xl font-extrabold tabular-nums tracking-tight text-[#941C2F] sm:text-5xl">
                  14:30
                  <span className="ml-1 text-xl font-bold text-[#941C2F]/70 sm:text-2xl">WIB</span>
                </span>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Check-in dengan kode ini hanya diproses hingga batas waktu di atas. Jika sesi berlanjut,
                  buat QR baru agar presensi tetap valid.
                </p>
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#941C2F] bg-white/85 py-3.5 text-[15px] font-bold text-[#941C2F] shadow-sm backdrop-blur-sm transition-colors hover:bg-white active:bg-rose-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#941C2F] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
            >
              <DownloadIcon />
              {downloading ? 'Mengunduh…' : 'Unduh QR'}
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#941C2F] py-3.5 text-[15px] font-bold text-white shadow-md shadow-[#941C2F]/20 transition-colors hover:bg-[#7a1728] active:bg-[#651420] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#941C2F] focus-visible:ring-offset-2"
            >
              <CheckCircleIcon />
              Selesai
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
