'use client';
import React, { useState } from 'react';
import { CalendarPlus, Clock, CheckCircle2, XCircle, ArrowLeft, Check } from 'lucide-react';
type KpStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

type KpHistoryItem = {
  id: number;
  room: string;
  day: string;
  time: string;
  reason: string;
  status: KpStatus;
};

const mockKpHistory: KpHistoryItem[] = [
  {
    id: 1,
    room: 'Ruang 901',
    day: 'KAMIS',
    time: '14:00 (JAM 2.00)',
    reason: 'Ada jadwal bentrok dengan praktikum wajib di lab lain.',
    status: 'MENUNGGU',
  },
  {
    id: 2,
    room: 'Ruang Lab Komputer A',
    day: 'RABU',
    time: '15:30 (JAM 3.30)',
    reason: 'Sakit tifus, surat keterangan dokter sudah diserahkan ke prodi.',
    status: 'DISETUJUI',
  },
  {
    id: 3,
    room: 'Ruang 805',
    day: 'SENIN',
    time: '13:00 (JAM 1.00)',
    reason: 'Acara keluarga mendadak di luar kota.',
    status: 'DITOLAK',
  },
];

export default function PengajuanKpPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [ruangan, setRuangan] = useState('');
  const [hari, setHari] = useState('Selasa');
  const [waktu, setWaktu] = useState('14:30 (Jam 2.30)');
  const [alasan, setAlasan] = useState('');

  const renderStatusBadge = (status: KpStatus) => {
    switch (status) {
      case 'MENUNGGU':
        return (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">
            <Clock size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wider uppercase">Menunggu</span>
          </div>
        );
      case 'DISETUJUI':
        return (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">
            <CheckCircle2 size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wider uppercase">Disetujui</span>
          </div>
        );
      case 'DITOLAK':
        return (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">
            <XCircle size={12} strokeWidth={2.5} />
            <span className="text-[10px] font-bold tracking-wider uppercase">Ditolak</span>
          </div>
        );
    }
  };

  const handleSubmit = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsFormOpen(false);
      setRuangan('');
      setAlasan('');
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-24 pt-2 relative min-h-screen">
      
      <div className="px-3 animate-fade-up">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Riwayat KP</h1>
          <p className="text-sm text-slate-500">Daftar pengajuan Kelas Pengganti Anda.</p>
        </div>

        <div className="space-y-4">
          {mockKpHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-1">{item.room}</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    {item.day} • {item.time}
                  </p>
                </div>
                {renderStatusBadge(item.status)}
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <p className="text-[12px] text-slate-600 leading-relaxed italic">
                  "{item.reason}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-10">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all"
          >
            <CalendarPlus size={18} />
            <span>Ajukan KP</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => !isSuccess && setIsFormOpen(false)}></div>
          
          <div 
            className="bg-white w-full max-w-md rounded-t-[2rem] p-6 pb-8 animate-fade-up border-t border-slate-100 relative z-10 shadow-2xl h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center animate-fade-up pb-10">
                <div className="relative flex items-center justify-center mb-10 mt-8">
                  <div className="absolute w-32 h-32 bg-[#941C2F]/5 rounded-full animate-ping"></div>
                  <div className="absolute w-24 h-24 bg-[#941C2F]/10 rounded-full"></div>
                  <div className="relative w-16 h-16 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30">
                    <Check size={32} strokeWidth={3} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengajuan Berhasil!</h2>
                <p className="text-sm text-slate-500">Formulir Kelas Pengganti Anda telah disubmit.</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Pengajuan KP</h2>
                  <p className="text-xs text-slate-500">Isi formulir untuk mengajukan Kelas Pengganti.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                        Ruangan
                      </label>
                      <input
                        type="text"
                        value={ruangan}
                        onChange={(e) => setRuangan(e.target.value)}
                        placeholder="R705"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                        Jadwal Hari
                      </label>
                      <select
                        value={hari}
                        onChange={(e) => setHari(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-sm appearance-none"
                      >
                        <option value="Senin">Senin</option>
                        <option value="Selasa">Selasa</option>
                        <option value="Rabu">Rabu</option>
                        <option value="Kamis">Kamis</option>
                        <option value="Jumat">Jumat</option>
                        <option value="Sabtu">Sabtu</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                      Waktu Ajar
                    </label>
                    <select
                      value={waktu}
                      onChange={(e) => setWaktu(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-sm appearance-none"
                    >
                      <option value="07:30 (Jam 1.00)">07:30 (Jam 1.00)</option>
                      <option value="10:30 (Jam 2.00)">10:30 (Jam 2.00)</option>
                      <option value="13:00 (Jam 3.00)">13:00 (Jam 3.00)</option>
                      <option value="14:30 (Jam 2.30)">14:30 (Jam 2.30)</option>
                      <option value="15:30 (Jam 3.30)">15:30 (Jam 3.30)</option>
                    </select>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
                      Alasan Pengajuan
                    </label>
                    <textarea
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Masukkan alasan Anda..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28 shadow-sm"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={ruangan.trim().length === 0 || alasan.trim().length === 0}
                    className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}