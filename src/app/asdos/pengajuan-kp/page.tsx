'use client';
import React, { useState } from 'react';
import { CalendarPlus, Clock, CheckCircle2, XCircle, Check, X, MapPin } from 'lucide-react';

type KpStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type KpHistoryItem = { id: number; room: string; day: string; time: string; reason: string; status: KpStatus; };

const mockKpHistory: KpHistoryItem[] = [
  { id: 1, room: 'Ruang 901', day: 'KAMIS', time: '14:00 (JAM 2.00)', reason: 'Ada jadwal bentrok dengan praktikum wajib di lab lain.', status: 'MENUNGGU' },
  { id: 2, room: 'Ruang Lab Komputer A', day: 'RABU', time: '15:30 (JAM 3.30)', reason: 'Sakit tifus, surat keterangan dokter sudah diserahkan ke prodi.', status: 'DISETUJUI' },
  { id: 3, room: 'Ruang 805', day: 'SENIN', time: '13:00 (JAM 1.00)', reason: 'Acara keluarga mendadak di luar kota.', status: 'DITOLAK' },
];

const statusConfig: Record<KpStatus, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  MENUNGGU:  { icon: Clock,        bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'Menunggu'  },
  DISETUJUI: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Disetujui' },
  DITOLAK:   { icon: XCircle,      bg: 'bg-rose-50',    text: 'text-rose-600',    label: 'Ditolak'   },
};

export default function PengajuanKpPage() {
  const [ruangan, setRuangan] = useState('');
  const [hari, setHari] = useState('Selasa');
  const [waktu, setWaktu] = useState('14:30 (Jam 2.30)');
  const [alasan, setAlasan] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);

  const handleOpenSheet = () => {
    setIsFormOpen(true);
    setIsSheetClosing(false);
    setSheetDragY(0);
    setTimeout(() => setIsSheetVisible(true), 10);
  };

  const handleCloseSheet = () => {
    if (isSuccess) return;
    setIsSheetClosing(true);
    setIsSheetVisible(false);
    setTimeout(() => {
      setIsFormOpen(false);
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

  const handleSubmit = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      handleCloseSheet();
      setRuangan('');
      setAlasan('');
    }, 2000);
  };

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans">

      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Kelas Pengganti</p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Riwayat Kelas Pengganti</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base">Daftar pengajuan Kelas Pengganti Anda.</p>
        </div>
        <button onClick={handleOpenSheet}
          className="hidden md:flex items-center gap-2 bg-[#941C2F] text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all text-[15px] mt-4 md:mt-0">
          <CalendarPlus size={18} /><span>Ajukan Kelas Pengganti</span>
        </button>
      </div>

      <div className="space-y-3 pb-24 md:pb-8">
        {mockKpHistory.map(item => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id}
              className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all gap-3 md:gap-0">
              <div className="flex items-center gap-3 md:gap-4 min-w-0 md:w-2/5">
                <div className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-rose-50 text-[#941C2F]">
                  <CalendarPlus size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{item.room}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">{item.day}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 tracking-wider">{item.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 pt-3 border-t border-slate-100 md:border-none md:pt-0">
                <div className="flex-1 md:flex-none md:max-w-xs bg-slate-50 border border-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-lg">
                  <p className="text-xs md:text-[13px] text-slate-600 line-clamp-1 italic">"{item.reason}"</p>
                </div>
                <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg ${cfg.bg} ${cfg.text}`}>
                  <Icon size={13} strokeWidth={2.5} />
                  <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase">{cfg.label}</span>
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 md:mt-2">
          Menampilkan {mockKpHistory.length} pengajuan kelas pengganti.
        </p>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10">
        <div className="max-w-md mx-auto">
          <button onClick={handleOpenSheet}
            className="w-full flex items-center justify-center gap-2 bg-[#941C2F] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all text-[15px]">
            <CalendarPlus size={18} /><span>Ajukan Kelas Pengganti</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
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

                {isSuccess ? (
                  /* Success state */
                  <div className="h-56 md:h-64 flex flex-col items-center justify-center text-center">
                    <div className="relative flex items-center justify-center mb-8">
                      <div className="absolute w-28 h-28 bg-[#941C2F]/5 rounded-full animate-ping" />
                      <div className="absolute w-20 h-20 bg-[#941C2F]/10 rounded-full" />
                      <div className="relative w-14 h-14 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30">
                        <Check size={28} strokeWidth={3} />
                      </div>
                    </div>
                    <h2 className="text-xl font-extrabold text-[#1F2937] mb-1">Pengajuan Berhasil!</h2>
                    <p className="text-sm text-slate-500">Formulir Kelas Pengganti Anda telah disubmit.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Pengajuan Kelas Pengganti</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Isi formulir untuk mengajukan kelas pengganti.</p>
                      </div>
                      <button onClick={handleCloseSheet}
                        className="hidden md:flex shrink-0 w-9 h-9 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors ml-4">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">Ruangan</label>
                          <input type="text" value={ruangan} onChange={e => setRuangan(e.target.value)} placeholder="R705"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">Jadwal Hari</label>
                          <select value={hari} onChange={e => setHari(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all appearance-none">
                            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(h => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">Waktu Ajar</label>
                        <select value={waktu} onChange={e => setWaktu(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all appearance-none">
                          {['07:30 (Jam 1.00)','10:30 (Jam 2.00)','13:00 (Jam 3.00)','14:30 (Jam 2.30)','15:30 (Jam 3.30)'].map(w => <option key={w}>{w}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">Alasan Pengajuan</label>
                        <textarea value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Masukkan alasan Anda..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!isSuccess && (
                <div className="sticky bottom-0 px-5 pb-6 md:pb-6 pt-4 border-t border-slate-100 bg-white">
                  <button onClick={handleSubmit} disabled={!ruangan.trim() || !alasan.trim()}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20 disabled:opacity-60 disabled:cursor-not-allowed">
                    Kirim Pengajuan
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}