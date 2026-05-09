'use client';
import React, { useState } from 'react';
import { Check, Scan, ArrowLeft, Clock, MapPin, BookOpen, X, AlertCircle } from 'lucide-react';

const mockSessions = [
  { id: 1, sessionName: 'SESI 1', subject: 'Basis Data', room: 'R. 901', time: '07:30 - 10:00', status: 'Aktif' },
  { id: 2, sessionName: 'SESI 2', subject: 'Algoritma Pemrograman', room: 'R. Lab 2', time: '10:30 - 13:00', status: 'Aktif' },
  { id: 3, sessionName: 'SESI 3', subject: 'Sistem Operasi', room: 'R. 804', time: '13:30 - 16:00', status: 'Mendatang' },
];

export default function CheckInPage() {
  const [step, setStep] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(mockSessions[0]?.id ?? null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);

  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const selectedSession = mockSessions.find(s => s.id === selectedSessionId);

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

  const handleConfirmCheckIn = () => {
    handleCloseSheet();
    setTimeout(() => setStep(3), 300);
  };

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans">
      {isSheetOpen && (
        <>
          <div
            onClick={handleCloseSheet}
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out
              ${isSheetVisible && !isSheetClosing ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md md:max-w-xl bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] overflow-hidden pointer-events-auto"
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
                    { label: 'Mata Kuliah', value: selectedSession?.subject ?? '-' },
                    { label: 'Sesi',        value: selectedSession?.sessionName ?? '-' },
                    { label: 'Ruangan',     value: selectedSession?.room ?? '-' },
                    { label: 'Waktu',       value: selectedSession?.time ?? '-' },
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
                  <button onClick={handleConfirmCheckIn}
                    className="flex-1 py-3 rounded-xl bg-[#941C2F] text-white font-bold text-sm shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                    Ya, Check-in
                  </button>
                </div>
                <div className="flex flex-col gap-3 md:hidden">
                  <button onClick={handleConfirmCheckIn}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20">
                    Ya, Check-in
                  </button>
                  <button onClick={handleCloseSheet}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
                    Kembali ke Beranda
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
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Check-in Kehadiran</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Pindai Kode QR</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Arahkan kamera ke kode QR yang disediakan koordinator.</p>
          </div>
          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-12 lg:p-16 md:flex md:items-center md:gap-16">
            <div className="hidden md:flex md:flex-1 flex-col justify-center">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1F2937] mb-3">Pindai Kode QR</h3>
              <p className="text-base text-slate-500 leading-relaxed">
                Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator di depan kelas untuk melakukan check-in kehadiran.
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
              <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase md:text-xs">Check-in Kehadiran</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Pilih Sesi Mengajar</h2>
            </div>
            <button onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-10 lg:p-12">
            <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
              <h4 className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Sesi Tersedia Hari Ini</h4>
              <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg">{mockSessions.length} Sesi</span>
            </div>

            <div className="space-y-3 mb-8 md:mb-10">
              {mockSessions.map(s => {
                const isSel = selectedSessionId === s.id;
                const isAktif = s.status === 'Aktif';
                const isMendatang = s.status === 'Mendatang';
                return (
                  <div key={s.id} onClick={() => !isMendatang && setSelectedSessionId(s.id)}
                    className={`bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border-2 transition-all gap-3 md:gap-0
                      ${isMendatang ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.99]'}
                      ${isSel ? 'border-[#941C2F] shadow-md shadow-[#941C2F]/10' : 'border-transparent md:border-slate-100 md:hover:border-slate-200 md:hover:shadow-md'}`}>
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 md:w-2/5">
                      <div className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isSel ? 'bg-[#941C2F]/10' : 'bg-rose-50'} text-[#941C2F]`}>
                        <BookOpen size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{s.subject}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] md:text-xs font-bold tracking-wider ${isAktif ? 'text-[#941C2F]' : 'text-slate-400'}`}>{s.sessionName}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className={`text-[10px] md:text-xs font-semibold ${isAktif ? 'text-emerald-600' : 'text-slate-400'}`}>{s.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                      <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center md:justify-start gap-2">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs md:text-[13px] font-semibold text-slate-700">{s.time}</span>
                      </div>
                      <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center md:justify-start gap-2">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs md:text-[13px] font-semibold text-slate-700">{s.room}</span>
                      </div>
                      <div className={`shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all ${isSel ? 'bg-[#941C2F] shadow-md' : 'bg-slate-100'}`}>
                        <Check size={13} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Aktif</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {selectedSession?.subject}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{selectedSession?.room} · {selectedSession?.sessionName}</span>
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
    </div>
  );
}