'use client';
import React, { useState } from 'react';
import { Check, Scan, ArrowLeft, Clock } from 'lucide-react';

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

  
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full max-w-md mx-auto font-sans text-slate-800 pb-8 pt-2">
      
      
      {step === 1 && (
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pindai Kode QR</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-16">
            Arahkan kamera Anda ke kode QR yang disediakan oleh Koordinator di depan kelas.
          </p>
          
          <div 
            className="relative w-64 h-64 mx-auto cursor-pointer active:scale-95 transition-transform"
            onClick={() => setStep(2)}
          >
            <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-[#941C2F] rounded-tl-3xl"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-[#941C2F] rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-[#941C2F] rounded-bl-3xl"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-[#941C2F] rounded-br-3xl"></div>
            
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)] opacity-80"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10">
              <Scan size={80} />
            </div>
            
            <div className="absolute -bottom-10 left-0 right-0 text-center text-xs text-slate-400 italic">
              *Klik area ini untuk simulasi scan
            </div>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="animate-fade-up">
          
          <button 
            onClick={() => setStep(1)} 
            className="text-[#941C2F] mb-5 active:scale-95 transition-transform hover:opacity-80"
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Check-out</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Isi laporan bahasan materi hari ini.
          </p>
          
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 mb-6">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider bg-[#941C2F]/10 text-[#941C2F]">
                {activeSession.sessionName}
              </span>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{activeSession.room}</p>
                <p className="text-[10px] text-slate-400">{activeSession.time}</p>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-slate-800 mb-4">{activeSession.subject}</h3>
            
            <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <Clock size={12} className="text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">Check-in: <span className="font-bold text-slate-700">{activeSession.checkInTime}</span></span>
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2 ml-1">
              Bahasan Materi
            </label>
            <div className="relative">
              <textarea
                value={materi}
                onChange={(e) => setMateri(e.target.value)}
                placeholder="Ketik bahasan materi yang diajarkan..."
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] transition-all resize-none h-32 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              ></textarea>
              <div className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-medium">
                {materi.length} karakter
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-[#941C2F] leading-relaxed ml-1 mb-8">
            * Mohon isi bahasan materi dengan jelas untuk keperluan rekapitulasi kehadiran asisten dosen.
          </p>
          
          <div>
            <button
              onClick={() => setStep(3)}
              disabled={materi.trim().length === 0}
              className="w-full bg-[#941C2F] text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Check-out Sekarang
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-up flex flex-col items-center text-center mt-2">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Check-Out Berhasil!</h1>
          <p className="text-sm text-slate-500 mb-8">
            Sesi mengajar Anda telah diselesaikan dan dicatat.
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
            
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Detail Sesi Diselesaikan</p>
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {activeSession.subject} - {activeSession.room.replace('R.', 'Ruang')}
            </h2>

            <div className="border-t border-slate-100 py-5">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Check-out Pada</p>
              <p className="text-xl font-bold text-[#941C2F]">{currentTime} WIB</p>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-5">
              Terima kasih telah mengajar hari ini. Anda dapat melihat detailnya di menu Riwayat.
            </p>
          </div>

          <div className="w-full">
            <button
              onClick={() => setStep(1)} 
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