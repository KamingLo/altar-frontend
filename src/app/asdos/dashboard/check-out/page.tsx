'use client';
import React, { useState } from 'react';
import { Check, Scan, ArrowLeft, Clock, MapPin, BookOpen } from 'lucide-react';

const activeSession = {
  id: 1,
  sessionName: 'SESI 1',
  subject: 'Basis Data',
  room: 'R. 901',
  time: '07:30 - 10:00',
  checkInTime: '07:28 WIB',
};

export default function CheckOutPage() {
  const [step, setStep] = useState(1);
  const [materi, setMateri] = useState('');
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans">

      {step === 1 && (
        <>
          <div className="mb-6 md:mb-8">
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Check-out Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Pindai Kode QR</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Arahkan kamera ke kode QR untuk menyelesaikan sesi mengajar.</p>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-center md:gap-16">
            <div className="hidden md:flex md:flex-1 flex-col justify-center">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mb-3">Pindai Kode QR</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator untuk menyelesaikan dan mencatat sesi mengajar hari ini.
              </p>
            </div>

            <div className="md:flex-1 flex flex-col items-center justify-center">
              <div
                className="relative w-64 h-64 md:w-72 md:h-72 cursor-pointer active:scale-95 transition-transform hover:scale-[1.02]"
                onClick={() => setStep(2)}
              >
                <div className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 border-t-[4px] md:border-t-[5px] border-l-[4px] md:border-l-[5px] border-[#941C2F] rounded-tl-3xl md:rounded-tl-[1.75rem]" />
                <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 border-t-[4px] md:border-t-[5px] border-r-[4px] md:border-r-[5px] border-[#941C2F] rounded-tr-3xl md:rounded-tr-[1.75rem]" />
                <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 border-b-[4px] md:border-b-[5px] border-l-[4px] md:border-l-[5px] border-[#941C2F] rounded-bl-3xl md:rounded-bl-[1.75rem]" />
                <div className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 border-b-[4px] md:border-b-[5px] border-r-[4px] md:border-r-[5px] border-[#941C2F] rounded-br-3xl md:rounded-br-[1.75rem]" />
                <div className="absolute top-1/2 left-4 right-4 h-[2px] md:h-[3px] bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
                  <Scan size={96} className="md:w-28 md:h-28" />
                </div>
              </div>
              <p className="mt-8 text-xs md:text-sm text-slate-400 italic">*Klik area ini untuk simulasi scan</p>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase md:text-xs">Check-out Kehadiran</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Isi Laporan Materi</h2>
            </div>
            <button
              onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-10 lg:p-12">

            <div className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border border-[#941C2F]/20 mb-6 md:mb-8 gap-3 md:gap-0">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-[#941C2F]/10 text-[#941C2F]">
                  <BookOpen size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{activeSession.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] md:text-xs font-bold text-[#941C2F] tracking-wider">{activeSession.sessionName}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">Sedang Berjalan</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{activeSession.time}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{activeSession.room}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2">
                  <Clock size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-emerald-700">Masuk: {activeSession.checkInTime}</span>
                </div>
              </div>
            </div>

            <div className="mb-2 md:mb-4">
              <div className="flex items-center gap-1.5 mb-2 md:mb-3 ml-1">
                <BookOpen size={13} className="text-slate-400" />
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Bahasan Materi</label>
              </div>
              <div className="relative">
                <textarea value={materi} onChange={e => setMateri(e.target.value)}
                  placeholder="Ketik bahasan materi yang diajarkan..."
                  className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-sm md:text-base text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-32 md:h-48" />
                <div className="absolute bottom-3 md:bottom-5 right-4 md:right-6 text-[10px] md:text-xs text-slate-400 font-medium bg-white/80 px-1">{materi.length} karakter</div>
              </div>
            </div>

            <p className="text-[10px] md:text-xs text-[#941C2F] leading-relaxed ml-1 mb-8 md:mb-10 font-medium">
              * Mohon isi bahasan materi dengan jelas untuk keperluan rekapitulasi kehadiran asisten dosen.
            </p>

            <div className="md:flex md:justify-end md:pt-4 md:border-t md:border-slate-100">
              <button onClick={() => setStep(3)} disabled={!materi.trim()}
                className="w-full md:w-auto bg-[#941C2F] text-white font-bold py-4 md:py-3 md:px-10 text-sm md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-[#7a1727]">
                Check-out Sekarang
              </button>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Check-out Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Sesi Selesai!</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Sesi mengajar Anda telah diselesaikan dan dicatat.</p>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-center md:gap-16">
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
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Diselesaikan</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {activeSession.subject}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{activeSession.room} · {activeSession.sessionName}</span>
                  </h3>

                  <div className="flex gap-4 border-t border-slate-100 pt-5 pb-5">
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-in</p>
                      <p className="text-base md:text-lg font-extrabold text-slate-600">{activeSession.checkInTime}</p>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="flex-1">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Check-out</p>
                      <p className="text-base md:text-lg font-extrabold text-[#941C2F]">{currentTime} WIB</p>
                    </div>
                  </div>

                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Terima kasih telah mengajar hari ini. Anda dapat melihat detailnya di menu <span className="font-bold text-slate-700">Riwayat</span>.
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
    </div>
  );
}