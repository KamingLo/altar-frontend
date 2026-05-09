'use client';
import React, { useState } from 'react';
import { Check, ArrowLeft, Clock, BookOpen, Send, Link2, X, AlertCircle } from 'lucide-react';

const mockOnlineSessions = [
  { id: 1, sessionName: 'SESI 1', subject: 'Basis Data', platform: 'Online', time: '07:30 - 10:00', status: 'Aktif' },
  { id: 2, sessionName: 'SESI 2', subject: 'Algoritma Pemrograman', platform: 'Online', time: '10:30 - 13:00', status: 'Aktif' },
  { id: 3, sessionName: 'SESI 3', subject: 'Sistem Operasi', platform: 'Online', time: '13:30 - 16:00', status: 'Mendatang' },
];

export default function PresensiKelasOnlinePage() {
  const [step, setStep] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(mockOnlineSessions[0]?.id ?? null);
  const [link, setLink] = useState('');
  const [materi, setMateri] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);

  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const selectedSession = mockOnlineSessions.find(s => s.id === selectedSessionId);

  const handleReset = () => {
    setStep(1);
    setSelectedSessionId(mockOnlineSessions[0]?.id ?? null);
    setLink('');
    setMateri('');
  };

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

  const handleConfirmSend = () => {
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
                    <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Konfirmasi Kirim Laporan</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Pastikan data laporan sudah benar.</p>
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
                    { label: 'Platform',    value: selectedSession?.platform ?? '-' },
                    { label: 'Waktu',       value: selectedSession?.time ?? '-' },
                    { label: 'Link',        value: link, isLink: true },
                  ].map(({ label, value, isLink }, i, arr) => (
                    <React.Fragment key={label}>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase shrink-0 mt-0.5">{label}</span>
                        <span className={`text-sm font-semibold text-right break-all line-clamp-2
                          ${label === 'Mata Kuliah' ? 'font-bold text-[#1F2937]' : ''}
                          ${label === 'Platform' ? 'text-[#941C2F]' : 'text-slate-700'}
                          ${isLink ? 'text-blue-600 text-[11px]' : ''}`}>
                          {value}
                        </span>
                      </div>
                      {i < arr.length - 1 && <div className="h-px bg-slate-100" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] md:text-xs text-amber-700 font-medium leading-relaxed">
                    Laporan yang sudah dikirim tidak dapat diubah kembali.
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 px-5 pb-6 md:pb-6 pt-4 border-t border-slate-100 bg-white">
                <div className="hidden md:flex gap-3">
                  <button onClick={handleCloseSheet}
                    className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition-all hover:bg-slate-50">
                    Batal
                  </button>
                  <button onClick={handleConfirmSend}
                    className="flex-1 py-3 rounded-xl bg-[#941C2F] text-white font-bold text-sm shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] flex items-center justify-center gap-2">
                    <Send size={14} /> Kirim Laporan
                  </button>
                </div>
                  <div className="flex flex-col gap-3 md:hidden">
                    <button onClick={handleConfirmSend}
                      className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20 flex items-center justify-center gap-2">
                      <Send size={16} /> Kirim Laporan
                    </button>
                    <button onClick={handleCloseSheet}
                      className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-[0.98] hover:bg-slate-200 transition-all text-[15px]">
                      Batal
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
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Presensi Kelas Online</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Pilih Sesi Online</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Pilih jadwal kelas online yang akan Anda laporkan hari ini.</p>
          </div>
          <div className="md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-200 md:p-10 lg:p-12">
            <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
              <h4 className="text-[11px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Sesi Tersedia Hari Ini</h4>
              <span className="bg-[#941C2F]/10 text-[#941C2F] text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg">{mockOnlineSessions.length} Sesi</span>
            </div>
            <div className="space-y-3 mb-8 md:mb-10">
              {mockOnlineSessions.map(s => {
                const isSel = selectedSessionId === s.id;
                const isAktif = s.status === 'Aktif';
                return (
                  <div key={s.id} onClick={() => setSelectedSessionId(s.id)}
                    className={`bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border-2 cursor-pointer active:scale-[0.99] transition-all gap-3 md:gap-0
                      ${isSel ? 'border-[#941C2F] shadow-md shadow-[#941C2F]/10' : 'border-transparent md:border-slate-100 md:hover:border-slate-200 md:hover:shadow-md'}`}>
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 md:w-2/5">
                      <div className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isSel ? 'bg-[#941C2F]/10 text-[#941C2F]' : 'bg-rose-50 text-[#941C2F]'}`}>
                        <BookOpen size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{s.subject}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">{s.sessionName}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className={`text-[10px] md:text-xs font-semibold ${isAktif ? 'text-emerald-600' : 'text-slate-400'}`}>{s.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                      <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className="text-xs md:text-[13px] font-semibold text-slate-700">{s.time}</span>
                      </div>
                      <div className="flex-1 md:flex-none bg-[#941C2F]/10 border border-[#941C2F]/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center gap-2">
                        <span className="text-xs md:text-[13px] font-bold text-[#941C2F]">{s.platform}</span>
                      </div>
                      <div className={`shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all ${isSel ? 'bg-[#941C2F] shadow-md' : 'bg-slate-100'}`}>
                        <Check size={13} strokeWidth={3} className={isSel ? 'text-white' : 'text-slate-300'} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`transition-all duration-300 ${selectedSessionId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 bg-[#941C2F]/10 rounded-2xl flex items-center justify-center">
                    <BookOpen size={16} className="text-[#941C2F]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">Sesi Dipilih</p>
                    <p className="text-sm md:text-[15px] font-bold text-slate-800 leading-tight">
                      {selectedSession?.subject}
                      <span className="font-normal text-slate-400 ml-2 text-xs">· {selectedSession?.sessionName} · {selectedSession?.platform}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setStep(2)} disabled={!selectedSessionId}
                  className="w-full md:w-auto shrink-0 bg-[#941C2F] text-white font-bold py-3.5 md:py-3 md:px-10 text-sm md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727] disabled:opacity-50">
                  Lanjut Isi Laporan
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 2 && selectedSession && (
        <>
          <div className="mb-6 md:mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase md:text-xs">Presensi Kelas Online</p>
              <h2 className="text-[22px] md:text-3xl leading-7 md:leading-8 font-extrabold text-[#1F2937]">Isi Laporan</h2>
            </div>
            <button onClick={() => setStep(1)}
              className="shrink-0 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-2xl active:scale-95 transition-all hover:bg-slate-50 shadow-sm">
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
                  <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{selectedSession.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">{selectedSession.sessionName}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] md:text-xs font-bold text-[#941C2F]">{selectedSession.platform}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{selectedSession.time}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2">
                  <Clock size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs md:text-[13px] font-semibold text-slate-700">{currentTime} WIB</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div>
                <div className="flex items-center gap-1.5 mb-2 ml-1">
                  <Link2 size={13} className="text-slate-400" />
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Tautan / Link Video</label>
                </div>
                <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="Masukkan link Teams / rekaman..."
                  className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl px-4 py-3.5 md:p-5 text-sm md:text-base text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2 ml-1">
                  <BookOpen size={13} className="text-slate-400" />
                  <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase">Laporan / Bahasan Materi</label>
                </div>
                <div className="relative">
                  <textarea value={materi} onChange={e => setMateri(e.target.value)} placeholder="Ketik detail bahasan materi hari ini..."
                    className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-sm md:text-base text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28 md:h-40" />
                  <div className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-medium bg-white/80 px-1">{materi.length} karakter</div>
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-[#941C2F] leading-relaxed ml-1 font-medium">
                * Mohon isi tautan dan materi dengan jelas sebagai bukti presensi kehadiran asisten dosen.
              </p>
              <div className="md:flex md:justify-end md:pt-2 md:border-t md:border-slate-100">
                <button onClick={handleOpenSheet} disabled={!link.trim() || !materi.trim()}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#941C2F] text-white font-bold py-4 md:py-3 md:px-10 text-sm md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-[#7a1727]">
                  <Send size={16} /><span>Kirim Laporan</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {step === 3 && selectedSession && (
        <>
          <div className="mb-6 md:mb-8 text-center md:text-left">
            <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Presensi Kelas Online</p>
            <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Laporan Terkirim!</h2>
            <p className="text-sm text-slate-500 mt-1 md:text-base">Laporan kehadiran online Anda telah berhasil terkirim.</p>
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
                <div className="p-6 md:p-7">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Presensi Online</p>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    {selectedSession.subject}
                    <span className="block text-sm font-medium text-slate-400 mt-0.5">{selectedSession.platform} · {selectedSession.sessionName}</span>
                  </h3>
                  <div className="border-t border-slate-100 pt-5 pb-5">
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Dikirim Pada</p>
                    <p className="text-2xl md:text-3xl font-extrabold text-[#941C2F]">{currentTime} <span className="text-base font-bold">WIB</span></p>
                  </div>
                  <p className="text-[11px] md:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
                    Terima kasih telah melaporkan kehadiran Anda. Anda dapat melihat detailnya di menu <span className="font-bold text-slate-700">Riwayat</span>.
                  </p>
                </div>
              </div>
              <button onClick={handleReset} className="mt-4 w-full bg-[#941C2F] text-white font-bold py-4 md:text-[15px] rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all hover:bg-[#7a1727]">
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}