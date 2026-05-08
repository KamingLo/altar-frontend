'use client';
import React, { useState } from 'react';
import { CalendarPlus, Clock, CheckCircle2, XCircle, Check, X } from 'lucide-react';
type KpStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';
type KpHistoryItem = { id: number; room: string; day: string; time: string; reason: string; status: KpStatus; };
const mockKpHistory: KpHistoryItem[] = [
  { id: 1, room: 'Ruang 901', day: 'KAMIS', time: '14:00 (JAM 2.00)', reason: 'Ada jadwal bentrok dengan praktikum wajib di lab lain.', status: 'MENUNGGU' },
  { id: 2, room: 'Ruang Lab Komputer A', day: 'RABU', time: '15:30 (JAM 3.30)', reason: 'Sakit tifus, surat keterangan dokter sudah diserahkan ke prodi.', status: 'DISETUJUI' },
  { id: 3, room: 'Ruang 805', day: 'SENIN', time: '13:00 (JAM 1.00)', reason: 'Acara keluarga mendadak di luar kota.', status: 'DITOLAK' },
];

const statusConfig: Record<KpStatus, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  MENUNGGU:  { icon: Clock,         bg: 'bg-slate-100',   text: 'text-slate-500',   label: 'Menunggu'  },
  DISETUJUI: { icon: CheckCircle2,  bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Disetujui' },
  DITOLAK:   { icon: XCircle,       bg: 'bg-rose-50',     text: 'text-rose-600',    label: 'Ditolak'   },
};

export default function PengajuanKpPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ruangan, setRuangan] = useState('');
  const [hari, setHari] = useState('Selasa');
  const [waktu, setWaktu] = useState('14:30 (Jam 2.30)');
  const [alasan, setAlasan] = useState('');

  const handleSubmit = () => {
    setIsSuccess(true);
    setTimeout(() => { setIsSuccess(false); setIsFormOpen(false); setRuangan(''); setAlasan(''); }, 2000);
  };

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 pb-8 pt-2 min-h-screen font-sans">

      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Kelas Pengganti</p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Riwayat KP</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base">Daftar pengajuan Kelas Pengganti Anda.</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="hidden md:flex items-center gap-2 bg-[#941C2F] text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-[#941C2F]/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all text-[15px]">
          <CalendarPlus size={18} /><span>Ajukan Kelas Pengganti</span>
        </button>
      </div>

      <div className="space-y-3 pb-24 md:pb-8">
        {mockKpHistory.map(item => {
          const cfg = statusConfig[item.status];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between border border-slate-100 md:hover:shadow-md md:hover:border-slate-200 transition-all gap-3 md:gap-0">
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
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10">
        <div className="max-w-md mx-auto">
          <button onClick={() => setIsFormOpen(true)} className="w-full flex items-center justify-center gap-2 bg-[#941C2F] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all">
            <CalendarPlus size={18} /><span>Ajukan KP</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/30 md:bg-slate-900/50 backdrop-blur-sm p-0 md:p-6">
          <div className="absolute inset-0" onClick={() => !isSuccess && setIsFormOpen(false)} />
          <div className="bg-white w-full max-w-md md:max-w-xl lg:max-w-2xl rounded-t-[2rem] md:rounded-[2rem] p-6 pb-8 md:p-8 animate-fade-up border-t md:border border-slate-100 relative z-10 shadow-2xl h-[85vh] md:h-auto md:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => !isSuccess && setIsFormOpen(false)} className="hidden md:flex absolute top-6 right-6 w-10 h-10 items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            {isSuccess ? (
              <div className="h-full md:h-64 flex flex-col items-center justify-center text-center animate-fade-up pb-10 md:pb-0">
                <div className="relative flex items-center justify-center mb-10 mt-8 md:mt-0">
                  <div className="absolute w-32 h-32 bg-[#941C2F]/5 rounded-full animate-ping" />
                  <div className="absolute w-24 h-24 bg-[#941C2F]/10 rounded-full" />
                  <div className="relative w-16 h-16 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30"><Check size={32} strokeWidth={3} /></div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengajuan Berhasil!</h2>
                <p className="text-sm text-slate-500">Formulir Kelas Pengganti Anda telah disubmit.</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
                <div className="mb-6 pr-10 md:pr-0">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">Pengajuan KP</h2>
                  <p className="text-xs md:text-sm text-slate-500">Isi formulir untuk mengajukan Kelas Pengganti.</p>
                </div>
                <div className="space-y-5">
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
                  <div className="mb-8">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">Alasan Pengajuan</label>
                    <textarea value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Masukkan alasan Anda..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28" />
                  </div>
                  <div className="md:flex md:justify-end md:pt-4 md:border-t md:border-slate-100">
                    <button onClick={handleSubmit} disabled={!ruangan.trim() || !alasan.trim()}
                      className="w-full md:w-auto bg-[#941C2F] text-white font-bold py-4 md:py-3.5 md:px-10 rounded-xl md:rounded-2xl shadow-md shadow-[#941C2F]/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-[#7a1727]">
                      Kirim Pengajuan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
