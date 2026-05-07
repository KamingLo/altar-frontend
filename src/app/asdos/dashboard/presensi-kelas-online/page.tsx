'use client';
import React, { useState } from 'react';
import { Check, Clock, Send, Link2, BookOpen, ArrowLeft } from 'lucide-react';

const mockOnlineSessions = [
  {
    id: 1,
    sessionName: 'SESI 1',
    subject: 'Basis Data',
    platform: 'Online',
    time: '07:30 - 10:00',
    status: 'Aktif',
  },
  {
    id: 2,
    sessionName: 'SESI 2',
    subject: 'Algoritma Pemrograman',
    platform: 'Online',
    time: '10:30 - 13:00',
    status: 'Aktif',
  },
  {
    id: 3,
    sessionName: 'SESI 3',
    subject: 'Sistem Operasi',
    platform: 'Online',
    time: '13:30 - 16:00',
    status: 'Mendatang',
  },
];

export default function PresensiKelasOnlinePage() {
  const [step, setStep] = useState(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [materi, setMateri] = useState('');


  const selectedSession = mockOnlineSessions.find((s) => s.id === selectedSessionId);


  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });


  const handleReset = () => {
    setStep(1);
    setSelectedSessionId(null);
    setLink('');
    setMateri('');
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-8 pt-2">
      
      {step === 1 && (
        <div className="animate-fade-up px-1">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pilih Sesi Online</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Pilih jadwal kelas online yang akan Anda laporkan hari ini.
          </p>

          <div className="space-y-4">
            {mockOnlineSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'bg-white border-2 border-[#941C2F] shadow-md' 
                      : 'bg-white border-2 border-transparent hover:border-slate-200'
                    }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-sm">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider
                      ${session.status === 'Aktif' ? 'bg-[#941C2F]/10 text-[#941C2F]' : 'bg-slate-100 text-slate-500'}`}>
                      {session.sessionName}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#941C2F]">{session.platform}</p>
                      <p className="text-[10px] text-slate-500">{session.time}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800">{session.subject}</h3>
                  
                  <div className="flex items-center gap-1.5 mt-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${session.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    <span className="text-[11px] text-slate-500 font-medium">{session.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedSessionId}
              className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Lanjut Isi Laporan
            </button>
          </div>
        </div>
      )}

      {step === 2 && selectedSession && (
        <div className="animate-fade-up px-1">
          <button 
            onClick={() => setStep(1)} 
            className="text-[#941C2F] mb-5 active:scale-95 transition-transform hover:opacity-80"
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Presensi Online</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Kirim laporan presensi kelas online Anda hari ini.
          </p>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 mb-6">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider bg-[#941C2F]/10 text-[#941C2F]">
                {selectedSession.sessionName}
              </span>
              <div className="text-right">
                <p className="text-xs font-bold text-[#941C2F]">{selectedSession.platform}</p>
                <p className="text-[10px] text-slate-400">{selectedSession.time}</p>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-800 mb-4">{selectedSession.subject}</h3>
            
            <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <Clock size={12} className="text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">Melaporkan pada: <span className="font-bold text-slate-700">{currentTime} WIB</span></span>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2 ml-1">
              <Link2 size={14} className="text-slate-400" />
              <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Tautan / Link Video
              </label>
            </div>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Masukkan link Teams / rekaman..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-2 ml-1">
              <BookOpen size={14} className="text-slate-400" />
              <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Laporan / Bahasan Materi
              </label>
            </div>
            <div className="relative">
              <textarea
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Ketik detail bahasan materi hari ini..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-28 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              ></textarea>
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-medium">
                {materi.length} karakter
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-[#941C2F] leading-relaxed ml-1 mb-8">
            * Mohon isi tautan dan materi dengan jelas sebagai bukti presensi kehadiran asisten dosen.
          </p>

          <div>
            <button
              onClick={() => setStep(3)}
              disabled={link.trim().length === 0 || materi.trim().length === 0} 
              className="w-full flex items-center justify-center gap-2 bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              <Send size={18} />
              <span>Kirim</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedSession && (
        <div className="animate-fade-up flex flex-col items-center text-center mt-2 px-1">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Presensi Berhasil!</h1>
          <p className="text-sm text-slate-500 mb-8 px-4">
            Laporan kehadiran online Anda telah berhasil terkirim ke sistem.
          </p>

          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-32 h-32 bg-[#941C2F]/5 rounded-full animate-ping"></div>
            <div className="absolute w-24 h-24 bg-[#941C2F]/10 rounded-full"></div>
            <div className="relative w-16 h-16 bg-[#941C2F] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#941C2F]/30">
              <Check size={32} strokeWidth={3} />
            </div>
          </div>

          <div className="bg-white w-full p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#941C2F]/20 to-transparent"></div>
            
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Presensi Online</p>
            <h2 className="text-lg font-bold text-slate-800 mb-6 leading-tight">
              {selectedSession.subject} - {selectedSession.platform}
            </h2>

            <div className="border-t border-slate-100 py-5">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Dikirim Pada</p>
              <p className="text-xl font-bold text-[#941C2F]">{currentTime} WIB</p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
              Terima kasih telah melaporkan kehadiran Anda. Anda dapat melihat detailnya kembali di menu Riwayat.
            </p>
          </div>

          <div className="w-full">
            <button
              onClick={handleReset}
              className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}